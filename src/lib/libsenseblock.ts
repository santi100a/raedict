import type { Socket } from 'node:net';
import formatCategoryString from './libformat';
import writeConjugationTable from './libconjugationtable';
import processUsage from './libusage';

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
	const categoryString = formatCategoryString(sense);

	socket.write(
		`${sense.meaning_number}. ${categoryString} ${processUsage(sense.usage)} ${sense.description}\r\n`,
	);

	if (sense.synonyms?.length)
		socket.write(`\tSinónimos: ${sense.synonyms.join(', ')}\r\n`);
	if (sense.antonyms?.length)
		socket.write(`\tAntónimos: ${sense.antonyms.join(', ')}\r\n`);

	// NEW: only on first 151 block
	if (showConjTable) writeConjugationTable(socket, conjugations);
}
