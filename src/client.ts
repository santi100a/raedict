import type { Socket } from 'node:net';

export default function command(
	socket: Socket,
	tokens: string[],
	clientNames: Map<Socket, string>,
): void {
	const [_, ...rest] = tokens;
	let name = rest.join(' ').trim();

	// Remove single/double quotes
	if (
		(name.startsWith('"') && name.endsWith('"')) ||
		(name.startsWith("'") && name.endsWith("'"))
	) {
		name = name.slice(1, -1).trim();
	}

	// Collapse multiple spaces inside the name
	name = name.replace(/\s+/g, ' ');

	socket.write('250 Bienvenido' + (name ? `, ${name}` : '') + '\r\n');

	if (name) clientNames.set(socket, name);
}
