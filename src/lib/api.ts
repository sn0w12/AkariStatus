export interface Monitor {
    id: number;
    friendly_name: string;
    url: string;
    status: number;
    all_time_uptime_ratio: string;
    average_response_time?: string;
    response_times?: Array<{
        datetime: number;
        value: number;
    }>;
    logs?: Array<{
        id: number;
        type: number;
        datetime: number;
        duration?: number;
        reason?: {
            code: string;
            detail: string;
        };
    }>;
    custom_uptime_ratio?: string;
    custom_down_durations?: string;
}

export interface UmamiStats {
    pageviews: { value: number; prev?: number };
    visitors: { value: number; prev?: number };
    visits: { value: number; prev?: number };
    bounces: { value: number; prev?: number };
}

export type Graph = { x: string; y: number }[];

export interface PageviewData {
    pageviews: Graph;
    sessions: Graph;
}

export type unit = "hour" | "day" | "week" | "month";

export type MetricsType =
    | "url"
    | "referrer"
    | "browser"
    | "os"
    | "device"
    | "country"
    | "event";

export interface RuntimeStats {
    id: string;
    pm2_name: string;
    cpu: number | null;
    memory: number | null;
    uptime: number | null;
    status:
        | "online"
        | "stopped"
        | "stopping"
        | "waiting restart"
        | "launching"
        | "errored"
        | "one-launch-status"
        | null;
    created_at: string | null;
}

export interface Deployment {
    id: string;
    repo_url: string;
    branch: string;
    pm2_name: string;
    port: string;
    commit_hash: string | null;
    start_time: string | null;
    end_time: string | null;
    duration_ms: number | null;
    status: "started" | "superseded" | "completed" | "failed";
    active: boolean;
    success: boolean | null;
    error_message: string | null;
    created_at: string | null;
    last_updated: string | null;
}

export type MetricsData = { x: string; y: number };

async function getUmamiWebsites() {
    const response = await fetch("https://api.umami.is/v1/websites", {
        headers: {
            "x-umami-api-key": `${process.env.UMAMI_API_KEY}`,
        },
    });
    if (!response.ok) {
        throw new Error("Failed to fetch Umami websites");
    }
    return response.json();
}

async function getUmamiStats(
    websiteId: string,
    startAt: number,
    endAt: number
): Promise<UmamiStats> {
    const response = await fetch(
        `https://api.umami.is/v1/websites/${websiteId}/stats?startAt=${startAt}&endAt=${endAt}`,
        {
            headers: {
                "x-umami-api-key": `${process.env.UMAMI_API_KEY}`,
            },
        }
    );
    if (!response.ok) {
        throw new Error("Failed to fetch Umami stats");
    }
    return response.json();
}

async function getUmamiPageviewsSeries(
    websiteId: string,
    startAt: number,
    endAt: number,
    unit: string
): Promise<PageviewData> {
    const response = await fetch(
        `https://api.umami.is/v1/websites/${websiteId}/pageviews?startAt=${startAt}&endAt=${endAt}&unit=${unit}&timezone=Etc/UTC`,
        {
            headers: {
                "x-umami-api-key": `${process.env.UMAMI_API_KEY}`,
            },
        }
    );
    if (!response.ok) {
        throw new Error(
            "Failed to fetch Umami pageviews series" + response.statusText
        );
    }
    const data = await response.json();
    return data || { pageviews: [], sessions: [] };
}

async function getUmamiRealtimeVisitors(
    websiteId: string
): Promise<{ visitors: number }> {
    const response = await fetch(
        `https://api.umami.is/v1/websites/${websiteId}/active`,
        {
            headers: {
                "x-umami-api-key": `${process.env.UMAMI_API_KEY}`,
            },
        }
    );
    if (!response.ok) {
        throw new Error("Failed to fetch realtime visitors");
    }
    return response.json();
}

async function getUptimeMonitor(monitorId: string): Promise<Monitor> {
    const response = await fetch("https://api.uptimerobot.com/v2/getMonitors", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            api_key: process.env.UPTIME_ROBOT_API_KEY!,
            monitors: monitorId,
            format: "json",
            response_times: "1",
            response_times_limit: "10",
            logs: "1",
            logs_limit: "5",
            custom_uptime_ratios: "7-30",
            all_time_uptime_ratio: "1",
        }),
    });
    if (!response.ok) {
        throw new Error("Failed to fetch UptimeRobot monitor");
    }
    const data = await response.json();
    return data.monitors[0];
}

