"use client";

import { useFormStatus } from "react-dom";

export function WorkspaceSubmitButton(props: Readonly<{
  idleLabel: string;
  pendingLabel: string;
  className: string;
}>) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-disabled={pending} className={props.className}>
      {pending ? props.pendingLabel : props.idleLabel}
    </button>
  );
}
