import type { Socket } from 'node:net';
import defineCommand from '../src/define';

globalThis.fetch = jest.fn();

describe('DEFINE command', () => {
  let socket: Socket;
  let writes: string[];

  beforeEach(() => {
    writes = [];
    socket = {
      write: (data: string) => writes.push(data),
    } as unknown as Socket;

    (fetch as jest.Mock).mockClear();
  });

  it('returns multiple senses and includes conjugation table', async () => {
    const mockResult = {
      data: {
        word: 'probar',
        meanings: [
          {
            origin: { raw: 'Del latín probare' },
            senses: [
              { meaning_number: 1, description: 'Def 1', category: 'verb' },
              { meaning_number: 2, description: 'Def 2', category: 'verb' },
            ],
            conjugations: {
              non_personal: { infinitive: 'probar' },
              indicative: { present: { singular_first_person: 'pruebo' } },
            },
          },
        ],
      },
    };

    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockResult,
    });

    await defineCommand(socket, ['DEFINE', 'dle', 'probar'], { conjugations: false });

    // Check the socket writes
    expect(writes[0]).toMatch(/^150/); // heading
    expect(writes.some(w => w.includes('Def 1'))).toBe(true);
    expect(writes.some(w => w.includes('Def 2'))).toBe(true);
    expect(writes.some(w => w.includes('pruebo') || w.includes('probar'))).toBe(true); // conjugation

    // Final OK
    expect(writes[writes.length - 1]).toBe('250 OK\r\n');
  });

  it('handles API returning 404', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      status: 404,
      ok: false,
      json: async () => ({
        error: 'NOT_FOUND',
        ok: false,
        suggestions: ['sugerencia1', 'sugerencia2'],
      }),
    });

    await defineCommand(socket, ['DEFINE', 'dle', 'nonexistent'], { conjugations: false });

    expect(writes[0]).toContain(
      '552 No hay coincidencia para "nonexistent"',
    );
  });

  it('handles network errors', async () => {
    (fetch as jest.Mock).mockRejectedValue(new Error('fail'));

    await defineCommand(socket, ['DEFINE', 'dle', 'error'], { conjugations: false });

    expect(writes[0]).toBe('554 Error interno al obtener las definiciones\r\n');
  });
});
