import type { DictCommand } from '@santi100a/dict-server/dist/lib/libtypes';
import type { DictResponse } from '@santi100a/dict-server/dist/response.class';

console.info('[INFO] MATCH module loaded.');

// In-memory cache with TTL (Time To Live)
interface CacheEntry {
	data: ErrorResponse & SearchResponse;
	timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour in milliseconds
const MAX_CACHE_SIZE = 1000; // Maximum number of entries

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
		const entries = Array.from(cache.entries())
			.sort((a, b) => a[1].timestamp - b[1].timestamp);
		
		const toRemove = entries.slice(0, cache.size - MAX_CACHE_SIZE);
		for (const [key] of toRemove) {
			cache.delete(key);
		}
	}
}

// Run cleanup every 10 minutes, but allow it to be cleared in tests
const cleanupInterval = setInterval(cleanupCache, 1000 * 60 * 10);
// Allow tests to clear the interval
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
	cleanupInterval.unref(); // Don't keep the process alive in tests
}

export = async function match(command: DictCommand, response: DictResponse) {
	const [dictionary, strategy, ...rest] = command.parameters;

	if (!dictionary || !strategy || rest.length === 0) {
		response.error(501);
		return;
	}

	if (!['dle', '*', '!'].includes(dictionary.toLowerCase())) {
		response.error(550);
		return;
	}

	const query = rest.join(' ').replace(/(^['"])|(['"]$)/g, '');
	let strat = strategy.toLowerCase();
	if (['.', '=', '!', '*'].includes(strat)) strat = 'exact';
	if (['~'].includes(strat)) strat = 'fuzzy';

	let engine: string;

	if (['exact', 'prefix'].includes(strat)) engine = 'linear';
	else if (['fuzzy'].includes(strat)) engine = 'hits';
	else {
		response.error(551);
		return;
	}

	// Create cache key combining query and engine (case-insensitive)
	const cacheKey = `${query.toLowerCase()}:${engine}`;
	
	// Check cache first
	const cachedEntry = cache.get(cacheKey);
	const now = Date.now();
	
	let data: ErrorResponse & SearchResponse;

	if (cachedEntry && (now - cachedEntry.timestamp) < CACHE_TTL) {
		// Cache hit - use cached data
		console.info(`[INFO] Cache hit for match query: ${query} (engine: ${engine})`);
		data = cachedEntry.data;
	} else {
		// Cache miss - fetch from API
		console.info(`[INFO] Cache miss for match query: ${query} (engine: ${engine})`);
		
		const url = `https://rae-api.com/api/search?q=${encodeURIComponent(query)}&engine=${engine}`;

		try {
			const res = await fetch(url);
			if (!res.ok) {
				response.error(
					420,
					`Error del servidor al buscar: ${res.status} ${res.statusText}`,
				);
				return;
			}
			data = await res.json();
		} catch (err) {
			console.error('[ERROR] [Module MATCH] API connection error:', err);
			response.error(420, `Error de conexión con la API`);
			return;
		}

		// Only cache successful results with data
		const results = Array.isArray(data) ? data : [];
		if (results.length > 0) {
			cache.set(cacheKey, {
				data,
				timestamp: now
			});
			console.info(`[INFO] Cached match query: ${query} (engine: ${engine}, cache size: ${cache.size})`);
		}
	}

	// The API returns an array of documents with { doc: { id }, hits }
	const results = Array.isArray(data) ? data : [];

	if (results.length > 0) {
		response.writeMatches(
			results.map(result => {
				return {
					dictionary: 'dle',
					word: result.doc?.id,
				};
			}),
		);
		return;
	}
	response.error(552);
};