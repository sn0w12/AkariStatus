import { NextRequest, NextResponse } from "next/server";
import { getTimeRange, getUmamiMetricsSeries, MetricsType } from "@/lib/api";
import { generateCacheHeaders, getCacheTimeForTimeframe } from "@/lib/cache";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get("timeframe") || "30d";
    const offset = parseInt(searchParams.get("offset") || "0");
    const type = searchParams.get("type") as MetricsType;

    if (
        !type ||
        ![
            "url",
            "referrer",
            "browser",
            "os",
            "device",
            "country",
            "event",
        ].includes(type)
    ) {
        return NextResponse.json(
            { error: "Invalid or missing 'type' parameter" },
            { status: 400 }
        );
    }

    const websiteId = process.env.UMAMI_WEBSITE_ID;
    if (!websiteId) {
        return NextResponse.json(
            { error: "Website ID not configured" },
            { status: 500 }
        );
    }

    try {
        const { startAt, endAt, unit } = getTimeRange(timeframe, offset);
        const metricsData = await getUmamiMetricsSeries(
            websiteId,
            startAt,
            endAt,
            unit,
            type
        );

        const cacheTime = getCacheTimeForTimeframe(timeframe);
        const headers = generateCacheHeaders(cacheTime);
        return NextResponse.json(metricsData, { headers });
    } catch (error) {
        console.error("Error fetching Umami metrics:", error);
        return NextResponse.json(
            { error: "Failed to fetch metrics data" },
            { status: 500 }
        );
    }
}
