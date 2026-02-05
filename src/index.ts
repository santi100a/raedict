import DictServer = require('@santi100a/dict-server');
import defineHandler = require('./define.handler');
import matchHandler = require('./match.handler');
import statusHandler = require('./status.handler');
import authHandler = require('./auth.handler');
import quitHandler = require('./quit.handler');
import { ConnectionManager } from './lib/libconnectionmanager';

// dictd-style configuration limits
const LIMIT_CHILDS = 100; // Max simultaneous connections
const LIMIT_TIME = 600; // Max connection time in seconds (10 minutes)
const LIMIT_QUERIES = 2000; // Max queries per connection

// Rate limiting for connection attempts (anti-flood)
const RATE_LIMIT_WINDOW = 60_000; // 1 minute window
const MAX_CONNECTIONS_PER_WINDOW = 100; // Max connection attempts per IP per minute
const CLEANUP_INTERVAL = 300_000; // Clean up old entries every 5 minutes

const server = new DictServer();
const connectionManager = new ConnectionManager(
	CLEANUP_INTERVAL,
	LIMIT_CHILDS,
	RATE_LIMIT_WINDOW,
	MAX_CONNECTIONS_PER_WINDOW,
	LIMIT_TIME,
	LIMIT_QUERIES
);
const PORT = Number(process.env.PORT ?? 2628);

// Generate unique connection ID
function getConnectionId(response: any): string {
	return `${response.remoteAddress}-${Date.now()}-${Math.random()}`;
}

server.onConnect(response => {
	const ip = response.remoteAddress || 'unknown';

	// Check connection attempt rate limit (anti-flood)
	if (!connectionManager.checkConnectionRate(ip)) {
		// ANSI 33 = yellow

		console.warn(
			'\x1b[33m[WARN]\x1b[0m',
			'Connection rate limit exceeded for',
			ip
		);
		response.error(530, 'Demasiados intentos de conectarte').close();
		return;
	}

	// Check if server has reached max simultaneous connections
	if (!connectionManager.canAcceptConnection()) {
		console.warn(
			'\x1b[33m[WARN]\x1b[0m',
			'Server at max connections, rejecting',
			ip
		);
		response
			.error(420, 'Servidor no disponible. Demasiadas conexiones')
			.close();
		return;
	}

	const connectionId = getConnectionId(response);
	connectionManager.registerConnection(connectionId);

	console.info(
		'\x1b[34m[INFO]\x1b[0m',
		'Connected:',
		ip,
		`(${connectionManager.getActiveConnections()}/${LIMIT_CHILDS} active)`
	);

	// Set connection timeout based on LIMIT_TIME
	response.setTimeout(LIMIT_TIME * 1000);

	response.on('timeout', () => {
		connectionManager.unregisterConnection(connectionId);
		response.close(() => {
			console.info(
				'\x1b[34m[INFO]\x1b[0m',
				'Connection time limit reached:',
				ip
			);
		});
	});

	response.on('close', () => {
		connectionManager.unregisterConnection(connectionId);
		console.info(
			'\x1b[34m[INFO]\x1b[0m',
			'Disconnected:',
			ip,
			`(${connectionManager.getActiveConnections()}/${LIMIT_CHILDS} active)`
		);
	});

	// Store connectionId for use in command handler
	(response as any)._connectionId = connectionId;

	const { welcomeText, capabilities, messageId } = server;
	response.writeLine(
		`220 ${welcomeText} <${capabilities.join('.')}> <${messageId}>`
	);
});

