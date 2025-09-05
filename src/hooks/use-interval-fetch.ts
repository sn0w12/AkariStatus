import { useState, useEffect, useCallback } from "react";

export function useIntervalFetch<T>(
    fetchFn: () => Promise<T>,
    intervalSeconds: number,
    initialData?: T
) {
    const [data, setData] = useState<T | undefined>(initialData);
    const [error, setError] = useState<Error | null>(null);
    const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setError(null);
            const result = await fetchFn();
            setData(result);
        } catch (err) {
            setError(err as Error);
        }
    }, [fetchFn]);

    useEffect(() => {
        const intervalMs = intervalSeconds * 1000;
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                fetchData();
                const id = setInterval(fetchData, intervalMs);
                setIntervalId(id);
            } else {
                if (intervalId) {
                    clearInterval(intervalId);
                    setIntervalId(null);
                }
            }
        };

        handleVisibilityChange();
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange
            );
            if (intervalId) clearInterval(intervalId);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchData, intervalSeconds]);

    return { data, error };
}