async function getUmamiMetricsSeries(
    websiteId: string,
    startAt: number,
    endAt: number,
    unit: string,
    type: MetricsType
): Promise<MetricsData[]> {
    const response = await fetch(
        `https://api.umami.is/v1/websites/${websiteId}/metrics?startAt=${startAt}&endAt=${endAt}&unit=${unit}&type=${type}&timezone=Etc/UTC&limit=999999`,
        {
            headers: {
                "x-umami-api-key": `${process.env.UMAMI_API_KEY}`,
            },
        }
    );
    if (!response.ok) {
        throw new Error(
            "Failed to fetch Umami metrics series" + response.statusText
        );
    }
    return await response.json();
}

function getTimeRange(
    timeframe: string,
    offset: number = 0
): {
    startAt: number;
    endAt: number;
    unit: unit;
} {
    const now = new Date();
    let startAt: number;
    let endAt: number;
    let unit: unit;

    switch (timeframe) {
        case "1d":
            startAt = now.getTime() - 1 * 24 * 60 * 60 * 1000;
            endAt = now.getTime();
            unit = "hour";
            break;
        case "this-week":
            const dayOfWeek = now.getUTCDay();
            const startOfWeekUTC = new Date(now);
            let diff = dayOfWeek - 1;
            if (diff < 0) diff += 7;
            startOfWeekUTC.setUTCDate(now.getUTCDate() - diff);
            startOfWeekUTC.setUTCHours(0, 0, 0, 0);
            const endOfWeekUTC = new Date(startOfWeekUTC);
            endOfWeekUTC.setUTCDate(startOfWeekUTC.getUTCDate() + 6);
            endOfWeekUTC.setUTCHours(0, 0, 0, 0);
            startAt = startOfWeekUTC.getTime();
            endAt = endOfWeekUTC.getTime();
            unit = "day";
            break;
        case "7d":
            startAt = now.getTime() - 6.5 * 24 * 60 * 60 * 1000;
            endAt = now.getTime();
            unit = "day";
            break;
        case "this-month":
            const shiftedDateMonth = new Date(now);
            shiftedDateMonth.setUTCMonth(
                shiftedDateMonth.getUTCMonth() + offset
            );
            const startOfMonthUTC = new Date(shiftedDateMonth);
            startOfMonthUTC.setUTCDate(1);
            startOfMonthUTC.setUTCHours(0, 0, 0, 0);
            const endOfMonthUTC = new Date(
                startOfMonthUTC.getUTCFullYear(),
                startOfMonthUTC.getUTCMonth() + 1,
                1
            );
            endOfMonthUTC.setUTCHours(0, 0, 0, 0);
            startAt = startOfMonthUTC.getTime();
            endAt = endOfMonthUTC.getTime();
            unit = "day";
            break;
        case "30d":
            startAt = now.getTime() - 29.5 * 24 * 60 * 60 * 1000;
            endAt = now.getTime();
            unit = "day";
            break;
        case "90d":
            startAt = now.getTime() - 89.5 * 24 * 60 * 60 * 1000;
            endAt = now.getTime();
            unit = "day";
            break;
        case "12m":
            startAt = now.getTime() - 365 * 24 * 60 * 60 * 1000;
            endAt = now.getTime();
            unit = "month";
            break;
        case "this-year":
            const shiftedDateYear = new Date(now);
            shiftedDateYear.setUTCFullYear(
                shiftedDateYear.getUTCFullYear() + offset
            );
            const startOfYear = new Date(
                shiftedDateYear.getUTCFullYear(),
                0,
                1
            );
            const endOfCurrentMonth = new Date(
                shiftedDateYear.getUTCFullYear(),
                shiftedDateYear.getUTCMonth() + 1,
                1
            );
            startAt = startOfYear.getTime();
            endAt = endOfCurrentMonth.getTime();
            unit = "month";
            break;
        default:
            startAt = now.getTime() - 29.5 * 24 * 60 * 60 * 1000;
            endAt = now.getTime();
            unit = "day";
            break;
    }

    // Apply offset shift (in days) only for non-fixed timeframes
    if (timeframe !== "this-month" && timeframe !== "this-year") {
        const shiftMs = offset * 24 * 60 * 60 * 1000;
        startAt += shiftMs;
        endAt += shiftMs;
    }

    // Recalculate unit based on shifted range (only for non-fixed timeframes)
    if (timeframe !== "this-month" && timeframe !== "this-year") {
        const diffDays = (endAt - startAt) / (24 * 60 * 60 * 1000);
        if (diffDays <= 2) unit = "hour";
        else if (diffDays <= 90) unit = "day";
        else unit = "month";
    }

    return { startAt, endAt, unit };
}

export {
    getUmamiWebsites,
    getUmamiStats,
    getUmamiPageviewsSeries,
    getUmamiRealtimeVisitors,
    getUptimeMonitor,
    getUmamiMetricsSeries,
    getTimeRange,
};
