import { redirect } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { requirePlatformAdmin } from "@/lib/access/guards";
import { defaultOpenAiCostsDates } from "@/openai-costs/dashboard";
import { OpenAiCostsDashboard } from "./_components/OpenAiCostsDashboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OpenAiCostsPage() {
  const gate = await requirePlatformAdmin();
  if (!gate.allowed) {
    if (gate.redirect === "/auth/login") {
      redirect("/auth/login?next=%2Fadmin%2Fcustos-openai");
    }
    redirect(gate.redirect);
  }
  const defaults = defaultOpenAiCostsDates();
  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Visibilidade financeira OpenAI"
        title="Custos OpenAI"
        description="Consulte o gasto oficial total e compare com os custos prospectivos calculados para texto e imagem das Landing Pages, por cliente."
        meta="USD · sob demanda"
      />
      <OpenAiCostsDashboard {...defaults} />
    </div>
  );
}
