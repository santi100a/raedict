// wrapper to add a command-level timeout around handlers that may await
export default async function runWithTimeout<T>(
	fn: () => Promise<T>,
	timeoutMs: number
): Promise<T> {
	let timer: NodeJS.Timeout | null = null;
	const timeoutPromise = new Promise<never>((_, rej) => {
		timer = setTimeout(() => rej(new Error('command-timeout')), timeoutMs);
	});
	try {
		const r = await Promise.race([fn(), timeoutPromise]);
		if (timer) clearTimeout(timer);
		return r as T;
	} catch (err) {
		if (timer) clearTimeout(timer);
		throw err;
	}
}
