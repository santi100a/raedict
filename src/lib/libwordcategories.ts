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

export function processGender(gender: string): string {
	const genderMap = new Map<string, string>([
		['masculine', 'm.'],
		['feminine', 'f.'],
	]);

	return genderMap.get(gender) ?? '';
}

export function processArticle(article: Article): string {
	if (!article) return;
	const genderMap = new Map<Article['gender'], string>([
		['masculine', 'm.'],
		['feminine', 'f.'],
		['masculine_and_feminine', 'm. y f.'],
		['unknown', 'desc.'],
	]);
	const categoryMap = new Map<Article['category'], string>([
		['definite', 'def.'],
		['indefinite', 'indef.'],
	]);
	const gender = genderMap.get(article.gender);
	const category = categoryMap.get(article.category);

	if (!gender || !category) return '';

	return `${category} ${gender}`;
}
