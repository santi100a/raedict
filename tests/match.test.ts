import type { DictCommand } from '@santi100a/dict-server/dist/lib/libtypes';
import type { DictResponse } from '@santi100a/dict-server/dist/response.class';

// @ts-ignore
import matchHandler = require('../src/match.handler');

globalThis.fetch = jest.fn();

describe('MATCH module', () => {
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

  describe('Parameter validation', () => {
    it('returns 501 if dictionary is missing', async () => {
      await matchHandler(makeCommand('MATCH', []), mockResponse);
      expect(mockResponse.error).toHaveBeenCalledWith(501);
    });

    it('returns 501 if strategy is missing', async () => {
      await matchHandler(makeCommand('MATCH', ['dle']), mockResponse);
      expect(mockResponse.error).toHaveBeenCalledWith(501);
    });

    it('returns 501 if query is missing', async () => {
      await matchHandler(makeCommand('MATCH', ['dle', 'exact']), mockResponse);
      expect(mockResponse.error).toHaveBeenCalledWith(501);
    });

    it('returns 550 for invalid dictionary', async () => {
      await matchHandler(makeCommand('MATCH', ['invalid', 'exact', 'test']), mockResponse);
      expect(mockResponse.error).toHaveBeenCalledWith(550);
    });

    it('accepts dle as dictionary', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ([]),
      });

      await matchHandler(makeCommand('MATCH', ['dle', 'exact', 'test']), mockResponse);
      expect(mockResponse.error).not.toHaveBeenCalledWith(550);
    });

    it('accepts * as dictionary', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ([]),
      });

      await matchHandler(makeCommand('MATCH', ['*', 'exact', 'test']), mockResponse);
      expect(mockResponse.error).not.toHaveBeenCalledWith(550);
    });

    it('accepts ! as dictionary', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ([]),
      });

      await matchHandler(makeCommand('MATCH', ['!', 'exact', 'test']), mockResponse);
      expect(mockResponse.error).not.toHaveBeenCalledWith(550);
    });

    it('accepts dictionary in uppercase', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ([]),
      });

      await matchHandler(makeCommand('MATCH', ['DLE', 'exact', 'test']), mockResponse);
      expect(mockResponse.error).not.toHaveBeenCalledWith(550);
    });

    it('returns 551 for invalid strategy', async () => {
      await matchHandler(makeCommand('MATCH', ['dle', 'invalid', 'test']), mockResponse);
      expect(mockResponse.error).toHaveBeenCalledWith(551);
    });
  });

  describe('Strategy mapping', () => {
    it('maps . to exact strategy with linear engine', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ([]),
      });

      await matchHandler(makeCommand('MATCH', ['dle', '.', 'test']), mockResponse);
      
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('engine=linear')
      );
    });

    it('maps = to exact strategy with linear engine', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ([]),
      });

      await matchHandler(makeCommand('MATCH', ['dle', '=', 'test']), mockResponse);
      
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('engine=linear')
      );
    });

    it('maps ! to exact strategy with linear engine', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ([]),
      });

      await matchHandler(makeCommand('MATCH', ['dle', '!', 'test']), mockResponse);
      
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('engine=linear')
      );
    });

    it('maps * to exact strategy with linear engine', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ([]),
      });

      await matchHandler(makeCommand('MATCH', ['dle', '*', 'test']), mockResponse);
      
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('engine=linear')
      );
    });

    it('maps ~ to fuzzy strategy with hits engine', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ([]),
      });

      await matchHandler(makeCommand('MATCH', ['dle', '~', 'test']), mockResponse);
      
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('engine=hits')
      );
    });

    it('uses exact strategy with linear engine for exact keyword', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ([]),
      });

      await matchHandler(makeCommand('MATCH', ['dle', 'exact', 'test']), mockResponse);
      
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('engine=linear')
      );
    });

    it('uses prefix strategy with linear engine', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ([]),
      });

      await matchHandler(makeCommand('MATCH', ['dle', 'prefix', 'test']), mockResponse);
      
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('engine=linear')
      );
    });

    it('uses fuzzy strategy with hits engine for fuzzy keyword', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ([]),
      });

      await matchHandler(makeCommand('MATCH', ['dle', 'fuzzy', 'test']), mockResponse);
      
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('engine=hits')
      );
    });

    it('handles strategy in uppercase', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ([]),
      });

      await matchHandler(makeCommand('MATCH', ['dle', 'EXACT', 'test']), mockResponse);
      
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('engine=linear')
      );
    });
  });

  describe('Query handling', () => {
    it('handles single word queries', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ([]),
      });

      await matchHandler(makeCommand('MATCH', ['dle', 'exact', 'test']), mockResponse);
      
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('q=test')
      );
    });

    it('joins multi-word queries with spaces', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ([]),
      });

      await matchHandler(makeCommand('MATCH', ['dle', 'exact', 'test', 'word']), mockResponse);
      
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('q=test%20word')
      );
    });

    it('strips leading single quotes from query', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ([]),
      });

      await matchHandler(makeCommand('MATCH', ['dle', 'exact', "'test'"]), mockResponse);
      
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('q=test')
      );
    });

    it('strips leading and trailing double quotes from query', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ([]),
      });

      await matchHandler(makeCommand('MATCH', ['dle', 'exact', '"test"']), mockResponse);
      
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('q=test')
      );
    });

    it('URL encodes special characters in query', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ([]),
      });

      await matchHandler(makeCommand('MATCH', ['dle', 'exact', 'test&word']), mockResponse);
      
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('q=test%26word')
      );
    });
  });

  describe('API interaction', () => {
    it('returns 420 when API returns non-ok response', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({}),
      });

      await matchHandler(makeCommand('MATCH', ['dle', 'exact', 'test']), mockResponse);
      
      expect(mockResponse.error).toHaveBeenCalledWith(
        420,
        'Error del servidor al buscar: 500 Internal Server Error'
      );
    });

    it('returns 420 when JSON parsing fails', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await matchHandler(makeCommand('MATCH', ['dle', 'exact', 'test']), mockResponse);
      
      expect(mockResponse.error).toHaveBeenCalledWith(
        420,
        'Error de conexión con la API'
      );
    });

    it('returns 420 when fetch throws error', async () => {
      (globalThis.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await matchHandler(makeCommand('MATCH', ['dle', 'exact', 'test']), mockResponse);
      
      expect(mockResponse.error).toHaveBeenCalledWith(
        420,
        'Error de conexión con la API'
      );
    });

    it('returns 552 when no results are found', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ([]),
      });

      await matchHandler(makeCommand('MATCH', ['dle', 'exact', 'test']), mockResponse);
      
      expect(mockResponse.error).toHaveBeenCalledWith(552);
    });

    it('handles non-array API response', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ error: 'something' }),
      });

      await matchHandler(makeCommand('MATCH', ['dle', 'exact', 'test']), mockResponse);
      
      expect(mockResponse.error).toHaveBeenCalledWith(552);
    });
  });

  describe('Successful matches', () => {
    it('writes matches when results are found', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ([
          { doc: { id: 'word1' }, hits: 10 },
          { doc: { id: 'word2' }, hits: 8 },
        ]),
      });

      await matchHandler(makeCommand('MATCH', ['dle', 'exact', 'test']), mockResponse);
      
      expect(mockResponse.writeMatches).toHaveBeenCalled();
      const matches = (mockResponse.writeMatches as jest.Mock).mock.calls[0][0];
      expect(matches).toHaveLength(2);
      expect(matches[0]).toEqual({ dictionary: 'dle', word: 'word1' });
      expect(matches[1]).toEqual({ dictionary: 'dle', word: 'word2' });
    });

    it('writes single match', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ([
          { doc: { id: 'palabra' }, hits: 15 },
        ]),
      });

      await matchHandler(makeCommand('MATCH', ['dle', 'fuzzy', 'palabra']), mockResponse);
      
      expect(mockResponse.writeMatches).toHaveBeenCalled();
      const matches = (mockResponse.writeMatches as jest.Mock).mock.calls[0][0];
      expect(matches).toHaveLength(1);
      expect(matches[0]).toEqual({ dictionary: 'dle', word: 'palabra' });
    });

    it('handles results with missing doc property gracefully', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ([
          { doc: { id: 'word1' } },
          { doc: null },
          { doc: { id: 'word2' } },
        ]),
      });

      await matchHandler(makeCommand('MATCH', ['dle', 'exact', 'test']), mockResponse);
      
      expect(mockResponse.writeMatches).toHaveBeenCalled();
      const matches = (mockResponse.writeMatches as jest.Mock).mock.calls[0][0];
      expect(matches).toHaveLength(3);
      expect(matches[0].word).toBe('word1');
      expect(matches[1].word).toBeUndefined();
      expect(matches[2].word).toBe('word2');
    });

    it('includes dictionary field in all matches', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ([
          { doc: { id: 'word1' } },
          { doc: { id: 'word2' } },
          { doc: { id: 'word3' } },
        ]),
      });

      await matchHandler(makeCommand('MATCH', ['dle', 'exact', 'test']), mockResponse);
      
      const matches = (mockResponse.writeMatches as jest.Mock).mock.calls[0][0];
      matches.forEach((match: any) => {
        expect(match.dictionary).toBe('dle');
      });
    });
  });

  describe('Integration scenarios', () => {
    it('handles complete exact match flow', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ([
          { doc: { id: 'exacto' }, hits: 20 },
        ]),
      });

      await matchHandler(makeCommand('MATCH', ['dle', '.', 'exacto']), mockResponse);
      
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://rae-api.com/api/search?q=exacto&engine=linear'
      );
      expect(mockResponse.writeMatches).toHaveBeenCalled();
      expect(mockResponse.error).not.toHaveBeenCalled();
    });

    it('handles complete fuzzy match flow', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ([
          { doc: { id: 'similar1' }, hits: 15 },
          { doc: { id: 'similar2' }, hits: 12 },
          { doc: { id: 'similar3' }, hits: 10 },
        ]),
      });

      await matchHandler(makeCommand('MATCH', ['dle', '~', 'similr']), mockResponse);
      
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://rae-api.com/api/search?q=similr&engine=hits'
      );
      expect(mockResponse.writeMatches).toHaveBeenCalled();
      const matches = (mockResponse.writeMatches as jest.Mock).mock.calls[0][0];
      expect(matches).toHaveLength(3);
    });

    it('handles prefix match with multi-word query', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ([
          { doc: { id: 'anti-aircraft' }, hits: 5 },
        ]),
      });

      await matchHandler(makeCommand('MATCH', ['dle', 'prefix', 'anti', 'air']), mockResponse);
      
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://rae-api.com/api/search?q=anti%20air&engine=linear'
      );
      expect(mockResponse.writeMatches).toHaveBeenCalled();
    });
  });
});