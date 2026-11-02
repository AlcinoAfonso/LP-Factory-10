"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { getSectionGuidance } from "../../../../../lib/communication-base/section-guidance";

export function SectionGuidance({ sectionKey, label }: Readonly<{ sectionKey: string; label: string }>) {
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
    <p>{guidance.description}</p>
    <div className="mt-1" onMouseLeave={() => setHovered(false)}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) { setOpen(false); setHovered(false); } }}>
      <Button type="button" variant="secondary" className="min-h-11 gap-2 px-3 text-xs font-medium"
        aria-label={`Como preencher: ${label}`} aria-expanded={visible} aria-controls={id}
        onPointerEnter={(event) => { if (event.pointerType === "mouse") setHovered(true); }}
        onClick={() => { setOpen(!open); setHovered(false); }}>
        Como preencher
      </Button>
      <div id={id} hidden={!visible} className="mt-1 rounded-lg border border-border bg-background p-3 text-foreground">
        {guidance.help}
      </div>
    </div>
  </div>;
}
