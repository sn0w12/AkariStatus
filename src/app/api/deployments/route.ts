import { NextResponse } from "next/server";
import { generateCacheHeaders } from "@/lib/cache";
import supabase from "@/lib/supabase";
import cacheWrapper from "@/lib/node-cache-wrapper";

export async function GET(request: Request) {
    const cacheTime = 60 * 5; // 5 minutes
    const headers = generateCacheHeaders(cacheTime);

    // Parse query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);
    const offset = (page - 1) * limit;

    const cacheKey = `deployments_${page}_${limit}`;
    const cachedData = cacheWrapper.get(cacheKey);
    if (cachedData) {
        return NextResponse.json(cachedData, { headers });
    }

    try {
        // Fetch total count
        const { count, error: countError } = await supabase
            .from("deployments")
            .select("*", { count: "exact", head: true });

        if (countError) {
            throw new Error("Failed to fetch deployment count");
        }

        // Fetch paginated data
        const { data, error } = await supabase
            .from("deployments")
            .select("*")
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            throw new Error("Failed to fetch deployments");
        }

        const totalPages = Math.ceil((count || 0) / limit);
        const responseData = {
            data,
            pagination: {
                page,
                limit,
                total: count,
                totalPages,
            },
        };

        cacheWrapper.set(cacheKey, responseData, cacheTime);
        return NextResponse.json(responseData, { headers });
    } catch (error) {
        console.error("Error fetching deployments:", error);
        return NextResponse.json(
            { error: "Failed to fetch deployments" },
            { status: 500 }
        );
    }
}
