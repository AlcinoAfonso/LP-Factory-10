"use client";

import { useActionState, useEffect, useState } from "react";

import type { AdminTaxonDetail } from "@/lib/admin/adapters/adminReadOnlyTypes";

type ManageTaxonActionState = {
  error: string | null;
};

type TaxonAction = (
  state: ManageTaxonActionState,
  formData: FormData,
) => Promise<ManageTaxonActionState>;

type AdminTaxonManageFormProps = {
  taxon: AdminTaxonDetail;
  updateAction: TaxonAction;
  addAliasAction: TaxonAction;
  deleteAliasAction: TaxonAction;
  deleteAction: TaxonAction;
};

const initialState: ManageTaxonActionState = { error: null };

export function AdminTaxonManageForm({
  taxon,
  updateAction,
  addAliasAction,
  deleteAliasAction,
  deleteAction,
}: AdminTaxonManageFormProps) {
  const [updateState, updateFormAction, updatePending] = useActionState(updateAction, initialState);
  const [addAliasState, addAliasFormAction, addAliasPending] = useActionState(addAliasAction, initialState);
  const [deleteAliasState, deleteAliasFormAction, deleteAliasPending] = useActionState(deleteAliasAction, initialState);
  const [deleteState, deleteFormAction, deletePending] = useActionState(deleteAction, initialState);
  const [name, setName] = useState(taxon.name);
  const [slug, setSlug] = useState(taxon.slug);
  const [slugEdited, setSlugEdited] = useState(false);
  const [confirmSlug, setConfirmSlug] = useState("");

  useEffect(() => {
    if (!slugEdited) setSlug(slugify(name));
  }, [name, slugEdited]);

  return (
    <div className="space-y-6">
      <form action={updateFormAction} className="rounded-lg border border-border bg-card p-5 shadow-card">
        <input type="hidden" name="taxonId" value={taxon.id} />
        <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-card-foreground">Dados do taxon</h2>
            <p className="mt-1 text-sm text-muted-foreground">Edite nome, slug e status sem alterar a hierarquia.</p>
          </div>
          <button
            className="inline-flex h-10 items-center justify-center rounded-md bg-brand-600 px-4 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={updatePending}
          >
            {updatePending ? "Salvando..." : "Salvar"}
          </button>
        </div>

        {updateState.error ? <ErrorMessage message={updateState.error} /> : null}

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Nome</span>
            <input
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none ring-brand-600/20 transition focus:ring-4"
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              minLength={2}
            />
          </label>

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
              required
            />
          </label>

          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              className="h-4 w-4 rounded border-border text-brand-600"
              name="isActive"
              type="checkbox"
              defaultChecked={taxon.isActive}
            />
            Manter ativo
          </label>
        </div>
      </form>

      <section className="rounded-lg border border-border bg-card p-5 shadow-card">
        <h2 className="text-sm font-semibold text-card-foreground">Aliases</h2>
        <form action={addAliasFormAction} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input type="hidden" name="taxonId" value={taxon.id} />
          <input
            className="h-10 min-w-0 flex-1 rounded-md border border-border bg-background px-3 text-sm outline-none ring-brand-600/20 transition focus:ring-4"
            name="aliasText"
            placeholder="Novo alias"
            required
          />
          <button
            className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-muted-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
            disabled={addAliasPending}
          >
            {addAliasPending ? "Adicionando..." : "Adicionar alias"}
          </button>
        </form>

        {addAliasState.error ? <ErrorMessage message={addAliasState.error} /> : null}
        {deleteAliasState.error ? <ErrorMessage message={deleteAliasState.error} /> : null}

        {taxon.aliases.length === 0 ? (
          <p className="mt-4 rounded-md border border-dashed border-border bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
            Nenhum alias cadastrado
          </p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            {taxon.aliases.map((alias) => (
              <form action={deleteAliasFormAction} key={alias.id}>
                <input type="hidden" name="taxonId" value={taxon.id} />
                <input type="hidden" name="aliasId" value={alias.id} />
                <button
                  className="inline-flex items-center gap-2 rounded-md border border-border bg-muted px-2.5 py-1 text-xs text-muted-foreground transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={deleteAliasPending}
                  title="Remover alias"
                >
                  {alias.aliasText}
                  <span aria-hidden="true">x</span>
                </button>
              </form>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-lg border border-red-200 bg-red-50/40 p-5 shadow-card">
        <h2 className="text-sm font-semibold text-red-900">Exclusao segura</h2>
        {taxon.canDelete ? (
          <form action={deleteFormAction} className="mt-4 space-y-3">
            <input type="hidden" name="taxonId" value={taxon.id} />
            <label className="space-y-1">
              <span className="text-xs font-medium text-red-900">Digite o slug para confirmar</span>
              <input
                className="h-10 w-full rounded-md border border-red-200 bg-background px-3 text-sm outline-none ring-red-600/20 transition focus:ring-4"
                name="confirmSlug"
                value={confirmSlug}
                onChange={(event) => setConfirmSlug(event.target.value)}
                placeholder={taxon.slug}
              />
            </label>
            {deleteState.error ? <ErrorMessage message={deleteState.error} /> : null}
            <button
              className="inline-flex h-10 items-center justify-center rounded-md bg-red-600 px-4 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={deletePending || confirmSlug !== taxon.slug}
            >
              {deletePending ? "Excluindo..." : "Excluir taxon"}
            </button>
          </form>
        ) : (
          <div className="mt-3 rounded-md border border-red-200 bg-background px-4 py-3 text-sm text-red-800">
            Este taxon nao pode ser excluido porque possui: {taxon.deleteBlockers.join(", ")}.
          </div>
        )}
      </section>
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  );
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
