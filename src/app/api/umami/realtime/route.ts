import { NextResponse } from "next/server";
import { generateCacheHeaders } from "@/lib/cache";
import { getUmamiRealtimeVisitors } from "@/lib/api";

export async function GET() {
    const websiteId = process.env.UMAMI_WEBSITE_ID;
    if (!websiteId) {
        return NextResponse.json(
            { error: "Website ID not configured" },
            { status: 500 }
        );
    }

    try {
        const data = await getUmamiRealtimeVisitors(websiteId);
        const headers = generateCacheHeaders(60);
        return NextResponse.json(data, { headers });
    } catch (error) {
        console.error("Error fetching realtime visitors:", error);
        return NextResponse.json(
            { error: "Failed to fetch realtime data" },
            { status: 500 }
        );
    }
}
