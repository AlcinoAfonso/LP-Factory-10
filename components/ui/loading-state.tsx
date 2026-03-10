import * as React from "react";
import { cn } from "@/lib/utils";

export interface LoadingStateProps {
  label?: string;
  className?: string;
}

export function LoadingState({ label = "Carregando...", className }: LoadingStateProps) {
  return (
    <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)} aria-live="polite" aria-busy="true">
      <span className="h-2 w-2 animate-pulse rounded-full bg-current" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
