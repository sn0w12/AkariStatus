import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

export function RealtimeVisitors() {
    const [realtimeVisitors, setRealtimeVisitors] = useState(0);
    const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

    const fetchRealtime = async () => {
        try {
            const res = await fetch("/api/umami/realtime");
            if (res.ok) {
                const data = await res.json();
                setRealtimeVisitors(data.visitors);
            }
        } catch (error) {
            console.error("Failed to fetch realtime visitors", error);
        }
    };

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                fetchRealtime();
                const id = setInterval(fetchRealtime, 120000);
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
    }, []);

    return <Badge variant="secondary">{realtimeVisitors} Online</Badge>;
}
