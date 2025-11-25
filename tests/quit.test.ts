import type { Socket } from 'node:net';
import quitCommand from '../src/quit';

describe('QUIT command', () => {
  let socket: Socket & { end: jest.Mock };
  let clientNames: Map<Socket, string>;

  beforeEach(() => {
    clientNames = new Map();
    socket = {
      end: jest.fn(),
    } as unknown as Socket & { end: jest.Mock };
  });

  it('sends farewell message with client name if available', () => {
    clientNames.set(socket, 'Juan');
    quitCommand(socket, [], clientNames);

    expect(socket.end).toHaveBeenCalledWith(
      '221 Fue todo un gusto atenderte, Juan\r\n',
    );
  });

  it('sends farewell message without name if client not registered', () => {
    quitCommand(socket, [], clientNames);

    expect(socket.end).toHaveBeenCalledWith(
      '221 Fue todo un gusto atenderte\r\n',
    );
  });
});
