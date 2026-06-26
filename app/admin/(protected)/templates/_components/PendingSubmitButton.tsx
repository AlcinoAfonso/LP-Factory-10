"use client";

import { useFormStatus } from "react-dom";

import { cn } from "@/lib/utils";

type PendingSubmitButtonProps = {
  children: string;
  pendingLabel: string;
  disabled?: boolean;
  variant?: "primary" | "secondary";
};

export function PendingSubmitButton({
  children,
  pendingLabel,
  disabled = false,
  variant = "primary",
}: PendingSubmitButtonProps) {
  const { pending } = useFormStatus();
  const isDisabled = disabled || pending;

  return (
    <button
      className={cn(
        "inline-flex h-10 w-full items-center justify-center rounded-md px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto",
        variant === "primary"
          ? "bg-brand-600 text-white hover:bg-brand-700"
          : "border border-border text-muted-foreground hover:bg-muted",
      )}
      disabled={isDisabled}
      type="submit"
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
