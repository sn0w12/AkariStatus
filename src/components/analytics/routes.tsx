"use client";

import { PageviewData } from "@/lib/api";
import { Separator } from "@/components/ui/separator";
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@/components/ui/popover";
import Link from "next/link";
import { List, type RowComponentProps } from "react-window";
import { JSX, useState } from "react";
import { Input } from "@/components/ui/input";
import { AlignJustify } from "lucide-react";

function truncateRoute(route: string, maxSegmentLength: number = 20): string {
    const parts = route.split("/");
    const truncatedParts = parts.map((part) => {
        if (part.length > maxSegmentLength) {
            return part.substring(0, maxSegmentLength) + "...";
        }
        return part;
    });
    return truncatedParts.join("/");
}

interface RoutesProps {
    metricsData: PageviewData[] | undefined;
    getOriginalRoutes: (transformedKey: string) => PageviewData[];
    isTransformedRoute: (route: string) => boolean;
}

function RowComponent({
    index,
    style,
    originalRoutes,
}: RowComponentProps<{
    originalRoutes: PageviewData[];
}>) {
    const route = originalRoutes[index];
    return (
        <div style={style} key={index}>
            <Link
                href={process.env.NEXT_PUBLIC_BASE_URL + route.x}
                className="flex justify-between text-sm hover:bg-accent py-1 pr-2"
                prefetch={false}
                target="_blank"
                rel="noopener noreferrer"
            >
                <span className="truncate">
                    {truncateRoute(decodeURIComponent(route.x))}
                </span>
                <span>{route.y} views</span>
            </Link>
            {index < originalRoutes.length - 1 && <Separator className="m-0" />}
        </div>
    );
}

function RoutesPopover({
    item,
    originalRoutes,
    routeItem,
}: {
    item: PageviewData;
    originalRoutes: PageviewData[];
    routeItem: JSX.Element;
}) {
    const [searchQuery, setSearchQuery] = useState("");
    const filteredRoutes = originalRoutes.filter((route) =>
        route.x.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Popover>
            <PopoverTrigger asChild className="cursor-pointer">
                {routeItem}
            </PopoverTrigger>
            <PopoverContent className="w-128 font-mono" side="left">
                <h4 className="font-semibold mb-2">
                    {item.x} ({originalRoutes.length} routes)
                </h4>
                {originalRoutes.length > 10 && (
                    <Input
                        placeholder="Search routes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="mb-2 py-0"
                    />
                )}
                <div
                    className="border-t max-h-60 overflow-y-auto"
                    data-scrollbar-custom="true"
                >
                    {filteredRoutes.length > 0 ? (
                        <List
                            rowComponent={RowComponent}
                            rowCount={filteredRoutes.length}
                            rowHeight={28}
                            rowProps={{ originalRoutes: filteredRoutes }}
                        />
                    ) : (
                        <p className="text-sm text-muted-foreground p-2">
                            No routes match your search.
                        </p>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}

export function Routes({
    metricsData,
    getOriginalRoutes,
    isTransformedRoute,
}: RoutesProps) {
    return (
        <div>
            <h3 className="text-lg font-semibold">Routes</h3>
            <div
                className="space-y-1 overflow-y-auto"
                style={{ maxHeight: 400 - 14 }}
                data-scrollbar-custom="true"
            >
                {metricsData?.map((item, index) => {
                    const totalViews =
                        metricsData?.reduce((sum, item) => sum + item.y, 0) ||
                        0;
                    const percentage =
                        totalViews > 0
                            ? ((item.y / totalViews) * 100).toFixed(1)
                            : "0.0";
                    const truncatedRoute =
                        item.x.length > 30
                            ? `${item.x.substring(0, 30)}...`
                            : item.x;
                    const originalRoutes = getOriginalRoutes(item.x);
                    const routeItem = (
                        <div className="flex justify-between items-center py-1 px-2 border rounded-lg bg-card hover:bg-accent font-mono">
                            <span className="text-sm flex items-center gap-1">
                                {truncatedRoute}
                                {isTransformedRoute(item.x) && (
                                    <AlignJustify size={16} />
                                )}
                            </span>
                            <div className="text-right flex items-center gap-1">
                                <span className="text-sm">{item.y} views</span>
                                <Separator
                                    orientation="vertical"
                                    className="h-4! mt-1"
                                />
                                <p className="text-xs text-muted-foreground">
                                    {percentage}%
                                </p>
                            </div>
                        </div>
                    );
                    return isTransformedRoute(item.x) ? (
                        <RoutesPopover
                            key={index}
                            item={item}
                            originalRoutes={originalRoutes}
                            routeItem={routeItem}
                        />
                    ) : (
                        <div key={index}>{routeItem}</div>
                    );
                }) || (
                    <p className="text-muted-foreground">Loading routes...</p>
                )}
            </div>
        </div>
    );
}
