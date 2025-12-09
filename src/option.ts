import type { Socket } from 'node:net';

export default function command(
	socket: Socket,
	tokens: string[],
	optionRef: { conjugations: boolean },
) {
	const [, optionNameRaw] = tokens;
	const optionName = optionNameRaw?.toUpperCase() ?? '';

	switch (optionName) {
		case 'MIME':
			socket.write('250 OK\r\n');
			break;
		case 'UTF8':
			socket.write('250 OK\r\n');
			break;
		case 'CONJ':
			optionRef.conjugations = true;
			socket.write('250 OK\r\n');
			break;
		default:
			socket.write('501 Opción no reconocida o no implementada\r\n');
			break;
	}
}
