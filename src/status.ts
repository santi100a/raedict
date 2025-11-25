import type { Socket } from 'node:net';

export default async function command(socket: Socket) {
	try {
		const startTime = performance.now();
		const req = await fetch('https://rae-api.com/api/daily');
		if (!req.ok) {
			socket.write(
				`554 Error al contactar con la API de la RAE: ${req.status} ${req.statusText}\r\n`,
			);
			return;
		}
		const endTime = performance.now();
		const responseTime = endTime - startTime;

		const { data } = await req.json();

		const wotd = data.word ?? '(desconocida)';

		socket.write(
			`210 OK - Palabra del día: ${wotd}, tardó ${responseTime.toFixed(2)} ms en llegar\r\n`,
		);
		return;
	} catch (err) {
		console.error('[ERROR] [Module STATUS] Upstream error:', err);
		socket.write('420 Servicio no disponible\r\n');
		return;
	}
}
