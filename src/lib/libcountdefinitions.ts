export default function countDefinitions(meanings: Record<string, any>[]) {
	let count = 0;
	for (const meaning of meanings) {
		if (Array.isArray(meaning.senses)) {
			count += meaning.senses.length;
		}
	}
	return count;
}
