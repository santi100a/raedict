console.info('[INFO] STATUS module loaded.');

export = async function status(_, response) {
	try {
		const startTime = performance.now();
		const req = await fetch('https://rae-api.com/api/daily');
		if (!req.ok) {
			response.error(
				554,
				`Error al contactar con la API de la RAE: ${req.status} ${req.statusText}`,
			);
			return;
		}
		const endTime = performance.now();
		const responseTime = endTime - startTime;

		const { data } = (await req.json()) as WordOnlyResponse;

		const wotd = data.word ?? '(desconocida)';

		response.status(
			210,
			[],
			`OK - Palabra del día: ${wotd}, tardó ${responseTime.toFixed(2)} ms en llegar\r\n`,
		);
		return;
	} catch (err) {
		console.error('[ERROR] [Module STATUS] Upstream error:', err);
		response.error(420, 'Servicio no disponible');
		return;
	}
}