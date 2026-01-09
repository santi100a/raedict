import DictServer = require('@santi100a/dict-server');
import formatCategoryString from './lib/libformat';
import processUsage from './lib/libusage';
import writeConjugationTable from './lib/libconjugationtable';
import { defineHandler } from './define.handler';

const server = new DictServer();
const PORT = process.env.PORT ?? 2628;

server.onCommand((command, response) => {
	console.log(`COMMAND from ${response.remoteAddress}: ${command.raw}`);
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

server.match(async (command, response) => {
	const [dictionary, strategy, ...rest] = command.parameters;

	if (!dictionary || !strategy || rest.length === 0) {
		response.error(501);
		return;
	}

	if (!['dle', '*', '!'].includes(dictionary.toLowerCase())) {
		response.error(550);
		return;
	}

	const query = rest.join(' ').replace(/(^['"])|(['"]$)/g, '');
	let strat = strategy.toLowerCase();
	if (['.', '=', '!', '*'].includes(strat)) strat = 'exact';
	if (['~'].includes(strat)) strat = 'fuzzy';

	let engine: string;

	if (['exact', 'prefix'].includes(strat)) engine = 'linear';
	else if (['fuzzy'].includes(strat)) engine = 'hits';
	else {
		response.error(551);
		return;
	}

	const url = `https://rae-api.com/api/search?q=${encodeURIComponent(query)}&engine=${engine}`;

	let data: ErrorResponse & SearchResponse;
	try {
		const res = await fetch(url);
		if (!res.ok) {
			response.error(
				420,
				`Error del servidor al buscar: ${res.status} ${res.statusText}`,
			);
			return;
		}
		data = await res.json();
	} catch (err) {
		console.error('[ERROR] [Module MATCH] API connection error:', err);
		response.error(420, `Error de conexión con la API`);
		return;
	}

	// The API returns an array of documents with { doc: { id }, hits }
	const results = Array.isArray(data) ? data : [];

	if (results.length > 0) {
		response.writeMatches(
			results.map(result => {
				return {
					dictionary: 'dle',
					word: result.doc?.id,
				};
			}),
		);
		return;
	}
	response.error(552);
});

server.status(async (_, response) => {
	try {
		const startTime = performance.now();
		const req = await fetch('https://rae-api.com/api/daily');
		if (!req.ok) {
			response.error(
				554,
				`Error al contactar con la API de la RAE: ${req.status} ${req.statusText}`,
			);
			return;
		}
		const endTime = performance.now();
		const responseTime = endTime - startTime;

		const { data } = (await req.json()) as WordOnlyResponse;

		const wotd = data.word ?? '(desconocida)';

		response.status(
			210, [], `OK - Palabra del día: ${wotd}, tardó ${responseTime.toFixed(2)} ms en llegar\r\n`,
		);
		return;
	} catch (err) {
		console.error('[ERROR] [Module STATUS] Upstream error:', err);
		response.error(420, 'Servicio no disponible');
		return;
	}
});

server.command('AUTH', (_, response) => {
	response.status(230, [], 'Este es un servidor público, todos son bienvenidos :)');
});

server.quit((_, response) => response.status(221, [], `Fue un gusto atenderte${response.clientText ? ', '.concat(response.clientText) : ''}`).close());

server.listen(Number(PORT), () =>
	console.log(`Server ready on dict://127.0.0.1:${PORT}/`),
);
