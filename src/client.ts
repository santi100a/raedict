import type { Socket } from 'node:net';

export default function command(
	socket: Socket,
	tokens: string[],
	clientNames: Map<Socket, string>,
) {
	const [_, ...rest] = tokens;
	const name = rest.join(' ');
	socket.write('250 Bienvenido'.concat(name ? `, ${name}` : '', '\r\n'));
	if (name) {
		clientNames.set(socket, name);
	}
}
