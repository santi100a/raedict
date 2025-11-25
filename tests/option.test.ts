import type { Socket } from 'node:net';
import optionCommand from '../src/option';

describe('OPTION command', () => {
  let socket: Socket;
  let writes: string[];
  let optionRef: { mime: boolean };

  beforeEach(() => {
    writes = [];
    socket = {
      write: (data: string) => writes.push(data),
    } as unknown as Socket;

    optionRef = { mime: false };
  });

  it('enables MIME option', () => {
    optionCommand(socket, ['OPTION', 'MIME'], optionRef);

    expect(optionRef.mime).toBe(true);
    expect(writes[0]).toBe('250 OK\r\n');
  });

  it('accepts UTF8 option without changing state', () => {
    optionCommand(socket, ['OPTION', 'UTF8'], optionRef);

    expect(optionRef.mime).toBe(false); // MIME unchanged
    expect(writes[0]).toBe('250 OK\r\n');
  });

  it('rejects unknown options', () => {
    optionCommand(socket, ['OPTION', 'FOO'], optionRef);

    expect(optionRef.mime).toBe(false);
    expect(writes[0]).toBe('501 Opción no reconocida o no implementada\r\n');
  });

  it('handles missing option argument gracefully', () => {
    optionCommand(socket, ['OPTION'], optionRef);

    expect(optionRef.mime).toBe(false);
    expect(writes[0]).toBe('501 Opción no reconocida o no implementada\r\n');
  });
});
