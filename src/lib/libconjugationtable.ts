/* -------------------------------------------------------------------------- */
/*                         Conjugation table formatter                         */
/* -------------------------------------------------------------------------- */
import { processConjugation } from './libconjugations';

export default function writeConjugationTable(conj: any) {
	let string = '';

	if (!conj) return;

	string += 'Conjugaciones (tabla resumida):\r\n';

	const line =
		'+------------------------+------------------------------------------+\r\n';
	string += line;
	string +=
		'| Tiempo                 | Formas                                   |\r\n';
	string += line;

	// Iterate through moods and tenses
	const rows: Array<{ label: string; text: string }> = [];

	function addForm(label: string, forms: Record<string, any>) {
		const values = Object.values(forms);
		const joined = values.join(', ');

		rows.push({
			label,
			text: joined.substring(0, 42),
		});
	}

	// Non-personal
	if (conj.non_personal) {
		addForm('Formas no personales', conj.non_personal);
	}

	// Indicative
	if (conj.indicative) {
		for (const [tense, forms] of Object.entries(conj.indicative)) {
			addForm(
				'Indicativo: ' + processConjugation(tense),
				forms as Record<string, string>,
			);
		}
	}

	// Subjunctive
	if (conj.subjunctive) {
		for (const [tense, forms] of Object.entries(conj.subjunctive)) {
			addForm(
				'Subjuntivo: ' + processConjugation(tense),
				forms as Record<string, string>,
			);
		}
	}

	// Imperative (already simple)
	if (conj.imperative) {
		addForm('Imperativo', conj.imperative);
	}

	// Write rows
	for (const row of rows) {
		string += `| ${row.label.padEnd(22)} | ${row.text.padEnd(42)} |\r\n`;
	}

	string += line;
	string += '\r\n';

	return string;
}
