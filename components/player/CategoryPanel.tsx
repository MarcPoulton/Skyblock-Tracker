import { ProgressBar } from "@/components/dashboard/ProgressBar";
import type { CategoryMetric } from "@/lib/metrics/types";
import { formatNumber } from "@/lib/utils";

interface CategoryPanelProps {
  title: string;
  metric: CategoryMetric;
  valueFormatter?: (n: number) => string;
}

export function CategoryPanel({ title, metric, valueFormatter }: CategoryPanelProps) {
  const format = valueFormatter ?? ((n: number) => String(Math.round(n)));

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-zinc-200">{title}</h3>
        <span className="text-sm text-emerald-400">
          {format(metric.current)}{metric.max > 0 ? ` / ${format(metric.max)}` : ""}
        </span>
      </div>
      <ProgressBar label="Completion" percent={metric.percent} showPercent />
      {metric.weight !== undefined && metric.weight > 0 && (
        <p className="text-xs text-zinc-500">Weight contribution: {formatNumber(metric.weight)}</p>
      )}
      {metric.breakdown.length > 0 && (
        <details className="group">
          <summary className="text-sm text-zinc-400 cursor-pointer hover:text-zinc-300">
            Show breakdown ({metric.breakdown.length} items)
          </summary>
          <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
            {metric.breakdown.map((item) => (
              <ProgressBar
                key={item.id}
                label={item.name}
                percent={item.percent}
                current={item.current}
                max={item.max}
              />
            ))}
          </div>
        </details>
      )}
      {metric.missing.length > 0 && (
        <div className="text-xs text-zinc-500">
          <span className="text-zinc-400">Missing: </span>
          {metric.missing.slice(0, 5).join(", ")}
          {metric.missing.length > 5 && ` +${metric.missing.length - 5} more`}
        </div>
      )}
    </div>
  );
}
