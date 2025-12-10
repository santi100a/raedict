import help from '../src/help';
import type { Socket } from 'node:net';

describe('HELP command', () => {
	let socket: Socket;
	let writes: string[];

	beforeEach(() => {
		writes = [];
		socket = {
			write: (data: string) => {
				writes.push(data);
			},
		} as unknown as Socket;
	});

	it('prints the full HELP text including all commands and ends with 250 OK', () => {
		help(socket);

		// --- Must start with the 113 line ---
		expect(writes[0]).toBe(
			'113 Guía de comandos (<> = arg. obligatorio, [] = arg. optativo) \r\n',
		);

		// --- Ensure all commands appear in order ---
		const expectedCommands = [
			['DEFINE dle <palabra>', 'Obtener definiciones de palabras'],
			[
				'MATCH dle <estrategia> <palabra>',
				'Buscar palabras que coincidan con un patrón',
			],
			[
				'SHOW DATABASES o SHOW DB',
				"Mostrar diccionarios disponibles (solamente hay uno: 'dle'; comando para compatibilidad)",
			],
			[
				'SHOW STRATEGIES o SHOW STRAT',
				'Mostrar estrategias disponibles para el comando MATCH',
			],
			['SHOW INFO dle', 'Mostrar información del diccionario de la RAE'],
			['SHOW SERVER', 'Mostrar información del servidor'],
			['OPTION MIME', 'No hace nada (comando para compatibilidad)'],
			['OPTION UTF8', 'No hace nada (comando para compatibilidad)'],
			[
				'(NO OFICIAL) OPTION CONJ <ON/OFF>',
				'Habilitar o deshabilitar tablas de conjugación (no estándar, no funciona en otros servidores)',
			],
			['CLIENT [nombre]', 'Identificarse con el servidor'],
			['STATUS', 'Verificar el estado del servicio'],
			['HELP', 'Mostrar esta guía de comandos'],
			['QUIT', 'Desconectarse del servidor'],
		];

		for (let i = 0; i < expectedCommands.length; i++) {
			const [cmd, desc] = expectedCommands[i];
			expect(writes[i + 1]).toBe(`${cmd} : ${desc}\r\n`);
		}

		// --- After commands: AUTH notice ---
		expect(writes[writes.length - 3]).toBe('NO se admite "AUTH"\r\n');

		// --- Dot terminator ---
		expect(writes[writes.length - 2]).toBe('.\r\n');

		// --- Final OK ---
		expect(writes[writes.length - 1]).toBe('250 OK\r\n');
	});
});
