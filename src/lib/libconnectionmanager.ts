interface ConnectionStats {
    connectTime: number;
    queryCount: number;
}

interface RateLimitEntry {
    count: number;
    windowStart: number;
}

export class ConnectionManager {
    private connections = new Map<string, ConnectionStats>();
    private connectionAttempts = new Map<string, RateLimitEntry>();
    private cleanupTimer: NodeJS.Timeout;
    private activeConnections = 0;

    constructor(
        private readonly CLEANUP_INTERVAL: number,
        private readonly LIMIT_CHILDS: number,
        private readonly RATE_LIMIT_WINDOW: number,
        private readonly MAX_CONNECTIONS_PER_WINDOW: number,
        private readonly LIMIT_TIME: number,
        private readonly LIMIT_QUERIES: number,

    ) {
        this.cleanupTimer = setInterval(() => {
            this.cleanup();
        }, CLEANUP_INTERVAL);
    }

    // Check if we can accept a new connection
    canAcceptConnection(): boolean {
        return this.activeConnections < this.LIMIT_CHILDS;
    }

    // Check connection attempt rate limit (anti-flood)
    checkConnectionRate(ip: string): boolean {
        const now = Date.now();
        const entry = this.connectionAttempts.get(ip);

        if (!entry) {
            this.connectionAttempts.set(ip, {
                count: 1,
                windowStart: now
            });
            return true;
        }

        // Reset window if expired
        if (now - entry.windowStart >= this.RATE_LIMIT_WINDOW) {
            entry.count = 1;
            entry.windowStart = now;
            return true;
        }

        // Check limit
        entry.count++;
        return entry.count <= this.MAX_CONNECTIONS_PER_WINDOW;
    }

    // Register a new connection
    registerConnection(connectionId: string): void {
        this.connections.set(connectionId, {
            connectTime: Date.now(),
            queryCount: 0
        });
        this.activeConnections++;
    }

    // Unregister a connection
    unregisterConnection(connectionId: string): void {
        if (this.connections.delete(connectionId)) {
            this.activeConnections--;
        }
    }

    // Check if connection time limit exceeded
    isTimeLimitExceeded(connectionId: string): boolean {
        const stats = this.connections.get(connectionId);
        if (!stats) return false;

        const elapsed = (Date.now() - stats.connectTime) / 1000;
        return elapsed >= this.LIMIT_TIME;
    }

    // Check if query limit exceeded
    isQueryLimitExceeded(connectionId: string): boolean {
        const stats = this.connections.get(connectionId);
        if (!stats) return false;

        return stats.queryCount >= this.LIMIT_QUERIES;
    }

    // Increment query count for a connection
    incrementQueryCount(connectionId: string): void {
        const stats = this.connections.get(connectionId);
        if (stats) {
            stats.queryCount++;
        }
    }

    // Get current query count
    getQueryCount(connectionId: string): number {
        return this.connections.get(connectionId)?.queryCount || 0;
    }

    // Get remaining queries
    getRemainingQueries(connectionId: string): number {
        const count = this.getQueryCount(connectionId);
        return Math.max(0, this.LIMIT_QUERIES - count);
    }

    private cleanup(): void {
        const now = Date.now();
        // Clean up old connection attempt entries
        for (const [ip, entry] of this.connectionAttempts.entries()) {
            if (now - entry.windowStart >= this.RATE_LIMIT_WINDOW * 2) {
                this.connectionAttempts.delete(ip);
            }
        }
    }

    shutdown(): void {
        clearInterval(this.cleanupTimer);
        this.connections.clear();
        this.connectionAttempts.clear();
    }

    getActiveConnections(): number {
        return this.activeConnections;
    }
}

