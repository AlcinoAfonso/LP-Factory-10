import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import { generatedCostAccountLabel, readableCostAccountName } from "./account-labels";
import type { OpenAiCostAccountOption } from "./action-core";

type AccountRow = Readonly<{ id: string; subdomain: string | null }>;
type BaseNameRow = Readonly<{ account_id: string; public_name: string | null }>;
type ConfirmedNameRow = Readonly<{ account_id: string; business_display_name: string }>;
const BASE_NAME = "sections_json->business_name->>value";
const BASE_FORMAT = "sections_json->business_name->>format";
const BASE_ORIGIN = "sections_json->business_name->>origin";
const CONFIRMED_ORIGINS = ["user_confirmed", "pending_setup_confirmed"] as const;
const PAGE_SIZE = 100;
const SUGGESTION_LIMIT = 12;

// Consumers authorize the administrative route before invoking these read-only projections.
export async function readPublicCostAccountNames(ids: readonly string[]): Promise<ReadonlyMap<string, string> | null> {
  const names = new Map<string, string>();
  if (ids.length === 0) return names;
  const service = createServiceClient();
  for (let start = 0; start < ids.length; start += PAGE_SIZE) {
    const batch = ids.slice(start, start + PAGE_SIZE);
    const base = await service.from("account_communication_bases")
      .select("account_id,public_name:" + BASE_NAME).in("account_id", batch)
      .eq(BASE_FORMAT, "text").in(BASE_ORIGIN, CONFIRMED_ORIGINS)
      .overrideTypes<BaseNameRow[], { merge: false }>();
    if (base.error || !base.data) return null;
    for (const row of base.data) {
      const name = readableCostAccountName(row.public_name);
      if (name) names.set(row.account_id, name);
    }
    const missing = batch.filter(id => !names.has(id));
    if (missing.length === 0) continue;
    let offset = 0;
    while (true) {
      const { data, error } = await service.from("account_pending_setup_conversations")
        .select("account_id,business_display_name")
        .in("account_id", missing).eq("stage", "completed")
        .not("business_display_name", "is", null)
        .order("account_id").order("completed_at", { ascending: false }).order("id", { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);
      if (error || !data) return null;
      for (const row of data as ConfirmedNameRow[]) {
        const name = readableCostAccountName(row.business_display_name);
        if (name && !names.has(row.account_id)) names.set(row.account_id, name);
      }
      if (data.length < PAGE_SIZE || missing.every(id => names.has(id))) break;
      offset += PAGE_SIZE;
    }
  }
  return names;
}

export async function searchCostAccountNames(query: string): Promise<readonly OpenAiCostAccountOption[] | null> {
  const pattern = query.replace(/[\\%_]/g, "\\$&");
  const service = createServiceClient();
  const [base, confirmed] = await Promise.all([
    service.from("account_communication_bases").select("account_id")
      .eq(BASE_FORMAT, "text").in(BASE_ORIGIN, CONFIRMED_ORIGINS)
      .ilike(BASE_NAME, `%${pattern}%`).not(BASE_NAME, "imatch", generatedCostAccountLabel.source)
      .order(BASE_NAME).order("account_id").limit(SUGGESTION_LIMIT * 2),
    service.from("account_pending_setup_conversations").select("account_id")
      .eq("stage", "completed").ilike("business_display_name", `%${pattern}%`)
      .not("business_display_name", "imatch", generatedCostAccountLabel.source)
      .order("completed_at", { ascending: false }).order("id", { ascending: false }).limit(SUGGESTION_LIMIT * 3),
  ]);
  if (base.error && confirmed.error) return null;
  const matches = [...(base.data ?? []), ...(confirmed.data ?? [])] as Readonly<{ account_id: string }>[];
  const ids = [...new Set(matches.map(row => row.account_id))];
  if (ids.length === 0) return [];
  const [accounts, names] = await Promise.all([
    service.from("accounts").select("id,subdomain").in("id", ids),
    readPublicCostAccountNames(ids),
  ]);
  if (accounts.error || !names) return null;
  const term = query.toLocaleLowerCase("pt-BR");
  return ((accounts.data ?? []) as AccountRow[]).flatMap(row => {
    const name = names.get(row.id);
    return name?.toLocaleLowerCase("pt-BR").includes(term)
      ? [{ id: row.id, name, subdomain: readableCostAccountName(row.subdomain) }] : [];
  }).sort((left, right) => left.name.localeCompare(right.name, "pt-BR") || left.id.localeCompare(right.id))
    .slice(0, SUGGESTION_LIMIT);
}
