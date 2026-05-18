import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type AdminStatusBadgeProps = {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger";
};

const toneClassName = {
  neutral: "border-border bg-muted text-muted-foreground",
  success: "border-green-200 bg-green-50 text-green-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-red-200 bg-red-50 text-red-700",
};

export function AdminStatusBadge({ children, tone = "neutral" }: AdminStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium",
        toneClassName[tone],
      )}
    >
      {children}
    </span>
  );
}

export function accountStatusTone(status: string): AdminStatusBadgeProps["tone"] {
  if (status === "active") return "success";
  if (status === "pending_setup") return "warning";
  if (status === "suspended") return "danger";
  return "neutral";
}
