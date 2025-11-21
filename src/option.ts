import type { Socket } from 'node:net';

export default function command(socket: Socket, tokens: string[]) {
	const [_, optionName] = tokens;
	if (['MIME', 'UTF8'].includes(optionName?.toUpperCase() ?? '')) {
		socket.write('250 text/plain; charset=utf-8\r\n');
	} else {
		socket.write('501 No se admite el comando "OPTION"\r\n');
	}
}
