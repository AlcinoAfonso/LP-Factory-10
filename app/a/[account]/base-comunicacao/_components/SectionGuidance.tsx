"use client";

import { getSectionGuidance } from "../../../../../lib/communication-base/section-guidance";

export function SectionGuidance({ sectionKey, id, open, showDescription = true }: Readonly<{
  sectionKey: string; id: string; open: boolean; showDescription?: boolean;
}>) {
  const guidance = getSectionGuidance(sectionKey);
  if (!guidance) return null;
  return <div className="text-sm font-normal leading-6 text-muted-foreground">
    {showDescription ? <p className="mb-2">{guidance.description}</p> : null}
    <div id={id} hidden={!open} className="space-y-2 pb-2">
      {!showDescription ? <p>{guidance.description}</p> : null}
      <p>{guidance.help}</p>
    </div>
  </div>;
}
