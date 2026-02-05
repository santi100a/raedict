export default async function acquireGlobalApiSlot(
	globalApiInFlight: number,
	globalApiQueue: (() => void)[],
	GLOBAL_API_CONCURRENCY: number
): Promise<() => void> {
	// returns a resolver that releases the slot when called
	if (globalApiInFlight < GLOBAL_API_CONCURRENCY) {
		globalApiInFlight++;
		return Promise.resolve(() => {
			globalApiInFlight--;
			if (globalApiQueue.length) {
				const waiter = globalApiQueue.shift()!;
				waiter();
			}
		});
	}
	return new Promise(resolve => {
		globalApiQueue.push(() => {
			globalApiInFlight++;
			resolve(() => {
				globalApiInFlight--;
				if (globalApiQueue.length) {
					const waiter = globalApiQueue.shift()!;
					waiter();
				}
			});
		});
	});
}
