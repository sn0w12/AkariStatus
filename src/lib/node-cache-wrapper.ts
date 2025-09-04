import NodeCache from "node-cache";

class CacheWrapper {
    private cache: NodeCache | null;
    private isDev: boolean;

    constructor() {
        this.isDev = process.env.NODE_ENV === "development";
        this.cache = this.isDev ? null : new NodeCache();
    }

    get<T>(key: string): T | undefined {
        if (this.isDev || !this.cache) return undefined;
        return this.cache.get<T>(key);
    }

    set<T>(key: string, value: T, ttl: number): boolean {
        if (this.isDev || !this.cache) return false;
        return this.cache.set(key, value, ttl);
    }

    del(key: string): number {
        if (this.isDev || !this.cache) return 0;
        return this.cache.del(key);
    }

    flushAll(): void {
        if (this.isDev || !this.cache) return;
        this.cache.flushAll();
    }
}

const cacheWrapper = new CacheWrapper();
export default cacheWrapper;
