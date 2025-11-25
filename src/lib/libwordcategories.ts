// ──────────────────────────────────────────────────────────────
// Category formatting
// ──────────────────────────────────────────────────────────────

export function processCategory(category: string): string {
	const categoryMap = new Map<string, string>([
		['adjective', 'adj.'],
		['adverb', 'adv.'],
		['noun', 'sust.'],
		['verb', 'v.'],
		['pronoun', 'pron.'],
		['preposition', 'prep.'],
		['conjunction', 'conj.'],
		['interjection', 'interj.'],
		['determiner', 'det.'],
		['article', 'art.'],
		['numeral', 'num.'],
		['prefix', 'pref.'],
		['suffix', 'suf.'],
	]);

	return categoryMap.get(category) ?? category ?? '';
}

export function processVerbCategory(verbCategory: string): string {
	const verbCategoryMap = new Map<string, string>([
		['transitive', 'tr.'],
		['intransitive', 'intr.'],
		['pronominal', 'prnl.'],
	]);

	return verbCategoryMap.get(verbCategory) ?? '';
}
