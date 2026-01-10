/// <reference path="lib/libapi.d.ts" />

import formatCategoryString from './lib/libformat';
import processUsage from './lib/libusage';
import writeConjugationTable from './lib/libconjugationtable';
import type { DictCommand } from '@santi100a/dict-server/dist/lib/libtypes';
import type { DictResponse } from '@santi100a/dict-server/dist/response.class';

console.info('[INFO] DEFINE module loaded.');

export = async function define(command: DictCommand, response: DictResponse) {
	try {
		const [dictionary, queryWord] = command.parameters;

		if (!dictionary || !queryWord) {
			response.status(501);
			return;
		}
		if (!['*', '!', 'dle'].includes(dictionary)) {
			response.status(550);
			return;
		}

		const url = `https://rae-api.com/api/words/${encodeURIComponent(queryWord)}`;
		const apiResponse = await fetch(url);

		let result: WordEntryResponse;
		try {
			result = await apiResponse.json();
		} catch {
			response.error(420, 'Error al interpretar la respuesta del servidor');
			return;
		}

		const meanings = result?.data?.meanings ?? [];
		const headword = result?.data?.word ?? '';

		if (apiResponse.status === 404 || meanings.length === 0) {
			response.error(552);
			return;
		}

		response.writeDefinitions(
			meanings.map(meaning => {
				let definition = '';
				if (meaning.origin) {
					definition += `\\${meaning.origin.raw}\\`;
					definition += '\r\n\r\n';
				}
				for (const sense of meaning.senses) {
					definition += `${sense.meaning_number}. ${formatCategoryString(sense)} ${processUsage(
						sense.usage,
					)} ${sense.description}`;
					definition += '\r\n';
				}
				if (meaning.conjugations) {
					definition += '\r\n';
					definition += writeConjugationTable(meaning.conjugations);
				}
				return {
					headword,
					dictionary: 'dle',
					definition,
					dictionaryDescription: 'Diccionario de la Lengua Española',
					mimeHeaders: response.optionMimeEnabled
						? {
								'Content-type': 'text/plain; charset=utf-8',
								'Content-transfer-encoding': '8bit',
							}
						: {},
				};
			}),
		);
	} catch (err) {
		console.error('[DEFINE handler] ERROR:', err);
		response.error(420, 'Error interno al obtener las definiciones');
	}
};
