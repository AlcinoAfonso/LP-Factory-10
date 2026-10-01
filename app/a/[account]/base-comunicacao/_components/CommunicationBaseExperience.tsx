"use client";

import { Children, createContext, useContext, useState, type ReactNode } from "react";
import { Button } from "../../../../../components/ui/button";
import { Select } from "../../../../../components/ui/select";
import type { CommunicationBase } from "../../../../../lib/communication-base/contracts";
import { communicationSections } from "../../../../../lib/communication-base/registry";
import { formatEditorValue } from "../../../../../lib/communication-base/editor-value";
import { useCommunicationDraftGuard } from "./CommunicationDraftGuard";

type SectionSelections = {
  selected: Record<1 | 2, string>;
  select: (stage: 1 | 2, key: string) => void;
};
const SelectionContext = createContext<SectionSelections | null>(null);

export function CommunicationBaseExperience({ children }: Readonly<{ children: ReactNode }>) {
  const [selected, setSelected] = useState<Record<1 | 2, string>>({ 1: "business_name", 2: "about" });
  return <SelectionContext.Provider value={{
    selected,
    select: (stage, key) => setSelected((current) => ({ ...current, [stage]: key })),
  }}>{children}</SelectionContext.Provider>;
}

export function CommunicationSectionNavigation({ stage, base, children }: Readonly<{
  stage: 1 | 2;
  base: CommunicationBase;
  children: ReactNode;
}>) {
  const selections = useContext(SelectionContext);
  const { confirmDiscard } = useCommunicationDraftGuard();
  if (!selections) throw new Error("CommunicationBaseExperience must wrap section navigation.");
  const sections = communicationSections.filter((section) => section.stage === stage);
  const editors = Children.toArray(children);
  const active = selections.selected[stage];
  const select = (key: string) => {
    if (key === active || !confirmDiscard()) return;
    selections.select(stage, key);
  };
  const status = (key: string) => {
    const section = base.sections[key as keyof typeof base.sections];
    return section && formatEditorValue(section.value, section.format).trim() ? "Preenchida" : "Ainda não preenchida";
  };
  return <div className="grid min-w-0 gap-5 md:grid-cols-[15rem_minmax(0,1fr)]">
    <div className="md:hidden">
      <label htmlFor={`communication-section-select-${stage}`} className="mb-2 block text-sm font-medium">Seção em trabalho</label>
      <Select id={`communication-section-select-${stage}`} value={active} onChange={(event) => select(event.target.value)}
        className="min-h-11 h-auto">
        {sections.map((section) => <option key={section.key} value={section.key}>{section.label} — {status(section.key)}</option>)}
      </Select>
    </div>
    <nav aria-label={`Seções da Etapa ${stage}`} className="hidden space-y-1 md:block">
      {sections.map((section) => <Button key={section.key} variant="secondary" onClick={() => select(section.key)}
        aria-current={active === section.key ? "true" : undefined}
        aria-controls={`communication-editor-${section.key}`}
        className={`min-h-11 w-full justify-start whitespace-normal px-3 py-3 text-left ${active === section.key ? "bg-primary/10 text-primary" : ""}`}>
        <span><span className="block">{section.label}</span><span className="mt-1 block text-xs font-normal text-muted-foreground">{status(section.key)}</span></span>
      </Button>)}
    </nav>
    <div className="min-w-0">
      {sections.map((section, index) => <div key={section.key} id={`communication-editor-${section.key}`} hidden={active !== section.key}>
        {editors[index]}
      </div>)}
    </div>
  </div>;
}
