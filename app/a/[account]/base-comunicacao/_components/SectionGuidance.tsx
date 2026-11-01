"use client";

import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { getSectionGuidance } from "../../../../../lib/communication-base/section-guidance";

export function SectionGuidance({ sectionKey, label }: Readonly<{ sectionKey: string; label: string }>) {
  const guidance = getSectionGuidance(sectionKey);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const visible = open || hovered;
  const id = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  if (!guidance) return null;
  return <div className="mt-1 text-sm font-normal text-muted-foreground">
    <p>{guidance.description}</p>
    <div className="mt-1" onMouseLeave={() => setHovered(false)}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) { setOpen(false); setHovered(false); } }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && visible) { event.preventDefault(); event.stopPropagation(); setOpen(false); setHovered(false); buttonRef.current?.focus(); }
      }}>
      <Button ref={buttonRef} type="button" variant="secondary" className="min-h-11 min-w-11 px-3"
        aria-label={`Ajuda de ${label}`} aria-expanded={visible} aria-controls={id}
        onPointerEnter={(event) => { if (event.pointerType === "mouse") setHovered(true); }}
        onClick={() => { setOpen(!open); setHovered(false); }}>
        <span aria-hidden="true">?</span>
      </Button>
      <div id={id} hidden={!visible} className="mt-1 rounded-lg border border-border bg-background p-3 text-foreground">
        {guidance.help}
      </div>
    </div>
  </div>;
}
