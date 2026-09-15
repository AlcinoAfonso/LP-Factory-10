import type { FactualTaxonIdentity } from "@/conversion-content/landing-page/input-catalog";

export type AdminTaxonFactualReleaseSnapshot = Readonly<{
  coverageFingerprint: string;
  identity: FactualTaxonIdentity;
}>;

export type AdminTaxonFactualReleaseCoreResult =
  | Readonly<{ ok: true; taxonId: string }>
  | Readonly<{ ok: false; error: string }>;

type AdminTaxonFactualReleasePorts = Readonly<{
  readSnapshot: (
    taxonId: string,
  ) => Promise<
    | Readonly<{ ok: true; value: AdminTaxonFactualReleaseSnapshot }>
    | Readonly<{ ok: false; message: string }>
  >;
  activate: (identity: FactualTaxonIdentity) => Promise<boolean>;
  verifyIdentity: (
    taxonId: string,
  ) => Promise<FactualTaxonIdentity | null>;
}>;

export async function executeAdminTaxonFactualReleaseCore(
  input: Readonly<{ taxonId: string; coverageFingerprint: string }>,
  ports: AdminTaxonFactualReleasePorts,
): Promise<AdminTaxonFactualReleaseCoreResult> {
  if (!input.taxonId) return { ok: false, error: "Taxon não informado." };
  if (!/^[a-f0-9]{64}$/.test(input.coverageFingerprint)) {
    return { ok: false, error: "A cobertura factual informada é inválida." };
  }

  const snapshot = await ports.readSnapshot(input.taxonId);
  if (!snapshot.ok) return { ok: false, error: snapshot.message };
  if (snapshot.value.identity.isActive) {
    return { ok: false, error: "O taxon já está ativo." };
  }
  if (snapshot.value.coverageFingerprint !== input.coverageFingerprint) {
    return {
      ok: false,
      error: "A cobertura factual mudou. Recarregue a página antes de liberar.",
    };
  }

  const activated = await ports.activate(snapshot.value.identity);
  if (!activated) {
    return {
      ok: false,
      error: "Não foi possível liberar o taxon sem concorrência. Recarregue a página.",
    };
  }

  const verified = await ports.verifyIdentity(input.taxonId);
  if (
    verified === null ||
    !sameTaxonIdentity(
      verified,
      { ...snapshot.value.identity, isActive: true },
    )
  ) {
    return {
      ok: false,
      error: "O estado final do taxon não pôde ser confirmado. Recarregue a página.",
    };
  }

  return { ok: true, taxonId: input.taxonId };
}

function sameTaxonIdentity(
  left: FactualTaxonIdentity,
  right: FactualTaxonIdentity,
): boolean {
  return (
    left.id === right.id &&
    left.parentId === right.parentId &&
    left.level === right.level &&
    left.name === right.name &&
    left.slug === right.slug &&
    left.isActive === right.isActive
  );
}
