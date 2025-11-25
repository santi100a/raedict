import type { Socket } from 'node:net';
import formatCategoryString from './libformat';
import writeConjugationTable from './libconjugationtable';

/* -------------------------------------------------------------------------- */
/*                              Sense block writer                             */
/* -------------------------------------------------------------------------- */

export default function writeSenseBlock(
	socket: Socket,
	headword: string,
	origin: any,
	sense: any,
	conjugations: any,
	showConjTable: boolean,
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

	// NEW: only on first 151 block
	if (showConjTable) writeConjugationTable(socket, conjugations);

	socket.write('.\r\n');
}
