/// <reference path="lib/libapi.d.ts" />

import type { Socket } from 'node:net';
import writeSenseBlock from './lib/libsenseblock';
import writeConjugationTable from './lib/libconjugationtable';

export default async function command(
	socket: Socket,
	tokens: string[],
	optionRef: { conjugations: boolean },
): Promise<void> {
	try {
		//------------------------------------
		// Extract + Sanitize Input
		//------------------------------------
		let dictionary = tokens[1];
		const rawQuery = tokens[2];
		const queryWord = rawQuery?.replace(/(^['"])|(['"]$)/g, '') ?? '';

		//------------------------------------
		// Validation
		//------------------------------------
		if (!dictionary) {
			socket.write(
				'501 No has especificado el diccionario. Solamente tenemos "dle"\r\n',
			);
			return;
		}

		if (!queryWord) {
			socket.write('501 No has especificado la palabra a definir\r\n');
			return;
		}

		// DICT protocol wildcards
		if (dictionary === '*' || dictionary === '!') dictionary = 'dle';

		if (dictionary !== 'dle') {
			socket.write('550 Solamente está disponible el diccionario "dle"\r\n');
			return;
		}

		//------------------------------------
		// Fetch from API
		//------------------------------------
		const url = `https://rae-api.com/api/words/${encodeURIComponent(queryWord)}`;
		const response = await fetch(url);

		let result: WordEntryResponse & ErrorResponse;
		try {
			result = await response.json();
		} catch {
			socket.write('554 Error al interpretar la respuesta del servidor\r\n');
			return;
		}

		//------------------------------------
		// Not found
		//------------------------------------
		const meanings = result?.data?.meanings ?? [];

		if (response.status === 404 || meanings.length === 0) {
			const msg =
				`552 No hay coincidencia para "${queryWord}"` +
				(result.suggestions
					? `. Sugerencias: ${result.suggestions.join(', ')}`
					: '');
			socket.write(msg + '\r\n');
			return;
		}

		if (!response.ok) {
			socket.write(
				`554 Error del servidor: ${response.status} ${response.statusText}\r\n`,
			);
			return;
		}

		//------------------------------------
		// Begin DICT Response
		//------------------------------------
		const headword = result.data.word || queryWord;
		const blockCount = meanings.length;

		socket.write(
			`150 ${blockCount} ${blockCount === 1 ? 'significado' : 'significados'}\r\n`,
		);

		//------------------------------------
		// Emit Each Block
		//------------------------------------
		for (const meaning of meanings) {
			socket.write(
				`151 "${headword}" dle "Diccionario de la Lengua Española"\r\n`,
			);

			// GoldenDict quirk fix: mandatory blank line
			socket.write('\r\n');

			// ---------------------
			// Origin (if present)
			// ---------------------
			if (meaning.origin?.raw) {
				// DICT spec: backslash blocks are allowed, not multiline.
				socket.write(`\\${meaning.origin.raw}\\\r\n`);
			}

			// ---------------------
			// Definition senses
			// ---------------------
			for (const sense of meaning.senses) {
				writeSenseBlock(socket, sense);
			}

			// ---------------------
			// Conjugation Table
			// ---------------------
			if (optionRef.conjugations) {
				writeConjugationTable(socket, meaning.conjugations);
				socket.write('\r\n');
			}

			socket.write('.\r\n'); // end of block
		}

		socket.write('250 OK\r\n');
	} catch (err) {
		console.error('DEFINE internal error:', err);
		socket.write('554 Error interno al obtener las definiciones\r\n');
	}
}
