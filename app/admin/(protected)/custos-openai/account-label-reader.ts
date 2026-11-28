import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import { readableCostAccountName } from "./account-labels";
import type { OpenAiCostAccountOption } from "./action-core";

type AccountRow = Readonly<{ id: string; name: string | null; subdomain: string | null }>;
type ConfirmedNameRow = Readonly<{ account_id: string; business_display_name: string }>;
const PAGE_SIZE = 100;
const SUGGESTION_LIMIT = 12;

// Consumers authorize the administrative route before invoking these read-only projections.
export async function readConfirmedCostAccountNames(ids: readonly string[]): Promise<ReadonlyMap<string, string> | null> {
  const names = new Map<string, string>();
  if (ids.length === 0) return names;
  const service = createServiceClient();
  for (let start = 0; start < ids.length; start += PAGE_SIZE) {
    const batch = ids.slice(start, start + PAGE_SIZE);
    let offset = 0;
    while (true) {
      const { data, error } = await service.from("account_pending_setup_conversations")
        .select("account_id,business_display_name")
        .in("account_id", batch).eq("stage", "completed")
        .not("business_display_name", "is", null)
        .order("account_id").order("completed_at", { ascending: false }).order("id", { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);
      if (error || !data) return null;
      for (const row of data as ConfirmedNameRow[]) {
        const name = readableCostAccountName(row.business_display_name);
        if (name && !names.has(row.account_id)) names.set(row.account_id, name);
      }
      if (data.length < PAGE_SIZE || batch.every(id => names.has(id))) break;
      offset += PAGE_SIZE;
    }
  }
  return names;
}

export async function searchCostAccountNames(query: string): Promise<readonly OpenAiCostAccountOption[] | null> {
  const pattern = query.replace(/[\\%_]/g, "\\$&");
  const service = createServiceClient();
  const [accounts, confirmed] = await Promise.all([
    service.from("accounts").select("id,name,subdomain")
      .ilike("name", `%${pattern}%`).order("name").order("id").limit(SUGGESTION_LIMIT * 2),
    service.from("account_pending_setup_conversations").select("account_id")
      .eq("stage", "completed").ilike("business_display_name", `%${pattern}%`)
      .order("completed_at", { ascending: false }).order("id", { ascending: false }).limit(SUGGESTION_LIMIT * 3),
  ]);
  if (accounts.error && confirmed.error) return null;
  const candidates = new Map<string, AccountRow>(((accounts.data ?? []) as AccountRow[]).map(row => [row.id, row]));
  const matches = (confirmed.data ?? []) as Pick<ConfirmedNameRow, "account_id">[];
  const aliasIds = [...new Set(matches.map(row => row.account_id))].filter(id => !candidates.has(id));
  if (aliasIds.length > 0) {
    const result = await service.from("accounts").select("id,name,subdomain").in("id", aliasIds);
    for (const row of (result.data ?? []) as AccountRow[]) candidates.set(row.id, row);
  }
  const aliases = await readConfirmedCostAccountNames([...candidates.values()]
    .filter(row => !readableCostAccountName(row.name)).map(row => row.id));
  const term = query.toLocaleLowerCase("pt-BR");
  return [...candidates.values()].flatMap(row => {
    const name = readableCostAccountName(row.name) ?? aliases?.get(row.id);
    return name?.toLocaleLowerCase("pt-BR").includes(term)
      ? [{ id: row.id, name, subdomain: readableCostAccountName(row.subdomain) }] : [];
  }).sort((left, right) => left.name.localeCompare(right.name, "pt-BR") || left.id.localeCompare(right.id))
    .slice(0, SUGGESTION_LIMIT);
}
