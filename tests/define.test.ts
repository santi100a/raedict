import type { DictCommand } from '@santi100a/dict-server/dist/lib/libtypes';
import type { DictResponse } from '@santi100a/dict-server/dist/response.class';

// @ts-ignore
import defineHandler = require('../src/define.handler');

import formatCategoryString from '../src/lib/libformat';
import processUsage from '../src/lib/libusage';
import writeConjugationTable from '../src/lib/libconjugationtable';

jest.mock('../src/lib/libformat');
jest.mock('../src/lib/libusage');
jest.mock('../src/lib/libconjugationtable');

globalThis.fetch = jest.fn();

// Mock console methods to reduce noise in test output
const originalConsoleInfo = console.info;
const originalConsoleError = console.error;

describe('DEFINE module', () => {
	let mockResponse: DictResponse;

	beforeAll(() => {
		// Silence console logs during tests
		console.info = jest.fn();
		console.error = jest.fn();
	});

	afterAll(() => {
		// Restore console methods
		console.info = originalConsoleInfo;
		console.error = originalConsoleError;
	});

	beforeEach(() => {
		mockResponse = {
			remoteAddress: '127.0.0.1',
			optionMimeEnabled: false,
			status: jest.fn(),
			error: jest.fn(),
			writeDefinitions: jest.fn(),
			writeMatches: jest.fn(),
			close: jest.fn(),
			clientText: '',
		} as unknown as DictResponse;

		(formatCategoryString as jest.Mock).mockImplementation(sense => sense.pos);
		(processUsage as jest.Mock).mockImplementation(usage => usage ?? '');
		(writeConjugationTable as jest.Mock).mockImplementation(() => 'CONJ_TABLE');
		
		// Clear all mocks including fetch
		jest.clearAllMocks();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	const makeCommand = (name: string, parameters: string[]): DictCommand => {
		return {
			raw: parameters.join(' '),
			name: parameters[0] ?? '',
			parameters,
			syntaxValid: true,
		} as unknown as DictCommand;
	};

	it('returns 501 if parameters are missing', async () => {
		await defineHandler(makeCommand('DEFINE', []), mockResponse);
		expect(mockResponse.status).toHaveBeenCalledWith(501);
	});

	it('returns 501 if dictionary is missing', async () => {
		await defineHandler(makeCommand('DEFINE', ['dle']), mockResponse);
		expect(mockResponse.status).toHaveBeenCalledWith(501);
	});

	it('returns 550 for invalid dictionary', async () => {
		await defineHandler(
			makeCommand('DEFINE', ['invalid', 'word']),
			mockResponse,
		);
		expect(mockResponse.status).toHaveBeenCalledWith(550);
	});

	it('accepts * as dictionary', async () => {
		(globalThis.fetch as jest.Mock).mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({
				data: {
					word: 'wildcardtest',
					meanings: [
						{
							senses: [{ meaning_number: 1, pos: 'n', description: 'A test' }],
							conjugations: null,
						},
					],
				},
			}),
		});

		await defineHandler(makeCommand('DEFINE', ['*', 'wildcardtest']), mockResponse);
		expect(mockResponse.writeDefinitions).toHaveBeenCalled();
		expect(globalThis.fetch).toHaveBeenCalledTimes(1);
	});

	it('accepts ! as dictionary', async () => {
		(globalThis.fetch as jest.Mock).mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({
				data: {
					word: 'bangtest',
					meanings: [
						{
							senses: [{ meaning_number: 1, pos: 'n', description: 'A test' }],
							conjugations: null,
						},
					],
				},
			}),
		});

		await defineHandler(makeCommand('DEFINE', ['!', 'bangtest']), mockResponse);
		expect(mockResponse.writeDefinitions).toHaveBeenCalled();
		expect(globalThis.fetch).toHaveBeenCalledTimes(1);
	});

	it('returns 420 error when JSON parsing fails', async () => {
		(globalThis.fetch as jest.Mock).mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => {
				throw new Error('Invalid JSON! (for testing)');
			},
		});

		await defineHandler(makeCommand('DEFINE', ['dle', 'jsonerror']), mockResponse);
		expect(mockResponse.error).toHaveBeenCalledWith(
			420,
			'Error al interpretar la respuesta del servidor',
		);
		expect(globalThis.fetch).toHaveBeenCalledTimes(1);
	});

	it('returns 552 error when API returns 404', async () => {
		(globalThis.fetch as jest.Mock).mockResolvedValueOnce({
			ok: false,
			status: 404,
			json: async () => ({
				data: null,
			}),
		});

		await defineHandler(makeCommand('DEFINE', ['dle', 'notfound404']), mockResponse);
		expect(mockResponse.error).toHaveBeenCalled();
		expect(globalThis.fetch).toHaveBeenCalledTimes(1);
	});

	it('returns 552 error when meanings array is empty', async () => {
		(globalThis.fetch as jest.Mock).mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({
				data: {
					word: 'emptymeanings',
					meanings: [],
				},
			}),
		});

		await defineHandler(makeCommand('DEFINE', ['dle', 'emptymeanings']), mockResponse);
		expect(mockResponse.error).toHaveBeenCalled();
		expect(globalThis.fetch).toHaveBeenCalledTimes(1);
	});

	it('calls writeDefinitions when API returns data', async () => {
		(globalThis.fetch as jest.Mock).mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({
				data: {
					word: 'normaltest',
					meanings: [
						{
							senses: [
								{
									meaning_number: 1,
									pos: 'n',
									usage: 'formal',
									description: 'A test',
								},
							],
							conjugations: null,
						},
					],
				},
			}),
		});

		await defineHandler(makeCommand('DEFINE', ['dle', 'normaltest']), mockResponse);

		expect(mockResponse.writeDefinitions).toHaveBeenCalled();
		expect(globalThis.fetch).toHaveBeenCalledTimes(1);
		const defs = (mockResponse.writeDefinitions as jest.Mock).mock.calls[0][0];
		expect(defs).toHaveLength(1);
		expect(defs[0].headword).toBe('normaltest');
		expect(defs[0].dictionary).toBe('dle');
		expect(defs[0].dictionaryDescription).toBe(
			'Diccionario de la Lengua Española',
		);
		expect(defs[0].definition).toContain('1. (n) [formal] A test');
	});

	it('includes origin when present', async () => {
		(globalThis.fetch as jest.Mock).mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({
				data: {
					word: 'origintest',
					meanings: [
						{
							origin: { raw: 'Del latín testum' },
							senses: [{ meaning_number: 1, pos: 'n', description: 'A test' }],
							conjugations: null,
						},
					],
				},
			}),
		});

		await defineHandler(makeCommand('DEFINE', ['dle', 'origintest']), mockResponse);

		expect(globalThis.fetch).toHaveBeenCalledTimes(1);
		const defs = (mockResponse.writeDefinitions as jest.Mock).mock.calls[0][0];
		expect(defs[0].definition).toContain('\\Del latín testum\\');
	});

	it('includes conjugation table when present', async () => {
		(globalThis.fetch as jest.Mock).mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({
				data: {
					word: 'conjugtest',
					meanings: [
						{
							senses: [{ meaning_number: 1, pos: 'v', description: 'To test' }],
							conjugations: {
								/* conjugation data */
							},
						},
					],
				},
			}),
		});

		await defineHandler(makeCommand('DEFINE', ['dle', 'conjugtest']), mockResponse);

		expect(globalThis.fetch).toHaveBeenCalledTimes(1);
		const defs = (mockResponse.writeDefinitions as jest.Mock).mock.calls[0][0];
		expect(defs[0].definition).toContain('CONJ_TABLE');
	});

	it('handles multiple meanings', async () => {
		(globalThis.fetch as jest.Mock).mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({
				data: {
					word: 'multimeaningtest',
					meanings: [
						{
							senses: [
								{ meaning_number: 1, pos: 'n', description: 'First meaning' },
							],
							conjugations: null,
						},
						{
							senses: [
								{ meaning_number: 1, pos: 'v', description: 'Second meaning' },
							],
							conjugations: null,
						},
					],
				},
			}),
		});

		await defineHandler(makeCommand('DEFINE', ['dle', 'multimeaningtest']), mockResponse);

		expect(globalThis.fetch).toHaveBeenCalledTimes(1);
		const defs = (mockResponse.writeDefinitions as jest.Mock).mock.calls[0][0];
		expect(defs).toHaveLength(2);
		expect(defs[0].definition).toContain('First meaning');
		expect(defs[1].definition).toContain('Second meaning');
	});

	it('handles multiple senses in a meaning', async () => {
		(globalThis.fetch as jest.Mock).mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({
				data: {
					word: 'multisensetest',
					meanings: [
						{
							senses: [
								{ meaning_number: 1, pos: 'n', description: 'First sense' },
								{ meaning_number: 2, pos: 'n', description: 'Second sense' },
							],
							conjugations: null,
						},
					],
				},
			}),
		});

		await defineHandler(makeCommand('DEFINE', ['dle', 'multisensetest']), mockResponse);

		expect(globalThis.fetch).toHaveBeenCalledTimes(1);
		const defs = (mockResponse.writeDefinitions as jest.Mock).mock.calls[0][0];
		expect(defs[0].definition).toContain('1. (n) First sense');
		expect(defs[0].definition).toContain('2. (n) Second sense');
	});

	it('handles errors during fetch gracefully', async () => {
		(globalThis.fetch as jest.Mock).mockRejectedValueOnce(
			new Error('Network error! (for testing)'),
		);

		await defineHandler(makeCommand('DEFINE', ['dle', 'networkerror']), mockResponse);

		expect(mockResponse.error).toHaveBeenCalledWith(
			420,
			'Error interno al obtener las definiciones',
		);
		expect(globalThis.fetch).toHaveBeenCalledTimes(1);
	});

	describe('Cache behavior', () => {
		it('uses cache on second request for same word', async () => {
			const mockData = {
				data: {
					word: 'cached',
					meanings: [
						{
							senses: [
								{ meaning_number: 1, pos: 'n', description: 'Cached result' },
							],
							conjugations: null,
						},
					],
				},
			};

			(globalThis.fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => mockData,
			});

			// First request - should hit the API
			await defineHandler(makeCommand('DEFINE', ['dle', 'cached']), mockResponse);
			expect(globalThis.fetch).toHaveBeenCalledTimes(1);

			// Second request - should use cache
			await defineHandler(makeCommand('DEFINE', ['dle', 'cached']), mockResponse);
			expect(globalThis.fetch).toHaveBeenCalledTimes(1); // Still 1, not 2
			expect(mockResponse.writeDefinitions).toHaveBeenCalledTimes(2);
		});

		it('is case-insensitive', async () => {
			const mockData = {
				data: {
					word: 'CaseTest',
					meanings: [
						{
							senses: [{ meaning_number: 1, pos: 'n', description: 'A test' }],
							conjugations: null,
						},
					],
				},
			};

			(globalThis.fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => mockData,
			});

			// First request with lowercase
			await defineHandler(makeCommand('DEFINE', ['dle', 'casetest']), mockResponse);
			expect(globalThis.fetch).toHaveBeenCalledTimes(1);

			// Second request with uppercase - should use cache
			await defineHandler(makeCommand('DEFINE', ['dle', 'CASETEST']), mockResponse);
			expect(globalThis.fetch).toHaveBeenCalledTimes(1); // Still 1
		});

		it('does not cache 404 responses', async () => {
			(globalThis.fetch as jest.Mock)
				.mockResolvedValueOnce({
					ok: false,
					status: 404,
					json: async () => ({ data: null }),
				})
				.mockResolvedValueOnce({
					ok: false,
					status: 404,
					json: async () => ({ data: null }),
				});

			// First request
			await defineHandler(makeCommand('DEFINE', ['dle', 'notfound123']), mockResponse);
			expect(globalThis.fetch).toHaveBeenCalledTimes(1);

			// Second request - should hit API again (404s are not cached)
			await defineHandler(makeCommand('DEFINE', ['dle', 'notfound123']), mockResponse);
			expect(globalThis.fetch).toHaveBeenCalledTimes(2);
		});

		it('does not cache empty meanings', async () => {
			(globalThis.fetch as jest.Mock)
				.mockResolvedValueOnce({
					ok: true,
					status: 200,
					json: async () => ({
						data: {
							word: 'empty456',
							meanings: [],
						},
					}),
				})
				.mockResolvedValueOnce({
					ok: true,
					status: 200,
					json: async () => ({
						data: {
							word: 'empty456',
							meanings: [],
						},
					}),
				});

			// First request
			await defineHandler(makeCommand('DEFINE', ['dle', 'empty456']), mockResponse);
			expect(globalThis.fetch).toHaveBeenCalledTimes(1);

			// Second request - should hit API again
			await defineHandler(makeCommand('DEFINE', ['dle', 'empty456']), mockResponse);
			expect(globalThis.fetch).toHaveBeenCalledTimes(2);
		});
	});
});