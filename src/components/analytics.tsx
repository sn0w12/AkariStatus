"use client";

import {
    UmamiStats,
    PageviewData,
    getTimeRange,
    unit,
    MetricsData,
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageviewsChart } from "@/components/analytics/pageviews-chart";
import { TimeframeSelector } from "@/components/analytics/timeframe-selector";
import { useState, useEffect, useCallback } from "react";
import { Routes } from "@/components/analytics/routes";
import { RealtimeVisitors } from "@/components/analytics/realtime";
import {
    formatDate,
    generatePlaceholderDataUTC,
    getTimeRangeClient,
    getTransformedKey,
    transformedRoutes,
    transformMetricsData,
} from "@/lib/analytics";
import { StatCard } from "./analytics/stat-card";
import { animateNumber } from "@/lib/utils";

export function Analytics() {
    const [timeframe, setTimeframe] = useState("30d");
    const [days, setDays] = useState(30);
    const [stats, setStats] = useState<UmamiStats | undefined>();
    const [pageviewsData, setPageviewsData] = useState<
        PageviewData | undefined
    >();
    const [metricsData, setMetricsData] = useState<MetricsData[] | undefined>();
    const [originalMetricsData, setOriginalMetricsData] = useState<
        MetricsData[] | undefined
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

    const [offset, setOffset] = useState<number>(0);
    const [currentUnit, setCurrentUnit] = useState<unit>(
        () => getTimeRange(timeframe).unit
    );
    const [canShiftRight, setCanShiftRight] = useState(true);

    const [chartData, setChartData] = useState(() => {
        const placeholder = generatePlaceholderDataUTC(timeframe, offset);
        const { unit } = getTimeRange(timeframe, offset);
        return placeholder.map((item) => ({
            formattedDate: formatDate(item.x.toString(), unit),
            Views: item.y,
            Sessions: 0,
        }));
    });

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

    useEffect(() => {
        fetchData(timeframe, offset);
    }, [timeframe, offset, fetchData]);

    useEffect(() => {
        let shiftAmount: number;
        if (timeframe === "this-month" || timeframe === "this-year") {
            shiftAmount = 1;
        } else {
            const { endAt: currentEnd, startAt: currentStart } =
                getTimeRangeClient(timeframe, offset);
            shiftAmount = Math.round(
                (currentEnd - currentStart) / (24 * 60 * 60 * 1000)
            );
        }
        const { startAt: potentialNewStart } = getTimeRangeClient(
            timeframe,
            offset + shiftAmount
        );
        setCanShiftRight(potentialNewStart <= Date.now());
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
            const formatted = pageviewsData.pageviews.map((item, index) => ({
                formattedDate: formatDate(item.x, currentUnit),
                Views: item.y,
                Sessions: pageviewsData.sessions[index]?.y || 0,
            }));
            setChartData(formatted);
        }
    }, [pageviewsData, currentUnit]);

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
                Sessions: 0, // Placeholder for sessions
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
        let shiftAmount: number;
        if (timeframe === "this-month" || timeframe === "this-year") {
            shiftAmount = 1;
        } else {
            const { endAt: currentEnd, startAt: currentStart } =
                getTimeRangeClient(timeframe, offset);
            shiftAmount = Math.round(
                (currentEnd - currentStart) / (24 * 60 * 60 * 1000)
            );
        }
        const newOffset = Math.round(
            offset + (direction === "left" ? -shiftAmount : shiftAmount)
        );
        const { startAt: newStart } = getTimeRangeClient(timeframe, newOffset);

        // Prevent shifting into the future
        if (direction === "right" && newStart > Date.now()) {
            return;
        }

        console.log(newOffset);
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
        Map<string, MetricsData[]>
    >(new Map());

    useEffect(() => {
        if (originalMetricsData) {
            const map = new Map<string, MetricsData[]>();
            for (const key of transformedRoutes) {
                const filtered = originalMetricsData
                    .filter((item) => {
                        return getTransformedKey(item.x) === key;
                    })
                    .sort((a, b) => b.y - a.y);
                map.set(key, filtered);
            }
            setOriginalRoutesMap(map);
        }
    }, [originalMetricsData]);

    const getOriginalRoutes = useCallback(
        (transformedKey: string): MetricsData[] => {
            return originalRoutesMap.get(transformedKey) || [];
        },
        [originalRoutesMap]
    );

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
                    <RealtimeVisitors />
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
                    <StatCard
                        title="Views"
                        value={animatedPageviews}
                        percent={pageviewsPercent}
                        animatedPercent={animatedPageviewsPercent}
                    />
                    <StatCard
                        title="Visitors"
                        value={animatedVisitors}
                        percent={visitorsPercent}
                        animatedPercent={animatedVisitorsPercent}
                    />
                    <StatCard
                        title="Visits"
                        value={animatedVisits}
                        percent={visitsPercent}
                        animatedPercent={animatedVisitsPercent}
                    />
                    <StatCard
                        title="Bounces"
                        value={animatedBounces}
                        percent={bouncesPercent}
                        animatedPercent={animatedBouncesPercent}
                        invertPercentColor={true}
                    />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 w-full">
                        <PageviewsChart data={chartData} />
                    </div>
                    <Routes
                        metricsData={metricsData}
                        getOriginalRoutes={getOriginalRoutes}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
