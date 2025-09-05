interface StatCardProps {
    title: string;
    value: number;
    percent: number;
    animatedPercent: number;
    invertPercentColor?: boolean;
}

export function StatCard({
    title,
    value,
    percent,
    animatedPercent,
    invertPercentColor = false,
}: StatCardProps) {
    const percentColor = invertPercentColor
        ? percent > 0
            ? "text-negative"
            : percent < 0
            ? "text-positive"
            : "text-muted-foreground"
        : percent > 0
        ? "text-positive"
        : percent < 0
        ? "text-negative"
        : "text-muted-foreground";

    return (
        <div className="text-center p-6 border rounded-lg bg-card">
            <h3 className="text-3xl font-bold mb-2">{Math.round(value)}</h3>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className={`text-xs ${percentColor}`}>
                {percent > 0 ? "+" : ""}
                {animatedPercent.toFixed(1)}%
            </p>
        </div>
    );
}
