// ──────────────────────────────────────────────────────────────
// Conjugation formatting
// ──────────────────────────────────────────────────────────────

export function processConjugation(conjugation: string): string {
	// Lazy-initialized map for conjugation labels
	if (!(processConjugation as any)._map) {
		(processConjugation as any)._map = new Map<string, string>([
			// Non-personal forms
			['infinitive', 'Infinitivo'],
			['participle', 'Participio'],
			['gerund', 'Gerundio'],
			['compound_infinitive', 'Infinitivo compuesto'],
			['compound_gerund', 'Gerundio compuesto'],

			// Moods
			['indicative', 'Indicativo'],
			['subjunctive', 'Subjuntivo'],
			['imperative', 'Imperativo'],
			['non_personal', 'Formas no personales'],

			// Tenses (simple + compound)
			['present', 'Presente'],
			['present_perfect', 'Pretérito perfecto compuesto'],
			['imperfect', 'Pretérito imperfecto'],
			['past_perfect', 'Pretérito pluscuamperfecto'],
			['preterite', 'Pretérito perfecto simple'],
			['past_anterior', 'Pretérito anterior'],
			['future', 'Futuro simple'],
			['future_perfect', 'Futuro compuesto'],
			['conditional', 'Condicional simple'],
			['conditional_perfect', 'Condicional compuesto'],

			// Persons
			['singular_first_person', '1.ª persona del singular'],
			['singular_second_person', '2.ª persona del singular'],
			['singular_formal_second_person', '2.ª persona formal del singular'],
			['singular_third_person', '3.ª persona del singular'],

			['plural_first_person', '1.ª persona del plural'],
			['plural_second_person', '2.ª persona del plural'],
			['plural_formal_second_person', '2.ª persona formal del plural'],
			['plural_third_person', '3.ª persona del plural']
		]);
	}

	const map = (processConjugation as any)._map as Map<string, string>;
	return map.get(conjugation) ?? conjugation ?? '';
}
