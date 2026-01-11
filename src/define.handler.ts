/// <reference path="lib/libapi.d.ts" />

import formatCategoryString from './lib/libformat';
import processUsage from './lib/libusage';
import writeConjugationTable from './lib/libconjugationtable';
import type { DictCommand } from '@santi100a/dict-server/dist/lib/libtypes';
import type { DictResponse } from '@santi100a/dict-server/dist/response.class';

console.info('[INFO] DEFINE module loaded.');

// In-memory cache with TTL (Time To Live)
interface CacheEntry {
	data: WordEntryResponse;
	timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 1_000 * 60 * 60; // 1 hour in milliseconds
const MAX_CACHE_SIZE = 1_000; // Maximum number of entries

// Cleanup function to remove expired entries
function cleanupCache(): void {
	const now = Date.now();
	const entriesToDelete: string[] = [];

	for (const [key, entry] of cache.entries()) {
		if (now - entry.timestamp > CACHE_TTL) {
			entriesToDelete.push(key);
		}
	}

	for (const key of entriesToDelete) {
		cache.delete(key);
	}

	// If still over limit, remove oldest entries
	if (cache.size > MAX_CACHE_SIZE) {
		const entries = Array.from(cache.entries()).sort(
			(a, b) => a[1].timestamp - b[1].timestamp
		);

		const toRemove = entries.slice(0, cache.size - MAX_CACHE_SIZE);
		for (const [key] of toRemove) {
			cache.delete(key);
		}
	}
}

// Run cleanup every 10 minutes, but allow it to be cleared in tests
const cleanupInterval = setInterval(cleanupCache, 1_000 * 60 * 10);
// Allow tests to clear the interval
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
	cleanupInterval.unref(); // Don't keep the process alive in tests
}

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

		// Create cache key (normalize to lowercase for case-insensitive caching)
		const normalizedWord = queryWord.toLowerCase();

		// Check cache first
		const cachedEntry = cache.get(normalizedWord);
		const now = Date.now();

		let result: WordEntryResponse & ErrorResponse;

		const initialTime = performance.now();
		if (cachedEntry && now - cachedEntry.timestamp < CACHE_TTL) {
			// Cache hit - use cached data
			console.info(`[INFO] Cache hit for word: ${queryWord}`);
			result = cachedEntry.data;
		} else {
			// Cache miss - fetch from API
			console.info(`[INFO] Cache miss for word: ${queryWord}`);

			const url = `https://rae-api.com/api/words/${encodeURIComponent(queryWord)}`;
			const initialTime = performance.now();
			const apiResponse = await fetch(url);

			try {
				result = await apiResponse.json();
			} catch {
				response.error(420, 'Error al interpretar la respuesta del servidor');
				return;
			}

			// Check for valid response before caching
			if (
				apiResponse.status === 404 ||
				!result?.data?.meanings ||
				result.data.meanings.length === 0
			) {
				response.error(
					552,
					(result.suggestions
						? `No se encuentra la palabra "${
								normalizedWord
							}". Sugerencias: ${result.suggestions.join(', ')}`
						: 'No match').concat(' ', `[${((performance.now() - initialTime) / 1_000).toFixed(2)} s]`)
				);
				return;
			}

			// Store in cache
			cache.set(normalizedWord, {
				data: result,
				timestamp: now
			});

			console.info(
				`[INFO] Cached word: ${queryWord} (cache size: ${cache.size})`
			);
		}

		const meanings = result?.data?.meanings ?? [];
		const headword = result?.data?.word ?? '';

		if (meanings.length === 0) {
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
					const { usage, meaning_number, description, synonyms, antonyms } =
						sense;
					const processedUsage = processUsage(usage);
					const formattedCategory = formatCategoryString(sense);

					definition += String(meaning_number).concat('. ');
					if (formattedCategory) {
						definition += '(';
						definition += formattedCategory;
						definition += ')';
						definition += ' ';
					}
					if (processedUsage) {
						definition += '[';
						definition += processedUsage;
						definition += ']';
						definition += ' ';
					}

					definition += description;
					definition += '\r\n';

					if (synonyms) {
						definition += '\tSinónimos: ';
						definition += synonyms.map(word => `{${word}}`).join(', ');
						definition += '\r\n';
					}
					if (antonyms) {
						definition += '\tAntónimos: ';
						definition += antonyms.map(word => `{${word}}`).join(', ');
						definition += '\r\n';
					}
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
								'Content-transfer-encoding': '8bit'
							}
						: {}
				};
			}),
			'definition(s) retrieved - text follows',
			`OK [${meanings.length} entrada(s) en ${((performance.now() - initialTime) / 1_000).toFixed(2)} s]`
		);
	} catch (err) {
		console.error('[DEFINE handler] ERROR:', err);
		response.error(420, 'Error interno al obtener las definiciones');
	}
};
