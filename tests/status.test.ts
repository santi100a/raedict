import type { Socket } from 'node:net';
import statusCommand from '../src/status';

describe('STATUS command', () => {
  let socket: Socket & { write: jest.Mock };

  beforeEach(() => {
    socket = { write: jest.fn() } as unknown as Socket & { write: jest.Mock };
    globalThis.fetch = jest.fn();
  });

  it('returns the word of the day on successful API call', async () => {
    const mockData = { data: { word: 'prueba' } };
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    await statusCommand(socket);

    expect(socket.write).toHaveBeenCalledWith(
      expect.stringMatching(/210 OK - Palabra del día: prueba, tardó \d+\.\d{2} ms en llegar\r\n/),
    );
  });

  it('handles API returning non-ok status', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
    });

    await statusCommand(socket);

    expect(socket.write).toHaveBeenCalledWith(
      '554 Error al contactar con la API de la RAE: 503 Service Unavailable\r\n',
    );
  });

  it('handles network errors', async () => {
    (globalThis.fetch as jest.Mock).mockRejectedValue(new Error('fail'));

    await statusCommand(socket);

    expect(socket.write).toHaveBeenCalledWith('420 Servicio no disponible\r\n');
  });

  it('uses "(desconocida)" if API response has no word', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: {} }),
    });

    await statusCommand(socket);

    expect(socket.write).toHaveBeenCalledWith(
      expect.stringMatching(/210 OK - Palabra del día: \(desconocida\), tardó \d+\.\d{2} ms en llegar\r\n/),
    );
  });
});
