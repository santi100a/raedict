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

describe('DEFINE module', () => {
	let mockResponse: DictResponse;

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
		(globalThis.fetch as jest.Mock).mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => ({
				data: {
					word: 'test',
					meanings: [
						{
							senses: [{ meaning_number: 1, pos: 'n', description: 'A test' }],
							conjugations: null,
						},
					],
				},
			}),
		});

		await defineHandler(makeCommand('DEFINE', ['*', 'test']), mockResponse);
		expect(mockResponse.writeDefinitions).toHaveBeenCalled();
	});

	it('accepts ! as dictionary', async () => {
		(globalThis.fetch as jest.Mock).mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => ({
				data: {
					word: 'test',
					meanings: [
						{
							senses: [{ meaning_number: 1, pos: 'n', description: 'A test' }],
							conjugations: null,
						},
					],
				},
			}),
		});

		await defineHandler(makeCommand('DEFINE', ['!', 'test']), mockResponse);
		expect(mockResponse.writeDefinitions).toHaveBeenCalled();
	});

	it('returns 420 error when JSON parsing fails', async () => {
		(globalThis.fetch as jest.Mock).mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => {
				throw new Error('Invalid JSON! (for testing)');
			},
		});

		await defineHandler(makeCommand('DEFINE', ['dle', 'test']), mockResponse);
		expect(mockResponse.error).toHaveBeenCalledWith(
			420,
			'Error al interpretar la respuesta del servidor',
		);
	});

	it('returns 552 error when API returns 404', async () => {
		(globalThis.fetch as jest.Mock).mockResolvedValue({
			ok: false,
			status: 404,
			json: async () => ({
				data: null,
			}),
		});

		await defineHandler(makeCommand('DEFINE', ['dle', 'test']), mockResponse);
		expect(mockResponse.error).toHaveBeenCalledWith(552);
	});

	it('returns 552 error when meanings array is empty', async () => {
		(globalThis.fetch as jest.Mock).mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => ({
				data: {
					word: 'test',
					meanings: [],
				},
			}),
		});

		await defineHandler(makeCommand('DEFINE', ['dle', 'test']), mockResponse);
		expect(mockResponse.error).toHaveBeenCalledWith(552);
	});

	it('calls writeDefinitions when API returns data', async () => {
		(globalThis.fetch as jest.Mock).mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => ({
				data: {
					word: 'test',
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

		await defineHandler(makeCommand('DEFINE', ['dle', 'test']), mockResponse);

		expect(mockResponse.writeDefinitions).toHaveBeenCalled();
		const defs = (mockResponse.writeDefinitions as jest.Mock).mock.calls[0][0];
		expect(defs).toHaveLength(1);
		expect(defs[0].headword).toBe('test');
		expect(defs[0].dictionary).toBe('dle');
		expect(defs[0].dictionaryDescription).toBe(
			'Diccionario de la Lengua Española',
		);
		expect(defs[0].definition).toContain('1. (n) [formal] A test');
	});

	it('includes origin when present', async () => {
		(globalThis.fetch as jest.Mock).mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => ({
				data: {
					word: 'test',
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

		await defineHandler(makeCommand('DEFINE', ['dle', 'test']), mockResponse);

		const defs = (mockResponse.writeDefinitions as jest.Mock).mock.calls[0][0];
		expect(defs[0].definition).toContain('\\Del latín testum\\');
	});

	it('includes conjugation table when present', async () => {
		(globalThis.fetch as jest.Mock).mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => ({
				data: {
					word: 'test',
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

		await defineHandler(makeCommand('DEFINE', ['dle', 'test']), mockResponse);

		const defs = (mockResponse.writeDefinitions as jest.Mock).mock.calls[0][0];
		expect(defs[0].definition).toContain('CONJ_TABLE');
		expect(writeConjugationTable).toHaveBeenCalled();
	});

	it('handles multiple meanings', async () => {
		(globalThis.fetch as jest.Mock).mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => ({
				data: {
					word: 'test',
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

		await defineHandler(makeCommand('DEFINE', ['dle', 'test']), mockResponse);

		const defs = (mockResponse.writeDefinitions as jest.Mock).mock.calls[0][0];
		expect(defs).toHaveLength(2);
		expect(defs[0].definition).toContain('First meaning');
		expect(defs[1].definition).toContain('Second meaning');
	});

	it('handles multiple senses in a meaning', async () => {
		(globalThis.fetch as jest.Mock).mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => ({
				data: {
					word: 'test',
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

		await defineHandler(makeCommand('DEFINE', ['dle', 'test']), mockResponse);

		const defs = (mockResponse.writeDefinitions as jest.Mock).mock.calls[0][0];
		expect(defs[0].definition).toContain('1. (n) First sense');
		expect(defs[0].definition).toContain('2. (n) Second sense');
	});

	it('handles errors during fetch gracefully', async () => {
		(globalThis.fetch as jest.Mock).mockRejectedValue(
			new Error('Network error! (for testing)'),
		);

		await defineHandler(makeCommand('DEFINE', ['dle', 'test']), mockResponse);

		expect(mockResponse.error).toHaveBeenCalledWith(
			420,
			'Error interno al obtener las definiciones',
		);
	});
});
