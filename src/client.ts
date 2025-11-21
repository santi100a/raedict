import type { Socket } from "node:net";

export default function command(socket: Socket, tokens: string[]) {
  const name = tokens[1];
  socket.write("250 Bienvenido".concat(name ? `, ${name}` : "", "\r\n"));
}
