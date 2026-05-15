import type { RiskLevel } from "@/types/trip";
import { cn } from "@/lib/utils/cn";

const STYLES: Record<RiskLevel, string> = {
  LOW: "bg-green-50 text-green-700",
  MEDIUM: "bg-amber-50 text-amber-700",
  HIGH: "bg-red-50 text-red-700",
};

const LABELS: Record<RiskLevel, string> = {
  LOW: "Low risk",
  MEDIUM: "Medium risk",
  HIGH: "High risk",
};

interface RiskBadgeProps {
  level: RiskLevel;
  reasons?: string[];
  className?: string;
}

export function RiskBadge({ level, reasons, className }: RiskBadgeProps) {
  return (
    <span
      title={reasons?.join(" · ")}
      className={cn(
        "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
        STYLES[level],
        className,
      )}
    >
      {LABELS[level]}
    </span>
  );
}
