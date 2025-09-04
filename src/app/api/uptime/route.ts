import { NextResponse } from "next/server";
import { getUptimeMonitor } from "@/lib/api";
import { generateCacheHeaders } from "@/lib/cache";

export async function GET() {
    const id = process.env.UPTIME_ROBOT_ID;
    if (!id) {
        return NextResponse.json(
            { error: "UPTIME_ROBOT_ID is not defined" },
            { status: 500 }
        );
    }

    try {
        const monitor = await getUptimeMonitor(id);
        const headers = generateCacheHeaders(60 * 5);
        return NextResponse.json(monitor, { headers });
    } catch (error) {
        console.error("Error fetching uptime monitor:", error);
        return NextResponse.json(
            { error: "Failed to fetch uptime data" },
            { status: 500 }
        );
    }
}
