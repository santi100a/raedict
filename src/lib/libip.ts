import type { Socket } from 'node:net';

export function getIpKey(socket: Socket): string {
	// Normalize IPv4-mapped IPv6, etc.
	const raw = socket.remoteAddress ?? 'unknown';
	// keep it simple: collapse IPv6 scope if any
	return raw.replace(/%.+$/, '');
}

export function recordCommandFromIp(
	socket: Socket,
	ipCommandWindows: Map<string, number[]>,
	RATE_WINDOW_MS: number,
	MAX_COMMANDS_PER_WINDOW: number
): boolean {
	const ip = getIpKey(socket);
	const now = Date.now();
	const window = ipCommandWindows.get(ip) ?? [];
	// drop old timestamps
	const cutoff = now - RATE_WINDOW_MS;
	while (window.length && window[0] < cutoff) window.shift();
	window.push(now);
	ipCommandWindows.set(ip, window);
	if (window.length > MAX_COMMANDS_PER_WINDOW) {
		return false;
	}
	return true;
}

export function incrementIpConn(
	socket: Socket,
	ipConnCounts: Map<string, number>,
	PER_IP_MAX_CONNECTIONS: number
): boolean {
	const ip = getIpKey(socket);
	const current = ipConnCounts.get(ip) ?? 0;
	if (current + 1 > PER_IP_MAX_CONNECTIONS) return false;
	ipConnCounts.set(ip, current + 1);
	return true;
}

export function decrementIpConn(
	socket: Socket,
	ipConnCounts: Map<string, number>
) {
	const ip = getIpKey(socket);
	const current = ipConnCounts.get(ip) ?? 0;
	if (current <= 1) ipConnCounts.delete(ip);
	else ipConnCounts.set(ip, current - 1);
}
