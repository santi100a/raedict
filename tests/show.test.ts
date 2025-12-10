import type { Socket } from 'node:net';
import showCommand from '../src/show';

describe('SHOW command', () => {
  let socket: Socket & { write: jest.Mock };

  beforeEach(() => {
    socket = { write: jest.fn() } as unknown as Socket & { write: jest.Mock };
  });

  it('shows SERVER info', () => {
    showCommand(socket, ['SHOW', 'SERVER']);

    expect(socket.write).toHaveBeenCalledWith('114 Info. del servidor\r\n');
    expect(socket.write).toHaveBeenCalledWith(expect.stringContaining('RAE DICT en'));
    expect(socket.write).toHaveBeenCalledWith(expect.stringContaining('(C) 2025 Santiago Rojas'));
    expect(socket.write).toHaveBeenCalledWith(expect.stringContaining('Funciona gracias a RAE API'));
    expect(socket.write).toHaveBeenCalledWith('.\r\n');
    expect(socket.write).toHaveBeenCalledWith('250 OK\r\n');
  });

  it('shows INFO for dle', () => {
    showCommand(socket, ['SHOW', 'INFO', 'dle']);

    expect(socket.write).toHaveBeenCalledWith('112 Info. del diccionario "dle"\r\n');
    expect(socket.write).toHaveBeenCalledWith(expect.stringContaining('Diccionario de la Lengua Española'));
    expect(socket.write).toHaveBeenCalledWith('.\r\n');
    expect(socket.write).toHaveBeenCalledWith('250 OK\r\n');
  });

  it('returns error if INFO subcommand missing db', () => {
    showCommand(socket, ['SHOW', 'INFO']);

    expect(socket.write).toHaveBeenCalledWith(
      '501 No has especificado el diccionario. Solamente tenemos "dle", por cierto\r\n',
    );
  });

  it('returns error if unknown db', () => {
    showCommand(socket, ['SHOW', 'INFO', 'otherdb']);

    expect(socket.write).toHaveBeenCalledWith(
      '550 Solamente tenemos un diccionario: "dle"\r\n',
    );
  });

  it('shows DB list', () => {
    showCommand(socket, ['SHOW', 'DB']);

    expect(socket.write).toHaveBeenCalledWith('110 1 diccionario presente\r\n');
    expect(socket.write).toHaveBeenCalledWith('dle "Diccionario de la Lengua Española"\r\n');
    expect(socket.write).toHaveBeenCalledWith('.\r\n');
    expect(socket.write).toHaveBeenCalledWith('250 OK\r\n');
  });

  it('shows STRATEGIES', () => {
    showCommand(socket, ['SHOW', 'STRAT']);

    expect(socket.write).toHaveBeenCalledWith(
      '111 3 estrategias presentes ("exact" -> . = ! * | "fuzzy" -> ~)\r\n',
    );
    expect(socket.write).toHaveBeenCalledWith('exact "Buscar la palabra exacta"\r\n');
    expect(socket.write).toHaveBeenCalledWith('prefix "Buscar la palabra con el principio"\r\n');
    expect(socket.write).toHaveBeenCalledWith('fuzzy "Buscar palabras con margen de error"\r\n');
    expect(socket.write).toHaveBeenCalledWith('.\r\n');
    expect(socket.write).toHaveBeenCalledWith('250 OK\r\n');
  });

  it('returns error on unknown subcommand', () => {
    showCommand(socket, ['SHOW', 'UNKNOWN']);

    expect(socket.write).toHaveBeenCalledWith(
      '501 No se reconoce lo que se debe mostrar\r\n',
    );
  });

  it('returns error if no subcommand given', () => {
    showCommand(socket, ['SHOW']);

    expect(socket.write).toHaveBeenCalledWith(
      '501 No has especificado lo que se debe mostrar\r\n',
    );
  });
});
