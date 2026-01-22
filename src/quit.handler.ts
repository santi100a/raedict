console.info('\x1b[34m[INFO]\x1b[0m', 'QUIT module loaded.');

export = function quit(_, response) {
	response
		.status(
			221,
			[],
			`Fue un gusto atenderte${response.clientText ? ', '.concat(response.clientText) : ''}`
		)
		.close();
};
