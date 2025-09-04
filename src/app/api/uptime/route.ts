import { NextResponse } from "next/server";
import { getUptimeMonitor } from "@/lib/api";
import { generateCacheHeaders } from "@/lib/cache";
import cacheWrapper from "@/lib/node-cache-wrapper";

export async function GET() {
    const cacheTime = 60 * 5;
    const headers = generateCacheHeaders(cacheTime);
    const cacheKey = "uptime";
    const cachedData = cacheWrapper.get(cacheKey);
    if (cachedData) {
        return NextResponse.json(cachedData, { headers });
    }

    const id = process.env.UPTIME_ROBOT_ID;
    if (!id) {
        return NextResponse.json(
            { error: "UPTIME_ROBOT_ID is not defined" },
            { status: 500 }
        );
    }

    try {
        const monitor = await getUptimeMonitor(id);
        cacheWrapper.set(cacheKey, monitor, cacheTime);
        return NextResponse.json(monitor, { headers });
    } catch (error) {
        console.error("Error fetching uptime monitor:", error);
        return NextResponse.json(
            { error: "Failed to fetch uptime data" },
            { status: 500 }
        );
    }
}
