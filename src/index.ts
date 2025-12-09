import * as net from 'node:net';

import tokenize from './lib/libtokenize';

import quit from './quit';
import help from './help';
import client from './client';
import show from './show';
import define from './define';
import match from './match';
import status from './status';
import option from './option';
import auth from './auth';

const DICT_PORT = process.env.PORT ?? 2628;
const clientNames = new Map<net.Socket, string>();
const optionRef = { conjugations: false };
const server = net.createServer((socket) => {
	socket.write(
		`220 RAE DICT en ${process.platform}, Node.js ${process.version} <https://github.com/santi100a/raedict> a tu servicio - Funciona con <https://rae-api.com>\r\n`,
	);

	socket.on('connect', () => {
		console.info('[INFO] Connection established.');
	});

	let buffer = ''; // per-connection buffer

	socket.on('data', async (chunk) => {
		buffer += chunk.toString('utf8');

		// Process each full line
		let index: number;
		while ((index = buffer.indexOf('\r\n')) !== -1) {
			const line = buffer.slice(0, index);
			buffer = buffer.slice(index + 2); // remove processed line

			await handleCommand(line.trim(), socket);
		}
	});

	socket.on('error', () => {
		console.warn('[WARN] Connection dropped.');
	});

	socket.on('end', () => {
		// connection closed
		clientNames.delete(socket);
		console.info('[INFO] Connection closed.');
	});
});

// Example command handler
async function handleCommand(line: string, socket: net.Socket) {
	console.info('[INFO] Received command:', line);
	if (!line.trim()) {
		socket.write('500 Línea vacía\r\n');
		return;
	}

	// Extract verb only (before any whitespace)
	const verb = line.split(/\s+/, 1)[0].toUpperCase();
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

		case 'DEFINE':
			tokens = tokenize(line);
			await define(socket, tokens, optionRef);
			return;

		case 'MATCH':
			tokens = tokenize(line);
			await match(socket, tokens);
			return;
		case 'STATUS':
			await status(socket);
			return;
		case 'OPTION':
			tokens = tokenize(line);
			option(socket, tokens, optionRef);
			return;
		case 'AUTH':
			auth(socket);
			return;
	}

	socket.write('501 Comando desconocido\r\n');
}

server.listen(DICT_PORT, () => {
	console.log(`[SUCCESS] Listening on: dict://127.0.0.1:${DICT_PORT}`);
});
