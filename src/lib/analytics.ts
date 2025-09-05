import { MetricsData, unit } from "@/lib/api";

export function getTimeRangeClient(timeframe: string, offset: number) {
    const now = Date.now();
    const nowDate = new Date(now);
    let startAt: number;
    let endAt: number;
    let unit: unit;

    if (timeframe === "this-month") {
        const shiftedDate = new Date(now);
        shiftedDate.setUTCMonth(shiftedDate.getUTCMonth() + offset);
        const startOfMonth = new Date(
            Date.UTC(
                shiftedDate.getUTCFullYear(),
                shiftedDate.getUTCMonth(),
                1,
                0,
                0,
                0,
                0
            )
        );
        const endOfMonth = new Date(
            Date.UTC(
                shiftedDate.getUTCFullYear(),
                shiftedDate.getUTCMonth() + 1,
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
    } else if (timeframe === "this-year") {
        const shiftedDate = new Date(now);
        shiftedDate.setUTCFullYear(shiftedDate.getUTCFullYear() + offset);
        const startOfYear = new Date(
            Date.UTC(shiftedDate.getUTCFullYear(), 0, 1, 0, 0, 0, 0)
        );
        const endOfCurrentMonth = new Date(
            Date.UTC(
                shiftedDate.getUTCFullYear(),
                shiftedDate.getUTCMonth() + 1,
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
    } else {
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
    }

    return { startAt, endAt, unit };
}

export function generatePlaceholderDataUTC(
    timeframe: string,
    offset: number
): { x: number; y: number }[] {
    const { startAt, endAt, unit } = getTimeRangeClient(timeframe, offset);

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
}

export function formatDate(date: string, unit: unit): string {
    return unit === "hour"
        ? new Date(date).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: false,
          })
        : unit === "month"
        ? new Date(date).toLocaleDateString("en-US", {
              month: "short",
          })
        : new Date(date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
          });
}

export const routeTransformations = [
    {
        key: "/manga/[id]",
        condition: (x: string) =>
            x.startsWith("/manga/") && x.split("/").length === 3,
    },
    {
        key: "/manga/[id]/[subId]",
        condition: (x: string) =>
            x.startsWith("/manga/") && x.includes("/chapter-"),
    },
    {
        key: "/genre/[id]",
        condition: (x: string) =>
            x.startsWith("/genre/") && x.split("/").length === 3,
    },
    {
        key: "/author/[id]",
        condition: (x: string) =>
            x.startsWith("/author/") && x.split("/").length === 3,
    },
];

export const transformedRoutes = routeTransformations.map((t) => t.key);

export function getTransformedKey(x: string): string | null {
    for (const { key, condition } of routeTransformations) {
        if (condition(x)) return key;
    }
    return null;
}

export function transformMetricsData(data: MetricsData[]): MetricsData[] {
    const map = new Map<string, number>();
    for (const item of data) {
        const transformedX = getTransformedKey(item.x) || item.x;
        map.set(transformedX, (map.get(transformedX) || 0) + item.y);
    }
    return Array.from(map.entries())
        .map(([x, y]) => ({ x, y }))
        .sort((a, b) => b.y - a.y);
}

export function isTransformedRoute(route: string): boolean {
    return transformedRoutes.includes(route);
}
