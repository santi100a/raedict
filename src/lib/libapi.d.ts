interface WordEntryResponse {
	ok?: boolean;
	data?: WordEntry;
}
interface WordOnlyResponse {
	ok?: boolean;
	data?: {
		word?: string;
	};
}
interface WordEntry {
	word?: string;
	meanings?: Meaning[];
}
interface Meaning {
	origin?: Origin;
	senses?: Definition[];
	conjugations?: Conjugations;
}
interface Origin {
	raw?: string;
	type?: string;
	voice?: string;
	text?: string;
}
interface Definition {
	raw?: string;
	meaning_number?: number;
	category?:
		| 'noun'
		| 'verb'
		| 'adjective'
		| 'adverb'
		| 'pronoun'
		| 'article'
		| 'preposition'
		| 'conjunction'
		| 'interjection';
	verb_category?: string | null;
	gender?: string | null;
	article?: Article;
	usage?:
		| 'common'
		| 'rare'
		| 'outdated'
		| 'colloquial'
		| 'obsolete'
		| 'unknown';
	description?: string;
	synonyms?: string[];
	antonyms?: string[];
}
interface Article {
	category?: 'definite' | 'indefinite' | 'neuter';
	gender?: 'masculine' | 'feminine' | 'masculine_and_feminine' | 'unknown';
}
interface Conjugations {
	non_personal?: ConjugationNonPersonal;
	indicative?: ConjugationIndicative;
	subjunctive?: ConjugationSubjunctive;
	imperative?: ConjugationImperative;
}
interface ConjugationNonPersonal {
	infinitive?: string;
	participle?: string;
	gerund?: string;
	compound_infinitive?: string;
	compound_gerund?: string;
}
interface ConjugationIndicative {
	present?: Conjugation;
	present_perfect?: Conjugation;
	imperfect?: Conjugation;
	past_perfect?: Conjugation;
	preterite?: Conjugation;
	past_anterior?: Conjugation;
	future?: Conjugation;
	future_perfect?: Conjugation;
	conditional?: Conjugation;
	conditional_perfect?: Conjugation;
}
interface ConjugationSubjunctive {
	present?: Conjugation;
	present_perfect?: Conjugation;
	imperfect?: Conjugation;
	past_perfect?: Conjugation;
	future?: Conjugation;
	future_perfect?: Conjugation;
}
interface ConjugationImperative {
	singular_second_person?: string;
	singular_formal_second_person?: string;
	plural_second_person?: string;
	plural_formal_second_person?: string;
}
interface Conjugation {
	singular_first_person?: string;
	singular_second_person?: string;
	singular_formal_second_person?: string;
	singular_third_person?: string;
	plural_first_person?: string;
	plural_second_person?: string;
	plural_formal_second_person?: string;
	plural_third_person?: string;
}
interface ErrorResponse {
	ok?: boolean;
	error?: string;
	suggestions?: string[];
}
interface SearchResponse extends Array<SearchResult> {}
interface SearchResult {
	doc?: SearchDoc;
	hits?: number;
}
interface SearchDoc {
	id?: string;
	raw?: string;
}
