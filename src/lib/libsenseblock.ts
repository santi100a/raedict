import type { Socket } from 'node:net';
import formatCategoryString from './libformat';
import processUsage from './libusage';

/* -------------------------------------------------------------------------- */
/*                              Sense block writer                             */
/* -------------------------------------------------------------------------- */

export default function writeSenseBlock(socket: Socket, sense: any): void {
	const categoryString = formatCategoryString(sense);
	socket.write(
		` ${sense.meaning_number}. ${categoryString} ${processUsage(sense.usage)} ${sense.description}`
	);

	socket.write('\r\n');

	if (sense.synonyms?.length) {
		socket.write(`\tSinónimos: ${sense.synonyms.join(', ')}`);
		socket.write('\r\n');
	}
	if (sense.antonyms?.length) {
		socket.write(`\tAntónimos: ${sense.antonyms.join(', ')}`);
		socket.write('\r\n');
	}
}
