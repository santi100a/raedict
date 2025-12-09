import type { Socket } from 'node:net';
import writeSenseBlock from './lib/libsenseblock';
import writeConjugationTable from './lib/libconjugationtable';
import countDefinitions from './lib/libcountdefinitions';

export default async function command(
	socket: Socket,
	tokens: string[],
	optionRef: { conjugations: boolean },
) {
	try {
		let dictionary = tokens[1];
		const rawQuery = tokens[2] ?? '';
		const queryWord = String(rawQuery).replace(/(^['"])|(['"]$)/g, '');

		// -------------------------------
		// Validation
		// -------------------------------
		if (!dictionary) {
			socket.write(
				'501 No has especificado el diccionario. Solamente tenemos "dle", por cierto\r\n',
			);
			return;
		}
		if (!queryWord) {
			socket.write('501 No has especificado la palabra a definir\r\n');
			return;
		}

		// DICT special cases
		if (dictionary === '*' || dictionary === '!') dictionary = 'dle';

		if (dictionary !== 'dle') {
			socket.write('550 Solamente tenemos un diccionario: "dle"\r\n');
			return;
		}

		// -------------------------------
		// Fetch from API
		// -------------------------------
		const response = await fetch(`https://rae-api.com/api/words/${queryWord}`);
		const result = await response.json();

		if (response.status === 404 || !result?.data?.meanings?.length) {
			socket.write(
				`552 No hay coincidencia para la palabra "${queryWord}"${
					result.suggestions
						? '. Puede(n) estar relacionada(s): ' +
							result.suggestions.join(', ')
						: ''
				}\r\n`,
			);
			return;
		}

		if (!response.ok) {
			socket.write(
				`554 Error del servidor al obtener la definición: ${response.status} ${response.statusText}\r\n`,
			);
			return;
		}

		// -------------------------------
		// Parse response
		// -------------------------------
		const meanings = result.data.meanings;
		const headword = result.data.word ?? queryWord;

		const defCount = countDefinitions(meanings);

		socket.write(
			`150 ${defCount} ${
				defCount === 1 ? 'definición encontrada' : 'definiciones encontradas'
			} para "${headword}"\r\n`,
		);

		// -------------------------------------
		// NEW: show conjugation table only once
		// -------------------------------------

		for (const { origin, senses, conjugations } of meanings) {
			socket.write(
				`151 "${headword}" dle "Diccionario de la Lengua Española"\r\n`,
			);
			socket.write('\r\n');
			if (origin?.raw) socket.write(`Origen: ${origin.raw}\r\n`);
			if (optionRef.conjugations) writeConjugationTable(socket, conjugations);
			for (const sense of senses) {
				writeSenseBlock(
					socket,
					headword,
					origin,
					sense,
					conjugations,
					optionRef.conjugations,
				);
			}
		socket.write('\r\n.\r\n');
		}

		socket.write('250 OK\r\n');
	} catch (err) {
		console.error('Error running DEFINE command:', err);
		socket.write('554 Error interno al obtener las definiciones\r\n');
	}
}
