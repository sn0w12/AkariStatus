import { NextRequest, NextResponse } from "next/server";
import { getTimeRange, getUmamiPageviewsSeries } from "@/lib/api";
import { generateCacheHeaders, getCacheTimeForTimeframe } from "@/lib/cache";

function padPageviewsData(
    data: { x: string; y: number }[],
    startAt: number,
    endAt: number
): { x: string; y: number }[] {
    const padded: { x: string; y: number }[] = [];
    const existingMap = new Map(data.map((d) => [d.x, d.y]));
    const startDate = new Date(startAt);
    const endDate = new Date(endAt);
    for (
        let d = new Date(startDate);
        d <= endDate;
        d.setDate(d.getDate() + 1)
    ) {
        const x = d
            .toISOString()
            .replace(/T\d{2}:\d{2}:\d{2}\.\d{3}Z/, "T00:00:00Z");
        const y = existingMap.get(x) || 0;
        padded.push({ x, y });
    }
    return padded;
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get("timeframe") || "30d";
    const offset = parseInt(searchParams.get("offset") || "0");

    const websiteId = process.env.UMAMI_WEBSITE_ID;
    if (!websiteId) {
        return NextResponse.json(
            { error: "Website ID not configured" },
            { status: 500 }
        );
    }

    try {
        const { startAt, endAt, unit } = getTimeRange(timeframe, offset);
        const pageviewsData = await getUmamiPageviewsSeries(
            websiteId,
            startAt,
            endAt,
            unit
        );

        const cacheTime = getCacheTimeForTimeframe(timeframe);
        const headers = generateCacheHeaders(cacheTime);
        if (timeframe === "this-week" || timeframe === "this-month") {
            const paddedData = padPageviewsData(pageviewsData, startAt, endAt);
            return NextResponse.json(paddedData, { headers });
        }
        return NextResponse.json(pageviewsData, { headers });
    } catch (error) {
        console.error("Error fetching Umami pageviews:", error);
        return NextResponse.json(
            { error: "Failed to fetch pageviews data" },
            { status: 500 }
        );
    }
}
