import type { Socket } from 'node:net';

export default function command(
	socket: Socket,
	_: unknown,
	clientNames: Map<Socket, string>,
) {
	const name = clientNames.get(socket);
	socket.end(
		`221 Fue todo un gusto atenderte${name ? ', '.concat(name) : ''}\r\n`,
	);
}
