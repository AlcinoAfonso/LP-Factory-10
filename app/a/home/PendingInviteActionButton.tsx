"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

export function PendingInviteActionButton(props: Readonly<{
  children: ReactNode;
  pendingLabel: string;
  confirmation?: string;
  tone?: "default" | "danger";
}>) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className={
        props.tone === "danger"
          ? "min-h-10 bg-destructive text-destructive-foreground hover:bg-destructive/90"
          : "min-h-10"
      }
      onClick={(event) => {
        if (props.confirmation && !window.confirm(props.confirmation)) event.preventDefault();
      }}
    >
      {pending ? props.pendingLabel : props.children}
    </Button>
  );
}
