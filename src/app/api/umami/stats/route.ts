import { NextRequest, NextResponse } from "next/server";
import { getTimeRange, getUmamiStats } from "@/lib/api";
import { generateCacheHeaders, getCacheTimeForTimeframe } from "@/lib/cache";

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
        const { startAt, endAt } = getTimeRange(timeframe, offset);
        const stats = await getUmamiStats(websiteId, startAt, endAt);
        const cacheTime = getCacheTimeForTimeframe(timeframe);
        const headers = generateCacheHeaders(cacheTime);
        return NextResponse.json(stats, { headers });
    } catch (error) {
        console.error("Error fetching Umami stats:", error);
        return NextResponse.json(
            { error: "Failed to fetch analytics data" },
            { status: 500 }
        );
    }
}
