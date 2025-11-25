import match from '../src/match';
import type { Socket } from 'node:net';

// Mock global fetch
globalThis.fetch = jest.fn();

describe('MATCH command', () => {
	let socket: Socket;
	let writes: string[];

	beforeEach(() => {
		writes = [];
		socket = {
			write: (data: string) => {
				writes.push(data);
			},
		} as unknown as Socket;

		jest.clearAllMocks();
	});

	// ---------------------------------------------------------
	// BAD ARGUMENTS
	// ---------------------------------------------------------
	it('returns 501 when arguments are missing', async () => {
		await match(socket, ['MATCH']);
		expect(writes).toEqual(['501 Uso: MATCH dle <estrategia> <patrón>\r\n']);
	});

	// ---------------------------------------------------------
	// UNKNOWN DICTIONARY
	// ---------------------------------------------------------
	it('returns 550 when dictionary is not "dle", "*", or "!"', async () => {
		await match(socket, ['MATCH', 'other', 'exact', 'hola']);
		expect(writes).toEqual(['550 Solamente tenemos un diccionario: "dle"\r\n']);
	});

	// ---------------------------------------------------------
	// UNKNOWN STRATEGY
	// ---------------------------------------------------------
	it('returns 551 for unknown strategies', async () => {
		await match(socket, ['MATCH', 'dle', 'weird', 'hola']);
		expect(writes).toEqual([
			'551 Estrategia desconocida. Usa: exact, fuzzy\r\n',
		]);
	});

	// ---------------------------------------------------------
	// FETCH ERROR (network failure)
	// ---------------------------------------------------------
	it('returns 554 on API connection error', async () => {
		(globalThis.fetch as jest.Mock).mockRejectedValue(new Error('fail'));

		await match(socket, ['MATCH', 'dle', 'exact', 'hola']);

		expect(writes[writes.length - 1]).toBe(
			'554 Error de conexión con la API\r\n',
		);
	});

	// ---------------------------------------------------------
	// FETCH ERROR (non-200 response)
	// ---------------------------------------------------------
	it('returns 554 when API returns non-ok', async () => {
		(globalThis.fetch as jest.Mock).mockResolvedValue({
			ok: false,
			status: 503,
			statusText: 'Service Unavailable',
		});

		await match(socket, ['MATCH', 'dle', 'exact', 'hola']);

		expect(writes[writes.length - 1]).toBe(
			'554 Error del servidor al buscar: 503 Service Unavailable\r\n',
		);
	});

	// ---------------------------------------------------------
	// ZERO RESULTS
	// ---------------------------------------------------------
	it('returns 552 when no matches exist', async () => {
		(globalThis.fetch as jest.Mock).mockResolvedValue({
			ok: true,
			json: async () => [],
		});

		await match(socket, ['MATCH', 'dle', 'exact', 'hola']);

		expect(writes).toEqual([
			'552 No hay coincidencias para el patrón "hola"\r\n',
		]);
	});

	// ---------------------------------------------------------
	// SUCCESSFUL MATCHES
	// ---------------------------------------------------------
	it('returns results correctly formatted', async () => {
		(globalThis.fetch as jest.Mock).mockResolvedValue({
			ok: true,
			json: async () => [
				{ doc: { id: 'hola' }, hits: 10 },
				{ doc: { id: 'holar' }, hits: 4 },
			],
		});

		await match(socket, ['MATCH', 'dle', 'exact', 'hola']);

		expect(writes[0]).toBe('152 2 coincidencias encontradas para "hola"\r\n');

		expect(writes[1]).toBe('dle "hola"\r\n');
		expect(writes[2]).toBe('dle "holar"\r\n');

		expect(writes[writes.length - 2]).toBe('.\r\n');
		expect(writes[writes.length - 1]).toBe('250 OK\r\n');
	});

	// ---------------------------------------------------------
	// STRATEGY NORMALIZATION (., =, !, *) → exact
	// ---------------------------------------------------------
	it('maps ".", "=", "!", "*" strategies to exact', async () => {
		(globalThis.fetch as jest.Mock).mockResolvedValue({
			ok: true,
			json: async () => [{ doc: { id: 'hola' } }],
		});

		await match(socket, ['MATCH', 'dle', '.', 'hola']);

		const fetchURL = (globalThis.fetch as jest.Mock).mock.calls[0][0];
		expect(fetchURL).toContain('engine=linear'); // exact strategy
	});

	// ---------------------------------------------------------
	// STRATEGY NORMALIZATION "~" → fuzzy
	// ---------------------------------------------------------
	it('maps "~" strategy to fuzzy', async () => {
		(globalThis.fetch as jest.Mock).mockResolvedValue({
			ok: true,
			json: async () => [{ doc: { id: 'hola' } }],
		});

		await match(socket, ['MATCH', 'dle', '~', 'hola']);

		const fetchURL = (globalThis.fetch as jest.Mock).mock.calls[0][0];
		expect(fetchURL).toContain('engine=hits'); // fuzzy strategy
	});
});
