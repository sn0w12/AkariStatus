import { NextResponse } from "next/server";
import { generateCacheHeaders } from "@/lib/cache";
import { getUmamiRealtimeVisitors } from "@/lib/api";
import cacheWrapper from "@/lib/node-cache-wrapper";

export async function GET() {
    const cacheTime = 60;
    const headers = generateCacheHeaders(cacheTime);
    const cacheKey = "realtime";
    const cachedData = cacheWrapper.get(cacheKey);
    if (cachedData) {
        return NextResponse.json(cachedData, { headers });
    }

    const websiteId = process.env.UMAMI_WEBSITE_ID;
    if (!websiteId) {
        return NextResponse.json(
            { error: "Website ID not configured" },
            { status: 500 }
        );
    }

    try {
        const data = await getUmamiRealtimeVisitors(websiteId);
        cacheWrapper.set(cacheKey, data, cacheTime);
        return NextResponse.json(data, { headers });
    } catch (error) {
        console.error("Error fetching realtime visitors:", error);
        return NextResponse.json(
            { error: "Failed to fetch realtime data" },
            { status: 500 }
        );
    }
}
