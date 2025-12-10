import type { Socket } from 'node:net';

export default function command(
	socket: Socket,
	tokens: string[],
	optionRef: { conjugations: boolean },
) {
	// OPTION <name> [value]
	const optionName = tokens[1]?.toUpperCase();
	const optionValue = tokens[2]?.toUpperCase();

	//--------------------------------------------------
	// 1) Missing option name → syntax error
	//--------------------------------------------------
	if (!optionName) {
		socket.write('501 Falta el nombre de la opción\r\n');
		return;
	}

	switch (optionName) {
		case 'MIME':
		case 'UTF8':
			//--------------------------------------------------
			// Standard/common options: no parameters allowed
			//--------------------------------------------------
			if (optionValue) {
				socket.write('501 OPTION no acepta parámetros\r\n');
				return;
			}
			socket.write('250 OK\r\n');
			return;

		case 'CONJ':
			//--------------------------------------------------
			// Your custom option: requires ON or OFF
			//--------------------------------------------------
			if (!optionValue) {
				socket.write('501 Solamente se admiten ON u OFF\r\n');
				return;
			}

			if (optionValue === 'ON') {
				optionRef.conjugations = true;
				socket.write('250 OK - conjugaciones habilitadas\r\n');
				return;
			}

			if (optionValue === 'OFF') {
				optionRef.conjugations = false;
				socket.write('250 OK - conjugaciones inhabilitadas\r\n');
				return;
			}

			// Wrong parameter
			socket.write('501 Solamente se admiten ON u OFF\r\n');
			return;

		default:
			//--------------------------------------------------
			// RFC 2229 says: unknown option ⇒ 502
			//--------------------------------------------------
			socket.write('502 Opción desconocida\r\n');
			return;
	}
}
