import { Progress } from "@/components/ui/progress";
import { formatPercent } from "@/lib/utils";

interface ProgressBarProps {
  label: string;
  percent: number;
  current?: number;
  max?: number;
  showPercent?: boolean;
}

export function ProgressBar({ label, percent, current, max, showPercent = true }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percent));

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-zinc-300">{label}</span>
        <span className="text-zinc-400">
          {showPercent && formatPercent(clamped)}
          {current !== undefined && max !== undefined && (
            <span className="ml-2 text-zinc-500">
              ({current}/{max})
            </span>
          )}
        </span>
      </div>
      <Progress value={clamped} />
    </div>
  );
}