server.onCommand((command, response) => {
	const ip = response.remoteAddress || 'unknown';
	const connectionId = (response as any)._connectionId;

	if (!connectionId) {
		console.error('\x1b[31m[ERROR]\x1b[0m', 'No connection ID found for', ip);
		return;
	}

	// Check if time limit exceeded
	if (connectionManager.isTimeLimitExceeded(connectionId)) {
		console.info(
			'\x1b[34m[INFO]\x1b[0m',
			'Time limit exceeded for',
			ip,
			'- closing connection'
		);
		response.close();
		return;
	}

	// Check if query limit exceeded
	if (connectionManager.isQueryLimitExceeded(connectionId)) {
		console.info(
			'\x1b[34m[INFO]\x1b[0m',
			'Query limit exceeded for',
			ip,
			'- closing connection'
		);
		response.close();
		return;
	}

	// Increment query count for queries (not for CLIENT, QUIT, etc.)
	const queryCommands = ['DEFINE', 'MATCH', 'SHOW', 'STATUS'];
	if (queryCommands.some(cmd => command.raw.toUpperCase().startsWith(cmd))) {
		connectionManager.incrementQueryCount(connectionId);
	}

	const remaining = connectionManager.getRemainingQueries(connectionId);
	console.info(
		'\x1b[34m[INFO]\x1b[0m',
		'COMMAND from',
		`${ip}:`,
		command.raw,
		`(${remaining} queries remaining)`
	);
});

server.setDatabases({
	name: 'dle',
	description: 'Diccionario de la Lengua Española'
});
server.setStrategies(
	{
		name: 'exact',
		description: 'Buscar la palabra exacta'
	},
	{
		name: 'prefix',
		description: 'Buscar la palabra con el principio'
	},
	{
		name: 'fuzzy',
		description: 'Buscar palabras con margen de error'
	}
);
server.setCapabilities('auth', 'mime');
server.setDatabaseInfo(
	'dle',
	`Diccionario de la Lengua Española, RAE, API no oficial <https://rae-api.com>
Fuente: API no oficial <https://rae-api.com>
Derechos de autor: (C) Real Academia Española
`
);
server.setMessageId('12345.1234.1234567890@raedict.zapto.org');
server.setServerInfo(
	`RAE DICT en ${process.platform}, Node.js ${process.version} <https://github.com/santi100a/raedict>
(C) 2025-presente Santiago Rojas <https://github.com/santi100a>
Funciona gracias a RAE API <https://rae-api.com>`
);
server.setWelcomeText(
	`raedict.zapto.org RAE DICT en ${process.platform}, Node.js ${process.version}`
);
server.setHelpText(
	`DEFINE dle <palabra>             : Obtener definiciones de palabras
MATCH dle <estrategia> <palabra> : Buscar palabras que coincidan con un patrón
SHOW DATABASES o SHOW DB         : Mostrar diccionarios disponibles (solamente hay uno: 'dle'; comando para compatibilidad)
SHOW STRATEGIES o SHOW STRAT     : Mostrar estrategias disponibles para el comando MATCH
SHOW INFO dle                    : Mostrar información del diccionario de la RAE
SHOW SERVER                      : Mostrar información del servidor
OPTION MIME                      : Habilitar encabezados MIME
CLIENT [nombre]                  : Identificarse con el servidor
STATUS                           : Verificar el estado del servicio
HELP                             : Mostrar esta guía de comandos
QUIT                             : Desconectarse del servidor`
);

server.define(defineHandler);
server.match(matchHandler);
server.status(statusHandler);
server.auth(authHandler);
server.quit(quitHandler);
server.client((command, response) => {
	response.clientText = command.parameters.join(' ').trim();
	response.ok(
		`OK${response.clientText ? ' - Bienvenido/a, '.concat(response.clientText) : ''}`
	);
});

server.listen(PORT, () =>
	// ANSI 32 = green
	console.log(
		'\x1b[32m[SUCCESS]\x1b[0m',
		`Server ready on dict://127.0.0.1:${PORT}/`
	)
);

process.on('SIGINT', () => {
	console.info('\x1b[34m[INFO]\x1b[0m', 'Please wait - shutting down...');
	connectionManager.shutdown();
	server.shutdown().then(() => {
		console.log('\x1b[32m[SUCCESS]\x1b[0m', 'raedict done. Thank you.');
		process.exit(0);
	});
});
