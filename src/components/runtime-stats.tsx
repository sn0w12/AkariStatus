"use client";

import { RuntimeStats } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useIntervalFetch } from "@/hooks/use-interval-fetch";
import { useCallback } from "react";
import { DeploymentsDialog } from "./deployments";

export default function RuntimeStatsCard() {
    const fetchData = useCallback(async () => {
        try {
            const res = await fetch(`/api/runtime-stats`);
            if (res.ok) {
                const data: RuntimeStats[] = await res.json();
                const order = ["akari", "akari-preview", "akari-status"];
                const sortedData = [...data].sort(
                    (a, b) =>
                        order.indexOf(a.pm2_name) - order.indexOf(b.pm2_name)
                );
                return sortedData;
            }
            throw new Error("Failed to fetch runtime stats");
        } catch {
            return [];
        }
    }, []);

    const { data: stats, error } = useIntervalFetch(
        fetchData,
        5 * 60, // 5 minutes
        []
    );

    const getCpuColor = (cpu: number | null) => {
        if (!cpu) return "text-muted-foreground";
        if (cpu < 50) return "text-positive";
        if (cpu < 80) return "text-warning";
        return "text-negative";
    };

    const getMemoryColor = (memory: number | null) => {
        if (!memory) return "text-muted-foreground";
        const memoryMB = memory / (1024 * 1024);
        if (memoryMB < 200) return "text-positive";
        if (memoryMB < 500) return "text-warning";
        return "text-negative";
    };

    const formatUptime = (uptime: number | null) => {
        if (!uptime) return "N/A";
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor((uptime % 86400) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);

        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    const getStatusColor = (status: string | null) => {
        switch (status) {
            case "online":
                return "bg-positive";
            case "stopped":
            case "errored":
                return "bg-negative";
            case "stopping":
            case "waiting restart":
            case "launching":
                return "bg-warning";
            default:
                return "bg-muted";
        }
    };

    if (error || !stats) {
        return (
            <Card className="gap-4 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6">
                    <p className="text-negative">{error?.message}</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="gap-4 bg-card/50 backdrop-blur-sm">
            <CardHeader>
                <CardTitle>
                    <div className="flex items-center justify-between">
                        <span>Runtime Stats</span>
                        <DeploymentsDialog />
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {stats.length === 0 ? (
                    <p className="text-muted-foreground">
                        No runtime stats available
                    </p>
                ) : (
                    <div className="space-y-4">
                        {stats.map((stat) => (
                            <div
                                key={stat.id}
                                className="flex items-center justify-between p-4 border rounded-lg bg-card"
                            >
                                <div className="flex items-center gap-4">
                                    <div>
                                        <h4 className="font-semibold">
                                            {stat.pm2_name}
                                        </h4>
                                        <Badge
                                            className={getStatusColor(
                                                stat.status
                                            )}
                                        >
                                            {stat.status || "unknown"}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div className="text-center">
                                        <p
                                            className={`font-semibold ${getCpuColor(
                                                stat.cpu
                                            )}`}
                                        >
                                            {stat.cpu !== null
                                                ? `${stat.cpu.toFixed(1)}%`
                                                : "N/A"}
                                        </p>
                                        <p className="text-muted-foreground">
                                            CPU
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <p
                                            className={`font-semibold ${getMemoryColor(
                                                stat.memory
                                            )}`}
                                        >
                                            {stat.memory !== null
                                                ? `${(
                                                      stat.memory /
                                                      (1024 * 1024)
                                                  ).toFixed(1)} MB`
                                                : "N/A"}
                                        </p>
                                        <p className="text-muted-foreground">
                                            Memory
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <p className="font-semibold">
                                            {formatUptime(stat.uptime)}
                                        </p>
                                        <p className="text-muted-foreground">
                                            Uptime
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
