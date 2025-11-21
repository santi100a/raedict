// ──────────────────────────────────────────────────────────────
// Category formatting
// ──────────────────────────────────────────────────────────────

export function processCategory(category: string): string {
	switch (category) {
		case 'adjective':
			return 'adj.';
		case 'adverb':
			return 'adv.';
		case 'noun':
			return 'sust.';
		case 'verb':
			return 'v.';
		case 'pronoun':
			return 'pron.';
		case 'preposition':
			return 'prep.';
		case 'conjunction':
			return 'conj.';
		case 'interjection':
			return 'interj.';
		case 'determiner':
			return 'det.';
		case 'article':
			return 'art.';
		case 'numeral':
			return 'num.';
		case 'prefix':
			return 'pref.';
		case 'suffix':
			return 'suf.';
		default:
			return category || '';
	}
}

export function processVerbCategory(verbCategory: string): string {
	switch (verbCategory) {
		case 'transitive':
			return 'tr.';
		case 'intransitive':
			return 'intr.';
		case 'pronominal':
			return 'prnl.';
		default:
			return '';
	}
}
