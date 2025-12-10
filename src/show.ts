import type { Socket } from 'node:net';

export default function command(socket: Socket, tokens: string[]) {
	const name = tokens[1];
	if (!name) {
		socket.write('501 No has especificado lo que se debe mostrar\r\n');
		return;
	}

	const key = name.toUpperCase();

	// SHOW SERVER
	if (key === 'SERVER') {
		socket.write('114 Info. del servidor\r\n');
		socket.write(
			`RAE DICT en ${process.platform}, Node.js ${process.version} <https://github.com/santi100a/raedict>\r\n`,
		);
		socket.write(`(C) 2025 Santiago Rojas <https://github.com/santi100a>\r\n`);
		socket.write(`Funciona gracias a RAE API <https://rae-api.com>\r\n`);
		socket.write('.\r\n');
		socket.write('250 OK\r\n');
		return;
	}

	// SHOW INFO <db>
	if (key === 'INFO') {
		const rawDatabase = tokens[2];
		if (!rawDatabase) {
			socket.write(
				'501 No has especificado el diccionario. Solamente tenemos "dle", por cierto\r\n',
			);
			return;
		}

		const database = rawDatabase.toLowerCase();
		if (database !== 'dle') {
			socket.write('550 Solamente tenemos un diccionario: "dle"\r\n');
			return;
		}

		socket.write(`112 Info. del diccionario "dle"\r\n`);
		socket.write(
			'Diccionario de la Lengua Española, RAE, API no oficial <https://rae-api.com>\r\n',
		);
		socket.write('Fuente: API no oficial <https://rae-api.com>\r\n');
		socket.write('Derechos de autor: (C) Real Academia Española\r\n');
		socket.write('.\r\n');
		socket.write('250 OK\r\n');
		return; // <-- important
	}

	// SHOW DB
	if (['DB', 'DATABASES'].includes(key)) {
		socket.write('110 1 diccionario presente\r\n');
		socket.write('dle "Diccionario de la Lengua Española"\r\n');
		socket.write('.\r\n');
		socket.write('250 OK\r\n');
		return;
	}

	// SHOW STRAT
	if (['STRAT', 'STRATEGIES'].includes(key)) {
		socket.write(
			'111 3 estrategias presentes ("exact" -> . = ! * | "fuzzy" -> ~)\r\n',
		);
		socket.write('exact "Buscar la palabra exacta"\r\n');
		socket.write('prefix "Buscar la palabra con el principio"\r\n');
		socket.write('fuzzy "Buscar palabras con margen de error"\r\n');
		socket.write('.\r\n');
		socket.write('250 OK\r\n');
		return;
	}

	// Unknown subcommand
	socket.write('501 No se reconoce lo que se debe mostrar\r\n');
}
