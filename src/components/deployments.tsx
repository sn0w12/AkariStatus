"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Deployment } from "@/lib/api";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "./ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    ColumnDef,
    flexRender,
    SortingState,
    ColumnFiltersState,
} from "@tanstack/react-table";
import Link from "next/link";
import { CheckCircle, XCircle, ChevronUp, ChevronDown } from "lucide-react";

export function DeploymentsDialog() {
    const [open, setOpen] = useState(false);
    const [deployments, setDeployments] = useState<Deployment[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sorting, setSorting] = useState<SortingState>([
        { id: "start_time", desc: true },
    ]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [now, setNow] = useState(new Date());

    const fetchDeployments = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/deployments");
            if (!res.ok) throw new Error("Failed to fetch deployments");
            const data: Deployment[] = await res.json();
            setDeployments(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (open) {
            fetchDeployments();
        }
    }, [open, fetchDeployments]);

    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    const formatDuration = (ms: number | null) => {
        if (!ms) return "N/A";
        const totalSeconds = Math.floor(ms / 1000);
        const days = Math.floor(totalSeconds / (60 * 60 * 24));
        const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
        const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
        const seconds = totalSeconds % 60;

        const parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

        return parts.join(" ");
    };

    const formatDate = (date: string | null) => {
        if (!date) return "N/A";
        return new Date(date).toLocaleString();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "completed":
                return "bg-positive";
            case "failed":
                return "bg-negative";
            case "started":
            case "superseded":
                return "bg-warning";
            default:
                return "bg-muted";
        }
    };

    const columns: ColumnDef<Deployment>[] = [
        {
            accessorKey: "repo_url",
            header: "Repo",
            enableSorting: true,
            cell: ({ getValue }) => {
                const url = getValue<string>();
                const cleanUrl = url.replace(/\.git$/, "");
                return (
                    <Link
                        href={cleanUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline truncate max-w-xs"
                    >
                        {cleanUrl}
                    </Link>
                );
            },
        },
        {
            accessorKey: "branch",
            header: "Branch",
            enableSorting: true,
        },
        {
            accessorKey: "status",
            header: "Status",
            enableSorting: true,
            cell: ({ getValue }) => {
                const status = getValue<string>();
                const capitalized =
                    status.charAt(0).toUpperCase() + status.slice(1);
                return (
                    <Badge className={getStatusColor(status)}>
                        {capitalized}
                    </Badge>
                );
            },
        },
        {
            accessorKey: "active",
            header: "Active",
            enableSorting: true,
            cell: ({ getValue }) => {
                const isActive = getValue<boolean>();
                return (
                    <div className="ml-2.5">
                        {isActive ? (
                            <CheckCircle className="text-positive" size={16} />
                        ) : (
                            <XCircle className="text-negative" size={16} />
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: "start_time",
            header: "Start Time",
            enableSorting: true,
            cell: ({ getValue }) => (
                <span className="text-muted-foreground">
                    {formatDate(getValue<string | null>())}
                </span>
            ),
        },
        {
            accessorKey: "duration_ms",
            header: "Duration",
            enableSorting: true,
            cell: ({ cell }) => {
                const deployment = cell.getContext().row.original;
                const ms = deployment.duration_ms;
                if (ms === null && deployment.active) {
                    const start =
                        deployment.start_time !== null
                            ? new Date(deployment.start_time)
                            : null;
                    const diff =
                        start !== null ? now.getTime() - start.getTime() : 0;
                    return (
                        <span className="text-muted-foreground">
                            {formatDuration(diff)}
                        </span>
                    );
                } else {
                    return (
                        <span className="text-muted-foreground">
                            {formatDuration(ms)}
                        </span>
                    );
                }
            },
        },
    ];

    const table = useReactTable({
        data: deployments,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        state: {
            sorting,
            columnFilters,
        },
    });

    const uniqueBranches = useMemo(() => {
        const filteredRows = table.getFilteredRowModel().rows;
        const branches = new Set(
            filteredRows.map((row) => row.original.branch)
        );
        return Array.from(branches).sort();
    }, [table]);

    const uniqueRepos = useMemo(() => {
        const repos = new Set(deployments.map((d) => d.repo_url));
        return Array.from(repos).sort();
    }, [deployments]);

    const uniqueStatuses = useMemo(() => {
        const filteredRows = table.getFilteredRowModel().rows;
        const statuses = new Set(
            filteredRows.map((row) => row.original.status)
        );
        return Array.from(statuses).sort();
    }, [table]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">View Deployments</Button>
            </DialogTrigger>
            <DialogContent
                className="sm:max-w-[60vw] max-h-[80vh] overflow-y-auto"
                showCloseButton={false}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span>Deployments</span>
                        <div className="flex gap-4 flex-wrap">
                            <Select
                                value={
                                    (table
                                        .getColumn("repo_url")
                                        ?.getFilterValue() as string) || "all"
                                }
                                onValueChange={(value) =>
                                    table
                                        .getColumn("repo_url")
                                        ?.setFilterValue(
                                            value === "all" ? undefined : value
                                        )
                                }
                            >
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Filter Repo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    {uniqueRepos.map((repo) => {
                                        const parts = repo.split("/");
                                        const display = parts
                                            .slice(-2)
                                            .join("/")
                                            .replace(/\.git$/, "");
                                        return (
                                            <SelectItem key={repo} value={repo}>
                                                {display}
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                            <Select
                                value={
                                    (table
                                        .getColumn("branch")
                                        ?.getFilterValue() as string) || "all"
                                }
                                onValueChange={(value) =>
                                    table
                                        .getColumn("branch")
                                        ?.setFilterValue(
                                            value === "all" ? undefined : value
                                        )
                                }
                            >
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Filter Branch" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    {uniqueBranches.map((branch) => (
                                        <SelectItem key={branch} value={branch}>
                                            {branch}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select
                                value={
                                    (table
                                        .getColumn("status")
                                        ?.getFilterValue() as string) || "all"
                                }
                                onValueChange={(value) =>
                                    table
                                        .getColumn("status")
                                        ?.setFilterValue(
                                            value === "all" ? undefined : value
                                        )
                                }
                            >
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Filter Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    {uniqueStatuses.map((status) => (
                                        <SelectItem key={status} value={status}>
                                            {status.charAt(0).toUpperCase() +
                                                status.slice(1)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select
                                value={
                                    table
                                        .getColumn("active")
                                        ?.getFilterValue() === true
                                        ? "true"
                                        : table
                                              .getColumn("active")
                                              ?.getFilterValue() === false
                                        ? "false"
                                        : "all"
                                }
                                onValueChange={(value) =>
                                    table
                                        .getColumn("active")
                                        ?.setFilterValue(
                                            value === "all"
                                                ? undefined
                                                : value === "true"
                                                ? true
                                                : false
                                        )
                                }
                            >
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Filter Active" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="true">Active</SelectItem>
                                    <SelectItem value="false">
                                        Inactive
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </DialogTitle>
                </DialogHeader>
                {loading && (
                    <p className="text-muted-foreground">
                        Loading deployments...
                    </p>
                )}
                {error && <p className="text-negative">{error}</p>}
                {!loading && !error && (
                    <div className="space-y-4">
                        {deployments.length === 0 ? (
                            <p className="text-muted-foreground">
                                No deployments found.
                            </p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    {table
                                        .getHeaderGroups()
                                        .map((headerGroup) => (
                                            <TableRow key={headerGroup.id}>
                                                {headerGroup.headers.map(
                                                    (header) => (
                                                        <TableHead
                                                            key={header.id}
                                                            className="cursor-pointer select-none"
                                                            onClick={header.column.getToggleSortingHandler()}
                                                        >
                                                            {header.isPlaceholder
                                                                ? null
                                                                : flexRender(
                                                                      header
                                                                          .column
                                                                          .columnDef
                                                                          .header,
                                                                      header.getContext()
                                                                  )}
                                                            {header.column.getIsSorted() ===
                                                                "asc" && (
                                                                <ChevronUp
                                                                    size={16}
                                                                    className="inline ml-1"
                                                                />
                                                            )}
                                                            {header.column.getIsSorted() ===
                                                                "desc" && (
                                                                <ChevronDown
                                                                    size={16}
                                                                    className="inline ml-1"
                                                                />
                                                            )}
                                                        </TableHead>
                                                    )
                                                )}
                                            </TableRow>
                                        ))}
                                </TableHeader>
                                <TableBody>
                                    {table.getRowModel().rows?.length ? (
                                        table.getRowModel().rows.map((row) => (
                                            <TableRow
                                                key={row.id}
                                                className="bg-card hover:bg-accent"
                                            >
                                                {row
                                                    .getVisibleCells()
                                                    .map((cell) => (
                                                        <TableCell
                                                            key={cell.id}
                                                        >
                                                            {flexRender(
                                                                cell.column
                                                                    .columnDef
                                                                    .cell,
                                                                cell.getContext()
                                                            )}
                                                        </TableCell>
                                                    ))}
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={columns.length}
                                                className="h-24 text-center"
                                            >
                                                No results.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
