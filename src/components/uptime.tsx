"use client";

import { Monitor } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function Uptime() {
    const [monitor, setMonitor] = useState<Monitor | undefined>();
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            setError(null);
            const monitorRes = await fetch(`/api/uptime`);
            if (monitorRes.ok) setMonitor(await monitorRes.json());
        } catch {
            setError("Failed to load status data. Please try again later.");
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const getUptimeColor = (ratio: number) => {
        if (ratio >= 99) return "text-positive";
        if (ratio >= 95) return "text-warning";
        return "text-negative";
    };

    const getResponseColor = (time: number) => {
        if (time < 100) return "text-positive";
        if (time < 500) return "text-warning";
        return "text-negative";
    };

    if (error) {
        return (
            <Card className="gap-4">
                <CardContent className="p-6">
                    <p className="text-negative">{error}</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="mb-8 gap-4 bg-card/50 backdrop-blur-sm">
            <CardContent className="px-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div>
                            <h3 className="font-semibold text-lg">
                                {monitor?.friendly_name || "Monitor"}
                            </h3>
                            <Link
                                href={monitor?.url || "#"}
                                className="text-sm text-muted-foreground hover:underline"
                            >
                                {monitor?.url}
                            </Link>
                        </div>
                        <Badge
                            variant={
                                monitor?.status === 2
                                    ? "default"
                                    : "destructive"
                            }
                            className={
                                monitor?.status === 2
                                    ? "bg-positive"
                                    : "bg-negative"
                            }
                        >
                            {monitor?.status === 2 ? "Operational" : "Down"}
                        </Badge>
                    </div>
                    <div className="text-right">
                        <p
                            className={`text-2xl font-bold ${
                                monitor?.all_time_uptime_ratio
                                    ? getUptimeColor(
                                          parseFloat(
                                              monitor.all_time_uptime_ratio
                                          )
                                      )
                                    : "text-muted-foreground"
                            }`}
                        >
                            {monitor?.all_time_uptime_ratio
                                ? `${parseFloat(
                                      monitor.all_time_uptime_ratio
                                  ).toFixed(1)}%`
                                : "N/A"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Overall Uptime
                        </p>
                    </div>
                </div>

                {/* Uptime Statistics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {monitor?.custom_uptime_ratio && (
                        <>
                            <div className="text-center p-4 border rounded-lg bg-card">
                                <p
                                    className={`text-xl font-semibold ${getUptimeColor(
                                        parseFloat(
                                            monitor.custom_uptime_ratio.split(
                                                "-"
                                            )[0]
                                        )
                                    )}`}
                                >
                                    {parseFloat(
                                        monitor.custom_uptime_ratio.split(
                                            "-"
                                        )[0]
                                    ).toFixed(1)}
                                    %
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    7-day uptime
                                </p>
                            </div>
                            <div className="text-center p-4 border rounded-lg bg-card">
                                <p
                                    className={`text-xl font-semibold ${getUptimeColor(
                                        parseFloat(
                                            monitor.custom_uptime_ratio.split(
                                                "-"
                                            )[1]
                                        )
                                    )}`}
                                >
                                    {parseFloat(
                                        monitor.custom_uptime_ratio.split(
                                            "-"
                                        )[1]
                                    ).toFixed(1)}
                                    %
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    30-day uptime
                                </p>
                            </div>
                        </>
                    )}
                    {monitor?.average_response_time && (
                        <div className="text-center p-4 border rounded-lg bg-card">
                            <p
                                className={`text-xl font-semibold ${getResponseColor(
                                    parseFloat(monitor.average_response_time)
                                )}`}
                            >
                                {parseFloat(
                                    monitor.average_response_time
                                ).toFixed(1)}
                                ms
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Avg Response
                            </p>
                        </div>
                    )}
                    {monitor?.response_times &&
                        monitor.response_times.length > 0 && (
                            <div className="text-center p-4 border rounded-lg bg-card">
                                <p
                                    className={`text-xl font-semibold ${getResponseColor(
                                        monitor.response_times[
                                            monitor.response_times.length - 1
                                        ]?.value || 0
                                    )}`}
                                >
                                    {
                                        monitor.response_times[
                                            monitor.response_times.length - 1
                                        ]?.value
                                    }
                                    ms
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Latest Response
                                </p>
                            </div>
                        )}
                </div>

                {/* Recent Events */}
                {monitor?.logs && monitor.logs.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold mb-3">
                            Recent Events
                        </h4>
                        <div className="space-y-2">
                            {monitor.logs.slice(0, 3).map((log, index) => (
                                <div
                                    key={log.id || index}
                                    className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
                                >
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            variant={
                                                log.type === 2
                                                    ? "default"
                                                    : "secondary"
                                            }
                                            className={
                                                log.type === 2
                                                    ? "bg-positive"
                                                    : ""
                                            }
                                        >
                                            {log.type === 1
                                                ? "Down"
                                                : log.type === 2
                                                ? "Up"
                                                : "Started"}
                                        </Badge>
                                        {log.reason && (
                                            <span className="text-xs text-muted-foreground">
                                                {log.reason.detail}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(
                                            log.datetime * 1000
                                        ).toLocaleString(undefined, {
                                            hour12: false,
                                        })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
