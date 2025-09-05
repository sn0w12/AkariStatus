import { useCallback } from "react";
import { useIntervalFetch } from "@/hooks/use-interval-fetch";
import { Badge } from "@/components/ui/badge";

export function RealtimeVisitors() {
    const fetchRealtime = useCallback(async () => {
        const res = await fetch("/api/umami/realtime");
        if (res.ok) {
            const data = await res.json();
            return data.visitors;
        }
        throw new Error("Failed to fetch realtime visitors");
    }, []);

    const { data: realtimeVisitors, error } = useIntervalFetch(
        fetchRealtime,
        2 * 60, // 2 minutes
        0
    );

    if (error) {
        console.error("Error fetching realtime visitors:", error);
        return null;
    }

    return <Badge variant="secondary">{realtimeVisitors} Online</Badge>;
}
