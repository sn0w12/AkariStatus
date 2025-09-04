/**
 * Generates cache control headers for different caching levels.
 * @param time - The base time in seconds for caching
 * @param staleWhileRevalidate - Time in seconds to use stale content while revalidating (defaults to time*2)
 * @param staleIfError - Time in seconds to use stale content when errors occur (defaults to time)
 * @returns An object containing cache control headers
 */
export function generateCacheHeaders(
    time: number,
    staleWhileRevalidate?: number,
    staleIfError?: number
) {
    let cacheControl = `public, max-age=${time}`;

    const staleWhileRevalidateTime =
        staleWhileRevalidate !== undefined
            ? staleWhileRevalidate
            : Math.round(time * 2);
    cacheControl += `, stale-while-revalidate=${staleWhileRevalidateTime}`;

    const staleIfErrorTime = staleIfError !== undefined ? staleIfError : time;
    cacheControl += `, stale-if-error=${staleIfErrorTime}`;

    return {
        "Cache-Control": cacheControl,
        "CDN-Cache-Control": cacheControl,
    };
}

/**
 * Determines cache time in seconds based on timeframe.
 * @param timeframe - The timeframe string (e.g., "1d", "7d", "30d")
 * @returns Cache time in seconds
 */
export function getCacheTimeForTimeframe(timeframe: string): number {
    switch (timeframe) {
        case "1d":
            return 300; // 5 minutes
        case "this-week":
            return 600; // 10 minutes
        case "7d":
            return 1800; // 30 minutes
        case "this-month":
            return 3600; // 1 hour
        case "30d":
            return 7200; // 2 hours
        case "90d":
            return 14400; // 4 hours
        default:
            return 3600; // Default to 1 hour
    }
}
