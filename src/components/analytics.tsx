"use client";

import { UmamiStats, PageviewData, getTimeRange, unit } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageviewsChart } from "@/components/analytics/pageviews-chart";
import { TimeframeSelector } from "@/components/analytics/timeframe-selector";
import { useState, useEffect, useCallback } from "react";
import { Routes } from "@/components/analytics/routes";

const generatePlaceholderDataUTC = (
    timeframe: string,
    offset: number
): { x: number; y: number }[] => {
    const now = Date.now();
    const nowDate = new Date(now);
    let startAt: number;
    let endAt: number;
    let unit: unit;

    switch (timeframe) {
        case "1d":
            const currentHourStart = new Date(
                Date.UTC(
                    nowDate.getUTCFullYear(),
                    nowDate.getUTCMonth(),
                    nowDate.getUTCDate(),
                    nowDate.getUTCHours(),
                    0,
                    0,
                    0
                )
            );
            endAt = currentHourStart.getTime() + 60 * 60 * 1000;
            startAt = endAt - 24 * 60 * 60 * 1000;
            unit = "hour";
            break;
        case "this-week":
            const dayOfWeek = nowDate.getUTCDay();
            const startOfWeek = new Date(
                Date.UTC(
                    nowDate.getUTCFullYear(),
                    nowDate.getUTCMonth(),
                    nowDate.getUTCDate() - dayOfWeek + 1,
                    0,
                    0,
                    0,
                    0
                )
            );
            const endOfWeek = new Date(
                Date.UTC(
                    nowDate.getUTCFullYear(),
                    nowDate.getUTCMonth(),
                    nowDate.getUTCDate() - dayOfWeek + 7,
                    23,
                    59,
                    59,
                    999
                )
            );
            startAt = startOfWeek.getTime();
            endAt = endOfWeek.getTime();
            unit = "day";
            break;
        case "7d":
            startAt = now - 7 * 24 * 60 * 60 * 1000;
            endAt = now;
            unit = "day";
            break;
        case "this-month":
            const nowDateMonth = new Date(now);
            const startOfMonth = new Date(
                Date.UTC(
                    nowDateMonth.getUTCFullYear(),
                    nowDateMonth.getUTCMonth(),
                    1,
                    0,
                    0,
                    0,
                    0
                )
            );
            const endOfMonth = new Date(
                Date.UTC(
                    nowDateMonth.getUTCFullYear(),
                    nowDateMonth.getUTCMonth() + 1,
                    1,
                    0,
                    0,
                    0,
                    0
                )
            );
            startAt = startOfMonth.getTime();
            endAt = endOfMonth.getTime();
            unit = "day";
            break;
        case "30d":
            startAt = now - 30 * 24 * 60 * 60 * 1000;
            endAt = now;
            unit = "day";
            break;
        case "90d":
            startAt = now - 90 * 24 * 60 * 60 * 1000;
            endAt = now;
            unit = "day";
            break;
        case "12m":
            const twelveMonthsAgo = new Date(now);
            twelveMonthsAgo.setUTCMonth(twelveMonthsAgo.getUTCMonth() - 12);
            twelveMonthsAgo.setUTCDate(1);
            twelveMonthsAgo.setUTCHours(0, 0, 0, 0);
            startAt = twelveMonthsAgo.getTime();
            endAt = now;
            unit = "month";
            break;
        case "this-year":
            const nowDateYear = new Date(now);
            const startOfYear = new Date(
                Date.UTC(nowDateYear.getUTCFullYear(), 0, 1, 0, 0, 0, 0)
            );
            const endOfCurrentMonth = new Date(
                Date.UTC(
                    nowDateYear.getUTCFullYear(),
                    nowDateYear.getUTCMonth() + 1,
                    1,
                    0,
                    0,
                    0,
                    0
                )
            );
            startAt = startOfYear.getTime();
            endAt = endOfCurrentMonth.getTime();
            unit = "month";
            break;
        default:
            startAt = now - 30 * 24 * 60 * 60 * 1000;
            endAt = now;
            unit = "day";
            break;
    }

    const shiftMs = offset * 24 * 60 * 60 * 1000;
    startAt += shiftMs;
    endAt += shiftMs;

    const diffDays = (endAt - startAt) / (24 * 60 * 60 * 1000);
    if (diffDays <= 2) unit = "hour";
    else if (diffDays <= 90) unit = "day";
    else unit = "month";

    if (unit === "month") {
        const startDate = new Date(startAt);
        const endDate = new Date(endAt);
        const numMonths =
            (endDate.getUTCFullYear() - startDate.getUTCFullYear()) * 12 +
            (endDate.getUTCMonth() - startDate.getUTCMonth());
        const months: number[] = [];
        let current = new Date(startAt);
        for (let i = 0; i < numMonths; i++) {
            months.push(current.getTime());
            current = new Date(current);
            current.setUTCMonth(current.getUTCMonth() + 1);
        }
        return months.map((x) => ({ x, y: 0 }));
    } else {
        const intervalMs =
            unit === "hour" ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
        const points = Math.ceil((endAt - startAt) / intervalMs);
        return Array.from({ length: points }, (_, i) => ({
            x: startAt + i * intervalMs,
            y: 0,
        }));
    }
};

