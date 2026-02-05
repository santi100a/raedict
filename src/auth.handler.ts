console.info('\x1b[34m[INFO]\x1b[0m', 'AUTH module loaded.');
export = function auth(_, response) {
	response.status(
		230,
		[],
		'Este es un servidor público, todos son bienvenidos :)'
	);
};
