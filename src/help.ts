import type { Socket } from 'node:net';

const COMMANDS = [
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
	['CLIENT [nombre]', 'Identificarse con el servidor'],
	['STATUS', 'Verificar el estado del servicio'],
	['HELP', 'Mostrar esta lista de comandos'],
	['QUIT', 'Desconectarse del servidor'],
];
export default function command(socket: Socket) {
	socket.write(
		'113 Lista de comandos (<> = arg. obligatorio, [] = arg. optativo) \r\n',
	);
	for (const [cmd, desc] of COMMANDS) {
		socket.write(`${cmd} : ${desc}\r\n`);
	}
	socket.write('NO se admite "AUTH" y "OPTION" no hace nada\r\n');
	socket.write('.\r\n');
	socket.write('250 OK\r\n');
}
