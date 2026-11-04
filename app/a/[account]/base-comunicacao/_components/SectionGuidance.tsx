"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { getSectionGuidance } from "../../../../../lib/communication-base/section-guidance";

export function SectionGuidance({ sectionKey, label, showDescription = true, actions }: Readonly<{
  sectionKey: string; label: string; showDescription?: boolean; actions?: ReactNode;
}>) {
  const guidance = getSectionGuidance(sectionKey);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const visible = open || hovered;
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!visible) return;
    const dialog = rootRef.current?.closest("dialog");
    function dismiss(event: KeyboardEvent) {
      // Hover need not move focus from the editor. Dismiss help first without
      // triggering the parent dialog's cancel/discard flow or stealing focus.
      if (event.key !== "Escape" || !dialog?.open || !(event.target instanceof Node) || !dialog.contains(event.target)) return;
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      setHovered(false);
    }
    document.addEventListener("keydown", dismiss, true);
    return () => document.removeEventListener("keydown", dismiss, true);
  }, [visible]);
  if (!guidance) return null;
  return <div ref={rootRef} className="mt-1 text-sm font-normal text-muted-foreground">
    {showDescription ? <p>{guidance.description}</p> : null}
    <div className="mt-1" onMouseLeave={() => setHovered(false)}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) { setOpen(false); setHovered(false); } }}>
      <div className="flex flex-wrap items-center gap-x-4">
      <Button type="button" variant="secondary" className="min-h-11 px-0 font-normal !text-muted-foreground underline underline-offset-4"
        aria-label={`Como preencher: ${label}`} aria-expanded={visible} aria-controls={id}
        onPointerEnter={(event) => { if (event.pointerType === "mouse") setHovered(true); }}
        onClick={() => { setOpen(!open); setHovered(false); }}>
        Como preencher
      </Button>
      {actions}
      </div>
      <div id={id} hidden={!visible} className="space-y-2 pb-2 text-sm font-normal leading-6 text-muted-foreground">
        {!showDescription ? <p>{guidance.description}</p> : null}
        {guidance.help}
      </div>
    </div>
  </div>;
}
