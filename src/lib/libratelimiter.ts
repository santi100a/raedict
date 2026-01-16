interface RateLimitEntry {
	count: number;
	windowStart: number;
	blocked: boolean;
}

export class RateLimiter {
	private requests = new Map<string, RateLimitEntry>();
	private cleanupTimer: NodeJS.Timeout;

	constructor(
		interval: number,
		private readonly rateLimitWindow: number,
        private readonly maxRequestsPerWindow: number
	) {
		// Periodically clean up old entries
		this.cleanupTimer = setInterval(() => {
			this.cleanup();
		}, interval);
	}

	checkLimit(ip: string): boolean {
		const now = Date.now();
		const entry = this.requests.get(ip);

		if (!entry) {
			// First request from this IP
			this.requests.set(ip, {
				count: 1,
				windowStart: now,
				blocked: false
			});
			return true;
		}

		// Check if we need to reset the window
		if (now - entry.windowStart >= this.rateLimitWindow) {
			entry.count = 1;
			entry.windowStart = now;
			entry.blocked = false;
			return true;
		}

		// Increment counter
		entry.count++;

		// Check if limit exceeded
		if (entry.count > this.maxRequestsPerWindow) {
			entry.blocked = true;
			return false;
		}

		return true;
	}

	isBlocked(ip: string): boolean {
		const entry = this.requests.get(ip);
		if (!entry) return false;

		const now = Date.now();
		// Unblock if window has passed
		if (now - entry.windowStart >= this.rateLimitWindow) {
			entry.blocked = false;
			entry.count = 0;
			entry.windowStart = now;
			return false;
		}

		return entry.blocked;
	}

	getRemainingRequests(ip: string): number {
		const entry = this.requests.get(ip);
		if (!entry) return this.maxRequestsPerWindow;

		const now = Date.now();
		if (now - entry.windowStart >= this.rateLimitWindow) {
			return this.maxRequestsPerWindow;
		}

		return Math.max(0, this.maxRequestsPerWindow - entry.count);
	}

	private cleanup(): void {
		const now = Date.now();
		for (const [ip, entry] of this.requests.entries()) {
			// Remove entries older than 2x the window
			if (now - entry.windowStart >= this.rateLimitWindow * 2) {
				this.requests.delete(ip);
			}
		}
	}

	shutdown(): void {
		clearInterval(this.cleanupTimer);
		this.requests.clear();
	}
}
