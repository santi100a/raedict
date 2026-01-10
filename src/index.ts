import DictServer = require('@santi100a/dict-server');
import defineHandler = require('./define.handler');
import matchHandler = require('./match.handler');
import statusHandler = require('./status.handler');
import authHandler = require('./auth.handler');
import quitHandler = require('./quit.handler');

const server = new DictServer();
const PORT = Number(process.env.PORT ?? 2628);
const TIMEOUT = 30_000;

server.onConnect(response => {
	const { welcomeText, capabilities, messageId } = server;
	response.writeLine(
		`220 ${welcomeText} <${capabilities.join('.')}> <${messageId}>`,
	);

	console.info('[INFO] Connected:', response.remoteAddress);
	response.setTimeout(TIMEOUT);
	response.on('timeout', () =>
		response.close(() => {
			console.info('[INFO] Socket timeout:', response.remoteAddress);
		}),
	);
});

server.onCommand((command, response) => {
	console.info(
		'[INFO] COMMAND from',
		`${response.remoteAddress}:`,
		command.raw,
	);
});

server.setDatabases({
	name: 'dle',
	description: 'Diccionario de la Lengua Española',
});
server.setStrategies(
	{
		name: 'exact',
		description: 'Buscar la palabra exacta',
	},
	{
		name: 'prefix',
		description: 'Buscar la palabra con el principio',
	},
	{
		name: 'fuzzy',
		description: 'Buscar palabras con margen de error',
	},
);
server.setCapabilities('auth', 'mime');
server.setDatabaseInfo(
	'dle',
	`Diccionario de la Lengua Española, RAE, API no oficial <https://rae-api.com>
Fuente: API no oficial <https://rae-api.com>
Derechos de autor: (C) Real Academia Española
`,
);
server.setMessageId('12345.1234.1234567890@raedict.zapto.org');
server.setServerInfo(
	`RAE DICT en ${process.platform}, Node.js ${process.version} <https://github.com/santi100a/raedict>
(C) 2025-presente Santiago Rojas <https://github.com/santi100a>
Funciona gracias a RAE API <https://rae-api.com>`,
);
server.setWelcomeText('RAE DICT');
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
QUIT                             : Desconectarse del servidor`,
);

server.define(defineHandler);
server.match(matchHandler);
server.status(statusHandler);
server.auth(authHandler);
server.quit(quitHandler);

server.listen(PORT, () =>
	console.log(`[SUCCESS] Server ready on dict://127.0.0.1:${PORT}/`),
);

process.on('SIGINT', () => {
	console.info('[INFO] Please wait - shutting down...');
	server.shutdown().then(() => console.log('[SUCCESS] raedict done. Thank you.'));
});
