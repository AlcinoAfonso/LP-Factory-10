"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";

type Stage = 0 | 1;

export function CommunicationBaseTabs({ stageOne, stageTwo }: Readonly<{
  stageOne: ReactNode;
  stageTwo: ReactNode;
}>) {
  const [selected, setSelected] = useState<Stage>(0);
  const firstTabRef = useRef<HTMLButtonElement>(null);
  const secondTabRef = useRef<HTMLButtonElement>(null);

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, current: Stage) {
    let next: Stage;
    switch (event.key) {
      case "ArrowLeft":
      case "ArrowRight":
        next = current === 0 ? 1 : 0;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    setSelected(next);
    (next === 0 ? firstTabRef : secondTabRef).current?.focus();
  }

  return (
    <div>
      <div role="tablist" aria-label="Etapas da Base de Comunicação" className="grid grid-cols-2 border-b border-border">
        <button ref={firstTabRef} type="button" role="tab" id="communication-stage-1-tab"
          aria-controls="communication-stage-1-panel" aria-selected={selected === 0}
          tabIndex={selected === 0 ? 0 : -1} onClick={() => setSelected(0)}
          onKeyDown={(event) => onTabKeyDown(event, 0)}
          className={`min-h-11 min-w-0 border-b-2 px-3 py-3 text-center text-sm font-semibold leading-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-inset ${selected === 0
            ? "border-brand-700 text-brand-700"
            : "border-transparent text-muted-foreground hover:text-foreground"}`}>
          Verdade da empresa
        </button>
        <button ref={secondTabRef} type="button" role="tab" id="communication-stage-2-tab"
          aria-controls="communication-stage-2-panel" aria-selected={selected === 1}
          tabIndex={selected === 1 ? 0 : -1} onClick={() => setSelected(1)}
          onKeyDown={(event) => onTabKeyDown(event, 1)}
          className={`min-h-11 min-w-0 border-b-2 px-3 py-3 text-center text-sm font-semibold leading-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-inset ${selected === 1
            ? "border-brand-700 text-brand-700"
            : "border-transparent text-muted-foreground hover:text-foreground"}`}>
          Inteligência de comunicação
        </button>
      </div>
      <div id="communication-stage-1-panel" role="tabpanel" aria-labelledby="communication-stage-1-tab"
        tabIndex={0} hidden={selected !== 0} className="pt-6">
        {stageOne}
      </div>
      <div id="communication-stage-2-panel" role="tabpanel" aria-labelledby="communication-stage-2-tab"
        tabIndex={0} hidden={selected !== 1} className="pt-6">
        {stageTwo}
      </div>
    </div>
  );
}
