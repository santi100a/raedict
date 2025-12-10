import * as net from 'node:net';

import tokenize from './lib/libtokenize';
import send from './lib/libsend';
import acquireGlobalApiSlot from './lib/libslot';
import {
	incrementIpConn,
	recordCommandFromIp,
	decrementIpConn,
} from './lib/libip';
import runWithTimeout from './lib/librun';

import quit from './quit';
import help from './help';
import client from './client';
import show from './show';
import define from './define';
import match from './match';
import status from './status';
import option from './option';
import auth from './auth';
import { log, warn } from 'node:console';

const DICT_PORT = Number(process.env.PORT ?? 2628);

// ---------- TUNABLES ----------
const TCP_IDLE_TIMEOUT = 30_000;
const MAX_LINE_LENGTH = 8_192;
const MAX_BUFFER_LENGTH = 16_384;
const MAX_CONNECTIONS = Number(process.env.MAX_CONN ?? 400);
const PER_IP_MAX_CONNECTIONS = 6;
const RATE_WINDOW_MS = 60_000;
const MAX_COMMANDS_PER_WINDOW = 120;
const MAX_INFLIGHT_PER_SOCKET = 3; // note: we still keep this as an upper policy
const GLOBAL_API_CONCURRENCY = 16;
const COMMAND_TIMEOUT_MS = 20_000;

// ---------- STATE ----------
const clientNames = new Map<net.Socket, string>();
const optionRef = { conjugations: false };
const ipConnCounts = new Map<string, number>();
const ipCommandWindows = new Map<string, number[]>();

let globalApiInFlight = 0;
const globalApiQueue: Array<() => void> = [];

/* --------------------------------------------------------
   SIMPLE TTL MEMORY CACHE
---------------------------------------------------------*/
const CACHE_TTL_MS = 5 * 60_000; // 5 minutes
interface CacheEntry<T> {
	value: T;
	expires: number;
}
const memoryCache = new Map<string, CacheEntry<any>>();

function cacheGet<T>(key: string): T | null {
	const entry = memoryCache.get(key);
	if (!entry) return null;
	if (Date.now() > entry.expires) {
		memoryCache.delete(key);
		return null;
	}
	return entry.value;
}
function cacheSet<T>(key: string, value: T) {
	memoryCache.set(key, {
		value,
		expires: Date.now() + CACHE_TTL_MS,
	});
}

/* --------------------------------------------------------
   CAPTURE-SEND WRAPPER (captures send() *and* socket.write())
   Returns a function that restores originals and returns the captured buffer.
---------------------------------------------------------*/
function captureSend(socket: net.Socket) {
	let buffer = '';

	// capture the module-level send
	const origSend = send as unknown as (s: net.Socket, text: string) => void;

	// patch module send (note: this modifies the local binding `send`)
	(send as unknown as any) = (sock: net.Socket, text: string) => {
		if (sock === socket) buffer += text;
		origSend(sock, text);
	};

	// capture direct socket.write calls (for handlers that call socket.write directly)
	const origSocketWrite = socket.write;
	socket.write = function (data: any, encoding?: any, cb?: any) {
		try {
			// data can be Buffer|string
			if (data != null) buffer += data.toString ? data.toString() : String(data);
		} catch (e) {
			// ignore capture errors
		}
		// preserve original behaviour & return its result
		return origSocketWrite.call(this, data, encoding, cb);
	};

	// return restore function
	return () => {
		// restore module send and socket.write
		try {
			(send as unknown as any) = origSend;
		} catch {}
		try {
			socket.write = origSocketWrite;
		} catch {}
		return buffer;
	};
}

/* ------------------------------------------------------ */

