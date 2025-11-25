import type { Socket } from 'node:net';

export default function command(socket: Socket) {
	socket.write(
		'502 No se admite el comando "AUTH"; este es un servidor público\r\n',
	);
}
