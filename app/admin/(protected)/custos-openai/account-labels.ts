const generatedAccountLabel = /^(?:Conta\s+)?(?:acc-[a-f\d]{8}|[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12})$/i;

export function readableCostAccountName(value: string | null | undefined): string | null {
  const name = value?.trim();
  return name && !generatedAccountLabel.test(name) ? name : null;
}

export function costAccountLabel(name: string | null | undefined, confirmedName?: string): string {
  return readableCostAccountName(name) ?? readableCostAccountName(confirmedName) ?? "Conta sem nome cadastrado";
}
