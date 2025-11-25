/* -------------------------------------------------------------------------- */
/*                         Conjugation table formatter                         */
/* -------------------------------------------------------------------------- */
import type { Socket } from 'node:net';
import { processConjugation } from './libconjugations';

export default function writeConjugationTable(socket: Socket, conj: any) {
	if (!conj) return;

	socket.write('Conjugaciones (tabla resumida):\r\n');

	const line =
		'+------------------------+------------------------------------------+\r\n';
	socket.write(line);
	socket.write(
		'| Tiempo                 | Formas                                   |\r\n',
	);
	socket.write(line);

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
		socket.write(`| ${row.label.padEnd(22)} | ${row.text.padEnd(42)} |\r\n`);
	}

	socket.write(line);
	socket.write('\r\n');
}
