import type { DictCommand } from '@santi100a/dict-server/dist/lib/libtypes';
import type { DictResponse } from '@santi100a/dict-server/dist/response.class';
import { defineHandler } from '../src/define.handler';
import formatCategoryString from '../src/lib/libformat';
import processUsage from '../src/lib/libusage';
import writeConjugationTable from '../src/lib/libconjugationtable';

jest.mock('../src/lib/libformat');
jest.mock('../src/lib/libusage');
jest.mock('../src/lib/libconjugationtable');

globalThis.fetch = jest.fn();

describe('defineHandler', () => {
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

    (formatCategoryString as jest.Mock).mockImplementation((sense) => `[${sense.pos}]`);
    (processUsage as jest.Mock).mockImplementation((usage) => (usage ? `(uso: ${usage})` : ''));
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

  it('returns 550 for invalid dictionary', async () => {
    await defineHandler(makeCommand('DEFINE', ['invalid', 'word']), mockResponse);
    expect(mockResponse.status).toHaveBeenCalledWith(550);
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
              senses: [{ meaning_number: 1, pos: 'n', usage: 'formal', description: 'A test' }],
              conjugations: null,
            },
          ],
        },
      }),
    });

    await defineHandler(makeCommand('DEFINE', ['dle', 'test']), mockResponse);

    expect(mockResponse.writeDefinitions).toHaveBeenCalled();
    const defs = (mockResponse.writeDefinitions as jest.Mock).mock.calls[0][0];
    expect(defs[0].headword).toBe('test');
    expect(defs[0].definition).toContain('1. [n] (uso: formal) A test');
  });
});
