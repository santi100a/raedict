import type { Socket } from 'node:net';

export default function command(socket: Socket) {
    socket.end("221 Fue todo un gusto atenderte\r\n");
}