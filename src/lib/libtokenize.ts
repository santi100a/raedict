export default function tokenize(line: string): string[] {
	// Split on whitespace but keep quoted strings together (single and double)
	const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
	const tokens: string[] = [];
	let match;

	while ((match = re.exec(line)) !== null) {
		tokens.push(match[1] ?? match[2] ?? match[3]);
	}

	return tokens;
}
