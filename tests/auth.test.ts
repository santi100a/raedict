import type { Socket } from 'node:net';
import authCommand from '../src/auth';

describe('AUTH command', () => {
	let socket: Socket;
	let writes: string[];

	beforeEach(() => {
		writes = [];

		// Mock a Socket with only the write method
		socket = {
			write: (data: string) => writes.push(data),
		} as unknown as Socket;
	});

	it('returns 502 "server is public" response', () => {
		authCommand(socket);

		// The AUTH response
		expect(writes).toContain(
			'502 No se admite el comando "AUTH"; este es un servidor público\r\n'
		);

		// No other server responses
		expect(writes).toHaveLength(1);
	});
});
