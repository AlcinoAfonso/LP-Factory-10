import { redirect } from "next/navigation";

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
  return <OpenAiCostsDashboard {...defaults} />;
}
