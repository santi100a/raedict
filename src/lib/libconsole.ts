export function log(...args: any[]) {
	console.info('[DICT]', new Date().toISOString(), ...args);
}
export function warn(...args: any[]) {
	console.warn('[DICT]', new Date().toISOString(), ...args);
}
