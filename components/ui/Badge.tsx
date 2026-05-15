import { cn } from "@/lib/utils/cn";

type BadgeVariant = "primary" | "secondary" | "success" | "warning" | "error" | "neutral";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  primary: "bg-primary-fixed text-primary",
  secondary: "bg-secondary-container text-on-secondary-container",
  success: "bg-green-100 text-green-800",
  warning: "bg-amber-100 text-amber-800",
  error: "bg-error-container text-error",
  neutral: "bg-surface-container text-on-surface-variant",
};

export function Badge({ children, variant = "neutral", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-label-caps text-label-caps uppercase tracking-widest px-2.5 py-0.5 rounded-full",
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
