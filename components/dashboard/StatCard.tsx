import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber, formatPercent } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  format?: "number" | "percent" | "raw";
}

export function StatCard({ title, value, subtitle, format = "raw" }: StatCardProps) {
  let display = String(value);
  if (format === "number" && typeof value === "number") display = formatNumber(value);
  if (format === "percent" && typeof value === "number") display = formatPercent(value);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-zinc-400">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-emerald-400">{display}</div>
        {subtitle && <p className="text-xs text-zinc-500 mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