const server = net.createServer(socket => {
	if ((server as any).connections >= MAX_CONNECTIONS) {
		try {
			socket.end('421 Demasiadas conexiones\r\n');
		} catch {}
		return;
	}

	socket.setNoDelay(true);
	socket.setTimeout(TCP_IDLE_TIMEOUT);

	const ipOk = incrementIpConn(socket, ipConnCounts, PER_IP_MAX_CONNECTIONS);
	if (!ipOk) {
		send(socket, '421 Demasiadas conexiones desde tu dirección IP');
		socket.destroy();
		return;
	}

	log(
		'Connection established from',
		socket.remoteAddress,
		'port',
		String(socket.remotePort),
	);

	let buffer = '';
	let inflight = 0;

	// per-socket promise chain to ensure ordered processing of commands from a single client
	let processing: Promise<void> = Promise.resolve();

	send(
		socket,
		`220 RAE DICT (https://github.com/santi100a/raedict) en ${
			process.platform
		}, Node.js ${process.version} a tu servicio <mime.utf8.conj> <${Math.floor(
			Math.random() * 99999999999,
		)}@raedict.zapto.org>`,
	);

	socket.on('timeout', () => {
		log('Socket timeout for', socket.remoteAddress);
		send(socket, '421 Se agotó el tiempo de espera');
		socket.end();
	});

	socket.on('data', async chunk => {

		if (chunk.length > MAX_BUFFER_LENGTH) {
			warn('Rejecting huge data chunk from', socket.remoteAddress);
			send(socket, '500 Entrada demasiado grande');
			socket.destroy();
			return;
		}

		let text = chunk.toString('utf8').replace(/\uFFFD/g, '');
		if (text.includes('\0')) {
			warn('Null byte in input, dropping connection', socket.remoteAddress);
			socket.destroy();
			return;
		}

		buffer += text;
		if (buffer.length > MAX_BUFFER_LENGTH) {
			send(socket, '500 Línea o búfer demasiado largos');
			buffer = '';
			return;
		}

		let idx;
		while ((idx = buffer.indexOf('\r\n')) !== -1) {
			const line = buffer.slice(0, idx);
			buffer = buffer.slice(idx + 2);

			log(
				`COMMAND from ${socket.remoteAddress}:${socket.remotePort} → ${line}`,
			);

			if (line.length > MAX_LINE_LENGTH) {
				send(socket, '500 Línea demasiado larga');
				continue;
			}

			// rate limit per IP (sliding window)
			if (
				!recordCommandFromIp(
					socket,
					ipCommandWindows,
					RATE_WINDOW_MS,
					MAX_COMMANDS_PER_WINDOW,
				)
			) {
				warn('Rate limit exceeded for', socket.remoteAddress);
				send(socket, '421 Demasiadas solicitudes; inténtalo más tarde');
				socket.destroy();
				return;
			}

			// enqueue the work on the per-socket processing chain so commands execute in-order
			const task = async () => {
				// enforce a soft maximum of concurrent in-flight handlers per socket as a policy.
				// since we are serializing, this typically will be <= 1, but we keep the counter and check.
				if (inflight >= MAX_INFLIGHT_PER_SOCKET) {
					// politely reject if already too many
					send(socket, '425 Demasiadas solicitudes simultáneas; espera');
					return;
				}

				inflight++;
				try {
					await runWithTimeout(
						() => handleCommand(line, socket),
						COMMAND_TIMEOUT_MS,
					);
				} catch (err: any) {
					if (err?.message === 'command-timeout') {
						warn('Command timeout for', socket.remoteAddress, 'line=', line);
						send(socket, '421 Tiempo de espera agotado para el comando');
					} else {
						warn('Error handling command:', err);
						send(socket, '500 Error interno al procesar el comando');
					}
				} finally {
					inflight--;
				}
			};

			// chain tasks so they run strictly in order
			processing = processing.then(task, task);
		}
	});

	socket.on('error', err => warn('Socket error', socket.remoteAddress, err));

	socket.on('end', () => {
		decrementIpConn(socket, ipConnCounts);
		clientNames.delete(socket);
		log('Connection closed', socket.remoteAddress);
	});
});

server.maxConnections = MAX_CONNECTIONS;

/* --------------------------------------------------------
   handleCommand with captureSend-aware caching
---------------------------------------------------------*/

async function handleCommand(line: string, socket: net.Socket) {
	const raw = line.trim();
	if (raw.length === 0) {
		return send(socket, '500 Línea vacía');
	}

	const verb = raw.split(/\s+/, 1)[0].toUpperCase();
	let tokens: string[] | null = null;

	switch (verb) {
		case 'QUIT':
			return quit(socket, null, clientNames);
		case 'HELP':
			return help(socket);
		case 'CLIENT':
			tokens = tokenize(line);
			return client(socket, tokens, clientNames);
		case 'SHOW':
			tokens = tokenize(line);
			return show(socket, tokens);
		case 'STATUS':
			return status(socket);
		case 'OPTION':
			tokens = tokenize(line);
			return option(socket, tokens, optionRef);
		case 'AUTH':
			return auth(socket);

		/* --------------------------------------------------------
		   DEFINE with correct output capture
		---------------------------------------------------------*/
		case 'DEFINE': {
			tokens = tokenize(line);
			const cacheKey = `DEFINE:${tokens.slice(1).join(' ')}`;
			const cached = cacheGet<string>(cacheKey);
			if (cached) return send(socket, cached);

			const stopCapture = captureSend(socket);

			const release = await acquireGlobalApiSlot(
				globalApiInFlight,
				globalApiQueue,
				GLOBAL_API_CONCURRENCY,
			);

			try {
				await define(socket, tokens, optionRef);
				const output = stopCapture();
				if (output.trim().length) cacheSet(cacheKey, output);
			} finally {
				release();
			}
			return;
		}

		/* --------------------------------------------------------
		   MATCH with capture
		---------------------------------------------------------*/
		case 'MATCH': {
			tokens = tokenize(line);
			const cacheKey = `MATCH:${tokens.slice(1).join(' ')}`;
			const cached = cacheGet<string>(cacheKey);
			if (cached) return send(socket, cached);

			const stopCapture = captureSend(socket);

			await match(socket, tokens);
			const output = stopCapture();
			if (output.trim().length) cacheSet(cacheKey, output);

			return;
		}

		default:
			return send(socket, '501 Comando desconocido');
	}
}

process.on('SIGINT', () => {
	log('Shutting down...');
	server.close(() => process.exit(0));
});

server.listen(DICT_PORT, () => {
	log(`Listening on dict://127.0.0.1:${DICT_PORT}`);
});
