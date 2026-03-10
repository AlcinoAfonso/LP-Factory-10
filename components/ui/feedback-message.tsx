import * as React from "react";
import { cn } from "@/lib/utils";

type FeedbackTone = "error" | "success" | "warning";

export interface FeedbackMessageProps {
  tone: FeedbackTone;
  children: React.ReactNode;
  className?: string;
}

const toneClasses: Record<FeedbackTone, string> = {
  error: "border-destructive/30 bg-destructive/10 text-destructive",
  success: "border-state-success/30 bg-state-success/10 text-state-success",
  warning: "border-state-warning/30 bg-state-warning/10 text-state-warning",
};

export function FeedbackMessage({ tone, children, className }: FeedbackMessageProps) {
  return (
    <div
      role={tone === "error" ? "alert" : undefined}
      className={cn("rounded-md border p-3 text-sm", toneClasses[tone], className)}
    >
      {children}
    </div>
  );
}
