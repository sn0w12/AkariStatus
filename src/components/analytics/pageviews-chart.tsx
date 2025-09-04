"use client";

import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";

interface PageviewsChartProps {
    data: { formattedDate: string; Views: number }[];
}

export function PageviewsChart({ data }: PageviewsChartProps) {
    return (
        <div className="w-full">
            <h4 className="text-lg font-semibold">Views Over Time</h4>
            <ChartContainer
                config={{
                    pageviews: {
                        label: "Pageviews",
                        color: "hsl(var(--positive))",
                    },
                }}
                className="h-[400px] w-full"
            >
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} accessibilityLayer>
                        <XAxis
                            dataKey="formattedDate"
                            tick={{ fontSize: 12 }}
                            interval="preserveStartEnd"
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="Views" fill="var(--color-primary)" />
                    </BarChart>
                </ResponsiveContainer>
            </ChartContainer>
        </div>
    );
}
