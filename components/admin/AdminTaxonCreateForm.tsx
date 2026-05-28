"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";

import type { AdminTaxonLevel, AdminTaxonParentOption } from "@/lib/admin/adapters/adminReadOnlyTypes";

type CreateTaxonActionState = {
  error: string | null;
};

type AdminTaxonCreateFormProps = {
  action: (state: CreateTaxonActionState, formData: FormData) => Promise<CreateTaxonActionState>;
  parentOptions: AdminTaxonParentOption[];
};

const initialState: CreateTaxonActionState = { error: null };

const levelLabels: Record<AdminTaxonLevel, string> = {
  segment: "Segmento",
  niche: "Nicho",
  ultra_niche: "Ultranicho",
};

export function AdminTaxonCreateForm({ action, parentOptions }: AdminTaxonCreateFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [level, setLevel] = useState<AdminTaxonLevel>("segment");
  const [parentId, setParentId] = useState("");

  const parentLevel = level === "niche" ? "segment" : level === "ultra_niche" ? "niche" : null;
  const availableParents = useMemo(
    () => parentOptions.filter((option) => option.level === parentLevel),
    [parentLevel, parentOptions],
  );
  const selectedParent = availableParents.find((option) => option.id === parentId) ?? null;

  useEffect(() => {
    if (!slugEdited) setSlug(slugify(name));
  }, [name, slugEdited]);

  useEffect(() => {
    setParentId("");
  }, [level]);

  const previewLines = buildPreviewLines(level, name, selectedParent);

  return (
    <form action={formAction} className="space-y-6">
      {state.error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}

      <section className="rounded-lg border border-border bg-card p-5 shadow-card">
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Nome</span>
            <input
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none ring-brand-600/20 transition focus:ring-4"
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex.: Implante dentario"
              required
              minLength={2}
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Nivel</span>
            <select
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none ring-brand-600/20 transition focus:ring-4"
              name="level"
              value={level}
              onChange={(event) => setLevel(event.target.value as AdminTaxonLevel)}
            >
              <option value="segment">Segmento</option>
              <option value="niche">Nicho</option>
              <option value="ultra_niche">Ultranicho</option>
            </select>
          </label>

          {parentLevel ? (
            <label className="space-y-1 lg:col-span-2">
              <span className="text-xs font-medium text-muted-foreground">
                Pai ({parentLevel === "segment" ? "segmento" : "nicho"})
              </span>
              <select
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none ring-brand-600/20 transition focus:ring-4"
                name="parentId"
                value={parentId}
                onChange={(event) => setParentId(event.target.value)}
                required
              >
                <option value="">Selecione o taxon pai</option>
                {availableParents.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.parentName ? `${option.parentName} / ${option.name}` : option.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <input type="hidden" name="parentId" value="" />
          )}

          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Slug</span>
            <input
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none ring-brand-600/20 transition focus:ring-4"
              name="slug"
              value={slug}
              onChange={(event) => {
                setSlugEdited(true);
                setSlug(slugify(event.target.value));
              }}
              placeholder="implante-dentario"
              required
            />
          </label>

          <label className="flex items-end gap-2 pb-2 text-sm text-muted-foreground">
            <input
              className="h-4 w-4 rounded border-border text-brand-600"
              name="isActive"
              type="checkbox"
              defaultChecked
            />
            Criar como ativo
          </label>

          <label className="space-y-1 lg:col-span-2">
            <span className="text-xs font-medium text-muted-foreground">Aliases opcionais</span>
            <textarea
              className="min-h-24 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none ring-brand-600/20 transition focus:ring-4"
              name="aliases"
              placeholder="Um alias por linha, ou separados por virgula"
            />
          </label>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-5 shadow-card">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-card-foreground">Preview da hierarquia</h2>
            <div className="rounded-md border border-dashed border-border bg-muted/30 p-4 font-mono text-sm text-muted-foreground">
              {previewLines.map((line, index) => (
                <div key={`${line.text}-${index}`} className={line.className}>
                  {line.text}
                </div>
              ))}
            </div>
          </div>

          <div className="inline-flex w-fit rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {levelLabels[level]}
          </div>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-muted-foreground transition hover:bg-muted"
          href="/admin/taxonomia"
        >
          Cancelar
        </Link>
        <button
          className="inline-flex h-10 items-center justify-center rounded-md bg-brand-600 px-4 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={pending}
        >
          {pending ? "Criando..." : "Criar taxon"}
        </button>
      </div>
    </form>
  );
}

function buildPreviewLines(level: AdminTaxonLevel, name: string, parent: AdminTaxonParentOption | null) {
  const cleanName = name.trim() || "Novo taxon";

  if (level === "segment") {
    return [{ text: cleanName, className: "text-foreground" }];
  }

  if (level === "niche") {
    return [
      { text: parent?.name ?? "Segmento", className: "text-foreground" },
      { text: `  ${cleanName}`, className: "text-foreground" },
    ];
  }

  return [
    { text: parent?.parentName ?? "Segmento", className: "text-foreground" },
    { text: `  ${parent?.name ?? "Nicho"}`, className: "text-foreground" },
    { text: `    ${cleanName}`, className: "text-foreground" },
  ];
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}
