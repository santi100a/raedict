console.info('[INFO] AUTH module loaded.');
export = function auth(_, response) {
	response.status(
		230,
		[],
		'Este es un servidor público, todos son bienvenidos :)',
	);
};
