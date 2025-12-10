import type { Socket } from 'node:net';

export default function send(socket: Socket, line: string): void {
	if (!line.endsWith('\r\n')) line += '\r\n';
	// write may return false (backpressure). that's fine; we don't destroy the socket immediately.
	try {
		socket.write(line);
	} catch (err) {
		// ignore; socket may be already closed
	}
}
