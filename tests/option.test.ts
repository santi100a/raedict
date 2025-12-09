import type { Socket } from 'node:net';
import optionCommand from '../src/option';

describe('OPTION command', () => {
  let socket: Socket;
  let writes: string[];
  let optionRef: { conjugations: boolean };

  beforeEach(() => {
    writes = [];
    socket = {
      write: (data: string) => writes.push(data),
    } as unknown as Socket;

    optionRef = { conjugations: false };
  });

  it('enables conjugation option', () => {
    optionCommand(socket, ['OPTION', 'CONJ'], optionRef);
    expect(optionRef.conjugations).toBe(true);
    expect(writes[0]).toBe('250 OK\r\n');
  });


  it('rejects unknown options', () => {
    optionCommand(socket, ['OPTION', 'FOO'], optionRef);

    expect(optionRef.conjugations).toBe(false);
    expect(writes[0]).toBe('501 Opción no reconocida o no implementada\r\n');
  });

  it('handles missing option argument gracefully', () => {
    optionCommand(socket, ['OPTION'], optionRef);

    expect(optionRef.conjugations).toBe(false);
    expect(writes[0]).toBe('501 Opción no reconocida o no implementada\r\n');
  });
});
