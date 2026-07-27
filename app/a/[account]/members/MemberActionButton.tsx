"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

type MemberActionButtonProps = Readonly<{
  children: ReactNode;
  pendingLabel: string;
  confirmation?: string;
  tone?: "default" | "danger";
}>;

export function MemberActionButton({
  children,
  pendingLabel,
  confirmation,
  tone = "default",
}: MemberActionButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className={
        tone === "danger"
          ? "min-h-10 bg-destructive text-destructive-foreground hover:bg-destructive/90"
          : "min-h-10"
      }
      onClick={(event) => {
        if (confirmation && !window.confirm(confirmation)) event.preventDefault();
      }}
    >
      {pending ? pendingLabel : children}
    </Button>
  );
}
