import { AccessProvider } from "@/providers/AccessProvider";
import { getUserEmail } from "@/lib/auth/authAdapter";
import { Header } from "@/components/layout/Header";
import { getClientAccountSectionContext } from "../_server/section-guard";
import { getActivePrimaryAccountTaxon } from "../../../lib/onboarding/niche-resolution/adapters/accountTaxonomyAdapter";
import { getConfirmedOperationalNicheResolutionLabel } from "../../../lib/onboarding/niche-resolution/adapters/accountNicheResolutionUserAdapter";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ account: string }>;
};

export default async function Layout({ children, params }: LayoutProps) {
  const resolvedParams = await params;
  const slug = (resolvedParams?.account || "").trim().toLowerCase();

  if (slug === "home") {
    return <AccessProvider value={null}>{children}</AccessProvider>;
  }

  const ctx = await getClientAccountSectionContext(slug);
  const userEmail = await getUserEmail();
  const accountId = ctx?.account?.id ?? null;
  const primaryTaxon = accountId
    ? await getActivePrimaryAccountTaxon({ accountId })
    : null;
  const operationalNicheLabel = accountId && !primaryTaxon
    ? await getConfirmedOperationalNicheResolutionLabel({ accountId })
    : null;
  const resolvedNicheLabel = primaryTaxon?.name ?? operationalNicheLabel;
  const enrichedCtx = resolvedNicheLabel
    ? {
        ...ctx,
        account: {
          ...ctx.account,
          primaryTaxonName: resolvedNicheLabel,
        },
      }
    : ctx;

  return (
    <AccessProvider value={enrichedCtx as any}>
      <Header userEmail={userEmail} />
      {children}
    </AccessProvider>
  );
}
