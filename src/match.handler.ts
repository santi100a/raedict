import type { DictCommand } from '@santi100a/dict-server/dist/lib/libtypes';
import type { DictResponse } from '@santi100a/dict-server/dist/response.class';

console.info('[INFO] MATCH module loaded.');

export = async function match(command: DictCommand, response: DictResponse) {
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
};
