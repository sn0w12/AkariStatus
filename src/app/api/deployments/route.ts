import { NextResponse } from "next/server";
import { generateCacheHeaders } from "@/lib/cache";
import supabase from "@/lib/supabase";
import cacheWrapper from "@/lib/node-cache-wrapper";

export async function GET() {
    const cacheTime = 60 * 5; // 5 minutes
    const headers = generateCacheHeaders(cacheTime);
    const cacheKey = "deployments";
    const cachedData = cacheWrapper.get(cacheKey);
    if (cachedData) {
        return NextResponse.json(cachedData, { headers });
    }

    try {
        const { data, error } = await supabase
            .from("deployments")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            throw new Error("Failed to fetch deployments");
        }

        cacheWrapper.set(cacheKey, data, cacheTime);
        return NextResponse.json(data, { headers });
    } catch (error) {
        console.error("Error fetching deployments:", error);
        return NextResponse.json(
            { error: "Failed to fetch deployments" },
            { status: 500 }
        );
    }
}