export function Analytics() {
    const [timeframe, setTimeframe] = useState("30d");
    const [days, setDays] = useState(30);
    const [stats, setStats] = useState<UmamiStats | undefined>();
    const [pageviewsData, setPageviewsData] = useState<
        PageviewData[] | undefined
    >();
    const [metricsData, setMetricsData] = useState<
        PageviewData[] | undefined
    >();
    const [originalMetricsData, setOriginalMetricsData] = useState<
        PageviewData[] | undefined
    >();
    const [error, setError] = useState<string | null>(null);

    const [animatedPageviews, setAnimatedPageviews] = useState(0);
    const [animatedVisitors, setAnimatedVisitors] = useState(0);
    const [animatedVisits, setAnimatedVisits] = useState(0);
    const [animatedBounces, setAnimatedBounces] = useState(0);
    const [animatedPageviewsPercent, setAnimatedPageviewsPercent] = useState(0);
    const [animatedVisitorsPercent, setAnimatedVisitorsPercent] = useState(0);
    const [animatedVisitsPercent, setAnimatedVisitsPercent] = useState(0);
    const [animatedBouncesPercent, setAnimatedBouncesPercent] = useState(0);

    const [pageviewsPercent, setPageviewsPercent] = useState(0);
    const [visitorsPercent, setVisitorsPercent] = useState(0);
    const [visitsPercent, setVisitsPercent] = useState(0);
    const [bouncesPercent, setBouncesPercent] = useState(0);

    const [realtimeVisitors, setRealtimeVisitors] = useState(0);

    const [offset, setOffset] = useState<number>(0);
    const [currentUnit, setCurrentUnit] = useState<unit>(
        () => getTimeRange(timeframe).unit
    );
    const [canShiftRight, setCanShiftRight] = useState(true);

    const [chartData, setChartData] = useState(() => {
        const placeholder = generatePlaceholderDataUTC(timeframe, offset);
        const { unit } = getTimeRange(timeframe, offset);
        return placeholder.map((item) => ({
            formattedDate:
                unit === "hour"
                    ? new Date(item.x).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: false,
                      })
                    : unit === "month"
                    ? new Date(item.x).toLocaleDateString("en-US", {
                          month: "short",
                      })
                    : new Date(item.x).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                      }),
            Views: item.y,
        }));
    });

    const animateNumber = (
        target: number,
        setter: (value: number) => void,
        duration = 500,
        initialValue = 0,
        easing: (t: number) => number = (t) => 1 - Math.pow(1 - t, 3)
    ) => {
        const startValue = initialValue;
        const change = target - startValue;
        const startTime = performance.now();

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easing(progress);
            const currentValue = startValue + change * easedProgress;
            setter(Math.round(currentValue));

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setter(target);
            }
        };

        requestAnimationFrame(animate);
    };

    const transformMetricsData = (data: PageviewData[]): PageviewData[] => {
        const map = new Map<string, number>();
        for (const item of data) {
            let transformedX = item.x;
            if (
                item.x.startsWith("/manga/") &&
                item.x.split("/").length === 3
            ) {
                transformedX = "/manga/[id]";
            } else if (
                item.x.startsWith("/manga/") &&
                item.x.includes("/chapter-")
            ) {
                transformedX = "/manga/[id]/[subId]";
            } else if (
                item.x.startsWith("/genre/") &&
                item.x.split("/").length === 3
            ) {
                transformedX = "/genre/[id]";
            } else if (
                item.x.startsWith("/author/") &&
                item.x.split("/").length === 3
            ) {
                transformedX = "/author/[id]";
            }
            map.set(transformedX, (map.get(transformedX) || 0) + item.y);
        }
        return Array.from(map.entries())
            .map(([x, y]) => ({ x, y }))
            .sort((a, b) => b.y - a.y);
    };

    const fetchData = useCallback(
        async (currentTimeframe: string, currentOffset: number) => {
            try {
                setError(null);

                const [statsRes, pageviewsRes, metricsRes] = await Promise.all([
                    fetch(
                        `/api/umami/stats?timeframe=${currentTimeframe}&offset=${currentOffset}`
                    ),
                    fetch(
                        `/api/umami/pageviews?timeframe=${currentTimeframe}&offset=${currentOffset}`
                    ),
                    fetch(
                        `/api/umami/metrics?timeframe=${currentTimeframe}&type=url&offset=${currentOffset}`
                    ),
                ]);

                if (statsRes.ok) setStats(await statsRes.json());
                if (pageviewsRes.ok)
                    setPageviewsData(await pageviewsRes.json());
                if (metricsRes.ok) {
                    const rawData = await metricsRes.json();
                    setOriginalMetricsData(rawData);
                    const transformed = transformMetricsData(rawData);
                    setMetricsData(transformed);
                }
            } catch {
                setError(
                    "Failed to load analytics data. Please try again later."
                );
            }
        },
        []
    );

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
        fetchData(timeframe, offset);
    }, [timeframe, offset, fetchData]);

    useEffect(() => {
        const { endAt: currentEnd, startAt: currentStart } = getTimeRange(
            timeframe,
            offset
        );
        const shiftDays = (currentEnd - currentStart) / (24 * 60 * 60 * 1000);
        const potentialNewEnd = getTimeRange(
            timeframe,
            offset + shiftDays
        ).endAt;
        setCanShiftRight(potentialNewEnd <= Date.now());
    }, [timeframe, offset]);

    useEffect(() => {
        if (stats) {
            // Animate stats values
            if (stats.pageviews?.value)
                animateNumber(stats.pageviews.value, setAnimatedPageviews);
            if (stats.visitors?.value)
                animateNumber(stats.visitors.value, setAnimatedVisitors);
            if (stats.visits?.value)
                animateNumber(stats.visits.value, setAnimatedVisits);
            if (stats.bounces?.value)
                animateNumber(stats.bounces.value, setAnimatedBounces);

            // Calculate and animate % changes, default to 0% if no prev or prev is 0
            let percent = 0;
            if (stats.pageviews?.prev && stats.pageviews.prev !== 0) {
                percent =
                    ((stats.pageviews.value - stats.pageviews.prev) /
                        stats.pageviews.prev) *
                    100;
            }
            setPageviewsPercent(percent);
            animateNumber(percent, setAnimatedPageviewsPercent);

            percent = 0;
            if (stats.visitors?.prev && stats.visitors.prev !== 0) {
                percent =
                    ((stats.visitors.value - stats.visitors.prev) /
                        stats.visitors.prev) *
                    100;
            }
            setVisitorsPercent(percent);
            animateNumber(percent, setAnimatedVisitorsPercent);

            percent = 0;
            if (stats.visits?.prev && stats.visits.prev !== 0) {
                percent =
                    ((stats.visits.value - stats.visits.prev) /
                        stats.visits.prev) *
                    100;
            }
            setVisitsPercent(percent);
            animateNumber(percent, setAnimatedVisitsPercent);

            percent = 0;
            if (stats.bounces?.prev && stats.bounces.prev !== 0) {
                percent =
                    ((stats.bounces.value - stats.bounces.prev) /
                        stats.bounces.prev) *
                    100;
            }
            setBouncesPercent(percent);
            animateNumber(percent, setAnimatedBouncesPercent);
        }
    }, [stats]);

    useEffect(() => {
        if (pageviewsData) {
            const formatted = pageviewsData.map((item) => ({
                formattedDate:
                    currentUnit === "hour"
                        ? new Date(item.x).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: false,
                          })
                        : currentUnit === "month"
                        ? new Date(item.x).toLocaleDateString("en-US", {
                              month: "short",
                          })
                        : new Date(item.x).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                          }),
                Views: item.y,
            }));
            setChartData(formatted);
        }
    }, [pageviewsData, currentUnit]);

    useEffect(() => {
        fetchRealtime();
        const interval = setInterval(fetchRealtime, 120000);
        return () => clearInterval(interval);
    }, []);

    const resetDataAndUpdateChart = (
        currentTimeframe: string,
        currentOffset: number,
        currentUnit: unit
    ) => {
        // Reset data to show placeholders
        setStats(undefined);
        setPageviewsData(undefined);
        setMetricsData(undefined);
        setOriginalMetricsData(undefined);
        // Reset animated values
        setAnimatedPageviews(0);
        setAnimatedVisitors(0);
        setAnimatedVisits(0);
        setAnimatedBounces(0);
        setAnimatedPageviewsPercent(0);
        setAnimatedVisitorsPercent(0);
        setAnimatedVisitsPercent(0);
        setAnimatedBouncesPercent(0);
        // Reset final percentages
        setPageviewsPercent(0);
        setVisitorsPercent(0);
        setVisitsPercent(0);
        setBouncesPercent(0);
        // Update placeholder chart data
        const placeholder = generatePlaceholderDataUTC(
            currentTimeframe,
            currentOffset
        );
        setChartData(
            placeholder.map((item) => ({
                formattedDate:
                    currentUnit === "hour"
                        ? new Date(item.x).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: false,
                          })
                        : currentUnit === "month"
                        ? new Date(item.x).toLocaleDateString("en-US", {
                              month: "short",
                          })
                        : new Date(item.x).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                          }),
                Views: item.y,
            }))
        );
    };

    const handleTimeframeChange = (newTimeframe: string, newDays: number) => {
        setTimeframe(newTimeframe);
        setDays(newDays);
        setOffset(0);
        const newUnit = getTimeRange(newTimeframe).unit;
        setCurrentUnit(newUnit);
        resetDataAndUpdateChart(newTimeframe, 0, newUnit);
    };

    const shiftTimeframe = (direction: "left" | "right") => {
        const { endAt: currentEnd, startAt: currentStart } = getTimeRange(
            timeframe,
            offset
        );
        const shiftDays = (currentEnd - currentStart) / (24 * 60 * 60 * 1000);
        const newOffset = Math.floor(
            offset + (direction === "left" ? -shiftDays : shiftDays)
        );
        const { endAt: newEnd } = getTimeRange(timeframe, newOffset);

        // Prevent shifting into the future (safety check, though button is disabled)
        if (direction === "right" && newEnd > Date.now()) {
            return;
        }

        setOffset(newOffset);
        const newUnit = getTimeRange(timeframe, newOffset).unit;
        setCurrentUnit(newUnit);
        resetDataAndUpdateChart(timeframe, newOffset, newUnit);
    };

    const getDisplayText = (
        currentTimeframe: string,
        currentDays: number,
        currentOffset: number
    ) => {
        if (currentOffset === 0) {
            if (currentTimeframe === "1d") return "Last 24 Hours";
            if (currentTimeframe === "this-week") return "Last week";
            if (currentTimeframe === "this-month") return "Last month";
            if (currentTimeframe === "12m") return "Last 12 Months";
            if (currentTimeframe === "this-year") return "This Year";
            return `Last ${currentDays} Days`;
        } else {
            const { startAt, endAt } = getTimeRange(
                currentTimeframe,
                currentOffset
            );
            const startDate = new Date(startAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
            });
            const endDate = new Date(endAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
            });
            return `From ${startDate} to ${endDate}`;
        }
    };

    const [originalRoutesMap, setOriginalRoutesMap] = useState<
        Map<string, PageviewData[]>
    >(new Map());

    useEffect(() => {
        if (originalMetricsData) {
            const map = new Map<string, PageviewData[]>();
            const transformedKeys = [
                "/manga/[id]",
                "/manga/[id]/[subId]",
                "/genre/[id]",
                "/author/[id]",
            ];

            for (const key of transformedKeys) {
                const filtered = originalMetricsData
                    .filter((item) => {
                        if (key === "/manga/[id]") {
                            return (
                                item.x.startsWith("/manga/") &&
                                item.x.split("/").length === 3
                            );
                        } else if (key === "/manga/[id]/[subId]") {
                            return (
                                item.x.startsWith("/manga/") &&
                                item.x.includes("/chapter-")
                            );
                        } else if (key === "/genre/[id]") {
                            return (
                                item.x.startsWith("/genre/") &&
                                item.x.split("/").length === 3
                            );
                        } else if (key === "/author/[id]") {
                            return (
                                item.x.startsWith("/author/") &&
                                item.x.split("/").length === 3
                            );
                        }
                        return false;
                    })
                    .sort((a, b) => b.y - a.y);
                map.set(key, filtered);
            }
            setOriginalRoutesMap(map);
        }
    }, [originalMetricsData]);

    const getOriginalRoutes = useCallback(
        (transformedKey: string): PageviewData[] => {
            return originalRoutesMap.get(transformedKey) || [];
        },
        [originalRoutesMap]
    );

    const isTransformedRoute = (route: string): boolean => {
        return (
            route === "/manga/[id]" ||
            route === "/manga/[id]/[subId]" ||
            route === "/genre/[id]" ||
            route === "/author/[id]"
        );
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
        <Card className="gap-4 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <CardTitle>
                        Analytics ({getDisplayText(timeframe, days, offset)})
                    </CardTitle>
                    <Badge variant="secondary">{realtimeVisitors} Online</Badge>
                </div>
                <TimeframeSelector
                    onTimeframeChange={handleTimeframeChange}
                    currentTimeframe={timeframe}
                    onShift={shiftTimeframe}
                    canShiftRight={canShiftRight}
                />
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                    <div className="text-center p-6 border rounded-lg bg-card">
                        <h3 className="text-3xl font-bold mb-2">
                            {Math.round(animatedPageviews)}
                        </h3>
                        <p className="text-sm text-muted-foreground">Views</p>
                        <p
                            className={`text-xs ${
                                pageviewsPercent > 0
                                    ? "text-positive"
                                    : pageviewsPercent < 0
                                    ? "text-negative"
                                    : "text-muted-foreground"
                            }`}
                        >
                            {pageviewsPercent > 0 ? "+" : ""}
                            {animatedPageviewsPercent.toFixed(1)}%
                        </p>
                    </div>
                    <div className="text-center p-6 border rounded-lg bg-card">
                        <h3 className="text-3xl font-bold mb-2">
                            {Math.round(animatedVisitors)}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Visitors
                        </p>
                        <p
                            className={`text-xs ${
                                visitorsPercent > 0
                                    ? "text-positive"
                                    : visitorsPercent < 0
                                    ? "text-negative"
                                    : "text-muted-foreground"
                            }`}
                        >
                            {visitorsPercent > 0 ? "+" : ""}
                            {animatedVisitorsPercent.toFixed(1)}%
                        </p>
                    </div>
                    <div className="text-center p-6 border rounded-lg bg-card">
                        <h3 className="text-3xl font-bold mb-2">
                            {Math.round(animatedVisits)}
                        </h3>
                        <p className="text-sm text-muted-foreground">Visits</p>
                        <p
                            className={`text-xs ${
                                visitsPercent > 0
                                    ? "text-positive"
                                    : visitsPercent < 0
                                    ? "text-negative"
                                    : "text-muted-foreground"
                            }`}
                        >
                            {visitsPercent > 0 ? "+" : ""}
                            {animatedVisitsPercent.toFixed(1)}%
                        </p>
                    </div>
                    <div className="text-center p-6 border rounded-lg bg-card">
                        <h3 className="text-3xl font-bold mb-2">
                            {Math.round(animatedBounces)}
                        </h3>
                        <p className="text-sm text-muted-foreground">Bounces</p>
                        <p
                            className={`text-xs ${
                                bouncesPercent > 0
                                    ? "text-negative"
                                    : bouncesPercent < 0
                                    ? "text-positive"
                                    : "text-muted-foreground"
                            }`}
                        >
                            {bouncesPercent > 0 ? "+" : ""}
                            {animatedBouncesPercent.toFixed(1)}%
                        </p>
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 w-full">
                        <PageviewsChart data={chartData} />
                    </div>
                    <Routes
                        metricsData={metricsData}
                        getOriginalRoutes={getOriginalRoutes}
                        isTransformedRoute={isTransformedRoute}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
