export const generatedCostAccountLabel = /^\s*(?:Conta\s+)?(?:acc-[a-f0-9]{8}|[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})\s*$/i;

export function readableCostAccountName(value: string | null | undefined): string | null {
  const name = value?.trim();
  return name && !generatedCostAccountLabel.test(name) ? name : null;
}

export function costAccountLabel(publicName: string | null | undefined): string {
  return readableCostAccountName(publicName) ?? "Conta sem nome público cadastrado";
}
