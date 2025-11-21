// ──────────────────────────────────────────────────────────────
// Conjugation formatting
// ──────────────────────────────────────────────────────────────

export function processConjugation(conjugation: string): string {
  switch (conjugation) {
    // Non-personal forms
    case "infinitive":
      return "Infinitivo";
    case "participle":
      return "Participio";
    case "gerund":
      return "Gerundio";
    case "compound_infinitive":
      return "Infinitivo compuesto";
    case "compound_gerund":
      return "Gerundio compuesto";

    // Moods
    case "indicative":
      return "Indicativo";
    case "subjunctive":
      return "Subjuntivo";
    case "imperative":
      return "Imperativo";
    case "non_personal":
      return "Formas no personales";

    // Tenses (simple + compound)
    case "present":
      return "Presente";
    case "present_perfect":
      return "Pretérito perfecto compuesto";
    case "imperfect":
      return "Pretérito imperfecto";
    case "past_perfect":
      return "Pretérito pluscuamperfecto";
    case "preterite":
      return "Pretérito perfecto simple";
    case "past_anterior":
      return "Pretérito anterior";
    case "future":
      return "Futuro simple";
    case "future_perfect":
      return "Futuro compuesto";
    case "conditional":
      return "Condicional simple";
    case "conditional_perfect":
      return "Condicional compuesto";

    // Persons
    case "singular_first_person":
      return "1.ª persona del singular";
    case "singular_second_person":
      return "2.ª persona del singular";
    case "singular_formal_second_person":
      return "2.ª persona formal del singular";
    case "singular_third_person":
      return "3.ª persona del singular";

    case "plural_first_person":
      return "1.ª persona del plural";
    case "plural_second_person":
      return "2.ª persona del plural";
    case "plural_formal_second_person":
      return "2.ª persona formal del plural";
    case "plural_third_person":
      return "3.ª persona del plural";

    default:
      return conjugation ?? "";
  }
}
