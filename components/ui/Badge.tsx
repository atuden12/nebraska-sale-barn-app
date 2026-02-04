import { ReactNode } from "react";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-gray-100 text-gray-700",
  success: "bg-pasture-100 text-pasture-700",
  warning: "bg-prairie-100 text-prairie-700",
  danger: "bg-cornhusker-100 text-cornhusker-700",
  info: "bg-blue-100 text-blue-700",
};

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

interface TrendBadgeProps {
  value: number;
  suffix?: string;
  showIcon?: boolean;
}

export function TrendBadge({ value, suffix = "%", showIcon = true }: TrendBadgeProps) {
  const isPositive = value > 0;
  const isNeutral = value === 0;

  const variant = isNeutral ? "default" : isPositive ? "success" : "danger";

  return (
    <Badge variant={variant}>
      {showIcon && !isNeutral && (
        <span className="mr-0.5">{isPositive ? "▲" : "▼"}</span>
      )}
      {isPositive && "+"}
      {value.toFixed(2)}
      {suffix}
    </Badge>
  );
}
