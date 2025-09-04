"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "../ui/separator";

interface TimeframeSelectorProps {
    onTimeframeChange: (timeframe: string, days: number) => void;
    currentTimeframe: string;
}

export function TimeframeSelector({
    onTimeframeChange,
    currentTimeframe,
}: TimeframeSelectorProps) {
    const [open, setOpen] = React.useState(false);

    const options = [
        { value: "1d", label: "Today", days: 1 },
        { value: "separator", label: "", days: 0 },
        { value: "this-week", label: "This week", days: 0 },
        { value: "7d", label: "Last 7 days", days: 7 },
        { value: "separator", label: "", days: 0 },
        { value: "this-month", label: "This month", days: 0 },
        { value: "30d", label: "Last 30 days", days: 30 },
        { value: "90d", label: "Last 90 days", days: 90 },
        { value: "separator", label: "", days: 0 },
        { value: "12m", label: "Last 12 months", days: 365 },
        { value: "this-year", label: "This year", days: 0 },
    ];

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="default"
                    role="combobox"
                    aria-expanded={open}
                    className="w-[200px] justify-between bg-card text-card-foreground border hover:bg-accent hover:text-accent-foreground transition-none"
                >
                    {currentTimeframe
                        ? options.find(
                              (option) => option.value === currentTimeframe
                          )?.label
                        : "Select timeframe..."}
                    <ChevronsUpDown className="opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
                <Command>
                    <CommandInput
                        placeholder="Search timeframe..."
                        className="h-9"
                    />
                    <CommandList>
                        <CommandEmpty>No timeframe found.</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) =>
                                option.value === "separator" ? (
                                    <Separator
                                        key={Math.random()}
                                        className="my-1"
                                    />
                                ) : (
                                    <CommandItem
                                        key={option.value}
                                        value={option.value}
                                        className="cursor-pointer"
                                        onSelect={() => {
                                            onTimeframeChange(
                                                option.value,
                                                option.days
                                            );
                                            setOpen(false);
                                        }}
                                    >
                                        {option.label}
                                        <Check
                                            className={cn(
                                                "ml-auto",
                                                currentTimeframe ===
                                                    option.value
                                                    ? "opacity-100"
                                                    : "opacity-0"
                                            )}
                                        />
                                    </CommandItem>
                                )
                            )}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
