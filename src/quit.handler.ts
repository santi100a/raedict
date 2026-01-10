console.info('[INFO] QUIT module loaded.');

export = function quit(_, response) {
	response
		.status(
			221,
			[],
			`Fue un gusto atenderte${response.clientText ? ', '.concat(response.clientText) : ''}`,
		)
		.close();
};
