import { NextRequest, NextResponse } from "next/server";
import { getTimeRange, getUmamiPageviewsSeries } from "@/lib/api";
import { generateCacheHeaders, getCacheTimeForTimeframe } from "@/lib/cache";

function padPageviewsData(
    data: { x: string; y: number }[],
    startAt: number,
    endAt: number,
    unit: string
): { x: string; y: number }[] {
    const padded: { x: string; y: number }[] = [];
    const existingMap = new Map(data.map((d) => [d.x, d.y]));
    const d = new Date(startAt);
    if (unit === "hour") {
        d.setMinutes(0, 0, 0);
    }
    const endDate = new Date(endAt);

    while (d <= endDate) {
        let x: string;
        if (unit === "hour") {
            x = d.toISOString().replace(/\.\d{3}Z$/, "Z");
        } else if (unit === "day") {
            x = d
                .toISOString()
                .replace(/T\d{2}:\d{2}:\d{2}\.\d{3}Z$/, "T00:00:00Z");
        } else if (unit === "month") {
            x = d
                .toISOString()
                .replace(/-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/, "-01T00:00:00Z");
        } else {
            // default to day
            x = d
                .toISOString()
                .replace(/T\d{2}:\d{2}:\d{2}\.\d{3}Z$/, "T00:00:00Z");
        }
        const y = existingMap.get(x) || 0;
        padded.push({ x, y });
        if (unit === "hour") {
            d.setHours(d.getHours() + 1);
        } else if (unit === "day") {
            d.setDate(d.getDate() + 1);
        } else if (unit === "month") {
            d.setMonth(d.getMonth() + 1);
        } else {
            d.setDate(d.getDate() + 1);
        }
    }

    if (
        (unit === "month" && padded.length > 0) ||
        (unit === "hour" && padded.length > 0)
    ) {
        const firstDate = new Date(padded[0].x);
        if (firstDate < new Date(startAt)) {
            padded.shift();
        }
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
        const paddedData = padPageviewsData(
            pageviewsData,
            startAt,
            endAt,
            unit
        );

        return NextResponse.json(paddedData, { headers });
    } catch (error) {
        console.error("Error fetching Umami pageviews:", error);
        return NextResponse.json(
            { error: "Failed to fetch pageviews data" },
            { status: 500 }
        );
    }
}
