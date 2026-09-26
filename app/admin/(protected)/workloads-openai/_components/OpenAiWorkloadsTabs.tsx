"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";

type Tab = "models" | "workloads";

export function OpenAiWorkloadsTabs({ models, workloads }: Readonly<{
  models: ReactNode;
  workloads: ReactNode;
}>) {
  const [activeTab, setActiveTab] = useState<Tab>("models");
  const modelTabRef = useRef<HTMLButtonElement>(null);
  const workloadTabRef = useRef<HTMLButtonElement>(null);

  function selectWithKeyboard(event: KeyboardEvent<HTMLButtonElement>, current: Tab) {
    let next: Tab | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      next = current === "models" ? "workloads" : "models";
    } else if (event.key === "Home") {
      next = "models";
    } else if (event.key === "End") {
      next = "workloads";
    }
    if (next) {
      event.preventDefault();
      setActiveTab(next);
      (next === "models" ? modelTabRef : workloadTabRef).current?.focus();
    }
  }

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card shadow-card" aria-label="Governança OpenAI">
      <div className="flex border-b border-border px-4 pt-2 sm:px-5" role="tablist" aria-label="Área de governança OpenAI">
        <button
          ref={modelTabRef}
          type="button"
          id="openai-tab-models"
          role="tab"
          aria-selected={activeTab === "models"}
          aria-controls="openai-panel-models"
          tabIndex={activeTab === "models" ? 0 : -1}
          className={`min-h-11 border-b-2 px-4 py-2 text-sm font-semibold outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30 ${activeTab === "models" ? "border-brand-700 text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          onClick={() => setActiveTab("models")}
          onKeyDown={(event) => selectWithKeyboard(event, "models")}
        >
          Modelos
        </button>
        <button
          ref={workloadTabRef}
          type="button"
          id="openai-tab-workloads"
          role="tab"
          aria-selected={activeTab === "workloads"}
          aria-controls="openai-panel-workloads"
          tabIndex={activeTab === "workloads" ? 0 : -1}
          className={`min-h-11 border-b-2 px-4 py-2 text-sm font-semibold outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30 ${activeTab === "workloads" ? "border-brand-700 text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          onClick={() => setActiveTab("workloads")}
          onKeyDown={(event) => selectWithKeyboard(event, "workloads")}
        >
          Workloads
        </button>
      </div>
      <div id="openai-panel-models" role="tabpanel" aria-labelledby="openai-tab-models" hidden={activeTab !== "models"}>
        {models}
      </div>
      <div id="openai-panel-workloads" role="tabpanel" aria-labelledby="openai-tab-workloads" hidden={activeTab !== "workloads"}>
        {workloads}
      </div>
    </section>
  );
}
