import type { Socket } from 'node:net';
import clientCommand from '../src/client';
import * as Lib from '../src/lib/libsenseblock';
const writeSenseBlock = Lib.default as jest.Mock;

jest.mock('../src/lib/libsenseblock', () => ({
  __esModule: true, // required for default export
  default: jest.fn(),
}));

describe('CLIENT command', () => {
	let socket: Socket;
	let writes: string[];
	let clientNames: Map<Socket, string>;

	beforeEach(() => {
		writes = [];
		socket = {
			write: (data: string) => writes.push(data),
		} as unknown as Socket;

		clientNames = new Map<Socket, string>();

		writeSenseBlock.mockClear(); // now this works
	});

	it('returns a welcome message without name', () => {
		clientCommand(socket, ['CLIENT'], clientNames);
		expect(writes).toContain('250 Bienvenido\r\n');
		expect(clientNames.has(socket)).toBe(false);
	});

	it('returns welcome message with a provided name', () => {
		clientCommand(socket, ['CLIENT', 'John', 'Doe'], clientNames);
		expect(writes).toContain('250 Bienvenido, John Doe\r\n');
		expect(clientNames.get(socket)).toBe('John Doe');
	});

	it('handles single-quoted names', () => {
		clientCommand(socket, ['CLIENT', "'Jane Doe'"], clientNames);
		expect(writes).toContain('250 Bienvenido, Jane Doe\r\n');
		expect(clientNames.get(socket)).toBe('Jane Doe');
	});

	it('handles double-quoted names', () => {
		clientCommand(socket, ['CLIENT', '"Jane Doe"'], clientNames);
		expect(writes).toContain('250 Bienvenido, Jane Doe\r\n');
		expect(clientNames.get(socket)).toBe('Jane Doe');
	});

	it('trims extra spaces in the name', () => {
		clientCommand(socket, ['CLIENT', '  Juan  Parra  '], clientNames);
		expect(writes).toContain('250 Bienvenido, Juan Parra\r\n');
		expect(clientNames.get(socket)).toBe('Juan Parra');
	});
});
