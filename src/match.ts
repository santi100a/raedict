import type { Socket } from 'node:net';

export default async function command(socket: Socket, tokens: string[]) {
	const [_, dictionary, strategy, ...rest] = tokens;

	if (!dictionary || !strategy || rest.length === 0) {
		socket.write('501 Uso: MATCH dle <estrategia> <patrón>\r\n');
		return;
	}

	if (!['dle', '*', '!'].includes(dictionary.toLowerCase())) {
		socket.write('550 Solamente tenemos un diccionario: "dle"\r\n');
		return;
	}

	const query = rest.join(' ').replace(/(^['"])|(['"]$)/g, '');
	let strat = strategy.toLowerCase();
	if (['.', '=', '!', '*'].includes(strat)) strat = 'exact';
	if (['~'].includes(strat)) strat = 'fuzzy';

	let engine: string;

	if (strat === 'exact') engine = 'linear';
	else if (strat === 'fuzzy') engine = 'hits';
	else {
		socket.write('551 Estrategia desconocida. Usa: exact, fuzzy\r\n');
		return;
	}

	const url = `https://rae-api.com/api/search?q=${encodeURIComponent(query)}&engine=${engine}`;

	let data;
	try {
		const res = await fetch(url);
		if (!res.ok) {
			socket.write(
				`554 Error del servidor al buscar: ${res.status} ${res.statusText}\r\n`,
			);
			return;
		}
		data = await res.json();
	} catch (err) {
		console.error('[ERROR] [Module MATCH] API connection error:', err);
		socket.write(`554 Error de conexión con la API\r\n`);
		return;
	}

	// The API returns an array of documents with { doc: { id }, hits }
	const results = Array.isArray(data) ? data : [];

	if (results.length === 0) {
		socket.write(`552 No hay coincidencias para el patrón "${query}"\r\n`);
		return;
	}

	socket.write(
		`152 ${results.length} ${
			results.length === 1
				? 'coincidencia encontrada'
				: 'coincidencias encontradas'
		} para "${query}"\r\n`,
	);

	for (const r of results) {
		socket.write('dle '.concat('"', r.doc?.id, '"', '\r\n'));
	}

	socket.write('.\r\n');
	socket.write('250 OK\r\n');
}
