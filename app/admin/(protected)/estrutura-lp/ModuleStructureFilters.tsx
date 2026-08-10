"use client";

import { useState } from "react";

type ModuleOption = {
  moduleKey: string;
  label: string;
  variants: readonly {
    variantKey: string;
    variantVersion: number;
    label: string;
  }[];
};

type ModuleStructureFiltersProps = {
  modules: readonly ModuleOption[];
  initialModuleKey: string;
  initialVariantKey: string;
  initialFunnelProfileKey: "bofu" | "mofu" | "tofu";
};

export function ModuleStructureFilters({
  modules,
  initialModuleKey,
  initialVariantKey,
  initialFunnelProfileKey,
}: ModuleStructureFiltersProps) {
  const [moduleKey, setModuleKey] = useState(initialModuleKey);
  const selectedModule = modules.find((module) => module.moduleKey === moduleKey) ?? modules[0];
  const [variantKey, setVariantKey] = useState(initialVariantKey);

  return (
    <form action="/admin/estrutura-lp" className="rounded-lg border border-border bg-card p-3">
      <input type="hidden" name="view" value="modulos" />
      <div className="flex flex-wrap items-end gap-3">
        <label className="w-full space-y-1 sm:w-52">
          <span className="text-xs font-medium text-muted-foreground">Módulo</span>
          <select
            name="module"
            value={selectedModule?.moduleKey ?? ""}
            onChange={(event) => {
              const nextModule = modules.find((module) => module.moduleKey === event.target.value);
              setModuleKey(event.target.value);
              setVariantKey(nextModule?.variants[0]?.variantKey ?? "");
            }}
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none ring-brand-600/20 transition focus-visible:ring-4"
          >
            {modules.map((module) => <option key={module.moduleKey} value={module.moduleKey}>{module.label}</option>)}
          </select>
        </label>
        <label className="w-full space-y-1 sm:w-56">
          <span className="text-xs font-medium text-muted-foreground">Variante</span>
          <select
            name="variant"
            value={selectedModule?.variants.some((variant) => variant.variantKey === variantKey) ? variantKey : selectedModule?.variants[0]?.variantKey ?? ""}
            onChange={(event) => setVariantKey(event.target.value)}
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none ring-brand-600/20 transition focus-visible:ring-4"
          >
            {selectedModule?.variants.map((variant) => (
              <option key={variant.variantKey} value={variant.variantKey}>{variant.label} · v{variant.variantVersion}</option>
            ))}
          </select>
        </label>
        <label className="w-full space-y-1 sm:w-36">
          <span className="text-xs font-medium text-muted-foreground">Perfil de funil</span>
          <select name="funnel" defaultValue={initialFunnelProfileKey} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none ring-brand-600/20 transition focus-visible:ring-4">
            <option value="bofu">BOFU</option>
            <option value="mofu">MOFU</option>
            <option value="tofu">TOFU</option>
          </select>
        </label>
        <button className="h-10 rounded-md bg-brand-600 px-4 text-sm font-medium text-white outline-none transition hover:bg-brand-700 focus-visible:ring-4 focus-visible:ring-brand-600/20">
          Consultar
        </button>
      </div>
    </form>
  );
}
