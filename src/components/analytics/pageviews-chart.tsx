"use client";

import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";

interface PageviewsChartProps {
    data: { formattedDate: string; Views: number; Sessions: number }[];
}

export function PageviewsChart({ data }: PageviewsChartProps) {
    return (
        <div className="w-full">
            <h4 className="text-lg font-semibold">Views Over Time</h4>
            <ChartContainer
                config={{
                    Views: {
                        label: "Views",
                        color: "var(--positive)",
                    },
                    Sessions: {
                        label: "Sessions",
                        color: "var(--primary)",
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
                        <Bar
                            dataKey="Sessions"
                            stackId="a"
                            fill="var(--color-positive)"
                        />
                        <Bar
                            dataKey="Views"
                            stackId="a"
                            fill="var(--color-primary)"
                        />
                    </BarChart>
                </ResponsiveContainer>
            </ChartContainer>
        </div>
    );
}
