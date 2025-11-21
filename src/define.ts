import type { Socket } from 'node:net';
import { processConjugation } from './lib/libconjugations';
import { formatCategoryString } from './lib/libformat';

export default async function command(socket: Socket, tokens: string[]) {
	try {
		let dictionary = tokens[1];
		const rawQuery = tokens[2] ?? '';
		const queryWord = String(rawQuery).replace(/(^['"])|(['"]$)/g, '');

		// validate arguments early and return
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

		// Normalize DICT special database names
		if (dictionary === '*' || dictionary === '!') {
			dictionary = 'dle';
		}
		if (dictionary !== 'dle') {
			socket.write('550 Solamente tenemos un diccionario: "dle"\r\n');
			return;
		}

		const response = await fetch(`https://rae-api.com/api/words/${queryWord}`);
		const result = await response.json();

		if (response.status === 404) {
			socket.write(
				`552 No hay coincidencia para la palabra "${queryWord}"${
					result.suggestions
						? '. Puede(n) estar relacionada(s): '.concat(
								result.suggestions.join(', '),
							)
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

		if (!result?.data?.meanings?.length) {
			socket.write(
				`552 No hay coincidencia para la palabra "${queryWord}"\r\n`,
			);
			return;
		}

		const meanings = result.data.meanings;
		const headword = result.data.word ?? queryWord;

		const { origin, senses, conjugations } = meanings[0];

		const defCount = senses.length;
		socket.write(
			`150 ${defCount} ${
				defCount === 1 ? 'definición encontrada' : 'definiciones encontradas'
			} para "${headword}"\r\n`,
		);

		for (const sense of senses) {
			writeSenseBlock(socket, headword, origin, sense, conjugations);
		}

		socket.write('250 OK\r\n');
	} catch (err) {
		console.error('Error al ejecutar comando DEFINE:', err);
		socket.write('554 Error interno al obtener las definiciones\r\n');
	}
}
function writeConjugations(socket: Socket, conjugations: any) {
	if (!conjugations) return;

	socket.write('Conjugaciones:\r\n');

	const writeKeyValueSection = (
		title: string,
		entries?: Record<string, string>,
	) => {
		if (!entries) return;
		socket.write(`\t${title}:\r\n`);
		for (const [key, value] of Object.entries(entries)) {
			socket.write(`\t\t ${processConjugation(key)} : ${String(value)}\r\n`);
		}
	};

	const writeMoodSection = (
		title: string,
		mood?: Record<string, Record<string, string>>,
	) => {
		if (!mood) return;
		socket.write(`\t${title}:\r\n`);
		for (const [tenseName, tense] of Object.entries(mood)) {
			socket.write(`\t\t ${processConjugation(tenseName)}:\r\n`);
			for (const [form, pn] of Object.entries(tense)) {
				socket.write(`\t\t\t ${processConjugation(form)} : ${pn}\r\n`);
			}
		}
	};

	// non-personal forms
	writeKeyValueSection(
		'Formas no personales',
		conjugations.non_personal as Record<string, string> | undefined,
	);

	// indicative
	writeMoodSection(
		'Modo indicativo',
		conjugations.indicative as
			| Record<string, Record<string, string>>
			| undefined,
	);

	// subjunctive
	writeMoodSection(
		'Modo subjuntivo',
		conjugations.subjunctive as
			| Record<string, Record<string, string>>
			| undefined,
	);

	// imperative
	writeKeyValueSection(
		'Modo imperativo',
		conjugations.imperative as Record<string, string> | undefined,
	);
}

function writeSenseBlock(
	socket: Socket,
	headword: string,
	origin: any,
	sense: any,
	conjugations: any,
) {
	socket.write(`151 "${headword}" dle "Diccionario de la Lengua Española"\r\n`);
	socket.write('\r\n');

	if (origin?.raw) socket.write(`Origen: ${origin.raw}\r\n`);

	const categoryString = formatCategoryString(sense);
	socket.write(
		`${sense.meaning_number}. ${categoryString} ${sense.description}\r\n`,
	);

	if (sense.usage) socket.write(`\tUso: ${sense.usage}\r\n`);
	if (sense.synonyms?.length)
		socket.write(`\tSinónimos: ${sense.synonyms.join(', ')}\r\n`);
	if (sense.antonyms?.length)
		socket.write(`\tAntónimos: ${sense.antonyms.join(', ')}\r\n`);

	writeConjugations(socket, conjugations);

	// End of this 151 block
	socket.write('.\r\n');
}
