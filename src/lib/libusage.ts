export default function processUsage(usage: string): string {
	const usageMap = new Map<string, string>([
		['obsolete', 'En desuso'],
		['rare', 'Poco usado']
	]);

	return usageMap.get(usage) ?? '';
}
