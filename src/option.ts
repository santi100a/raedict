import type { Socket } from 'node:net';

export default function command(
	socket: Socket,
	tokens: string[],
	optionRef: { mime: boolean },
) {
	const [, optionNameRaw] = tokens;
	const optionName = optionNameRaw?.toUpperCase() ?? '';

	if (optionName === 'MIME') {
		optionRef.mime = true;
		socket.write('250 OK\r\n');
	} else if (optionName === 'UTF8') {
		// Optional extension: you can accept or reject it
		socket.write('250 OK\r\n');
	} else {
		socket.write('501 Opción no reconocida o no implementada\r\n');
	}
}
