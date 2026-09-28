import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type {
  CommunicationBase,
  CommunicationBaseResult,
  CommunicationSection,
  CommunicationSectionValue,
} from "../contracts";
import { selectPendingSetupBusinessContext, selectPendingSetupInitialContext, type PendingSetupInitialContext } from "../pending-setup-import";
import { isE1011PassageEnabled } from "../../onboarding/pending-setup/config";
import {
  parseStoredSections,
  projectCommunicationBase,
  withSection,
} from "../policy";

const COLUMNS = "account_id,sections_json,version,created_at,updated_at";

type BaseRow = Readonly<{
  account_id: string;
  sections_json: unknown;
  version: number;
  created_at: string;
  updated_at: string;
}>;

export async function readCommunicationBase(
  accountId: string,
): Promise<CommunicationBaseResult<CommunicationBase | null>> {
  if (!accountId) return { ok: false, error: "invalid" };
  try {
    const client = await createClient();
    const { data, error } = await client
      .from("account_communication_bases")
      .select(COLUMNS)
      .eq("account_id", accountId)
      .limit(1)
      .maybeSingle();
    if (error) return { ok: false, error: "read_failed" };
    if (!data) return { ok: true, value: null };
    const base = projectCommunicationBase(data as BaseRow);
    return base ? { ok: true, value: base } : { ok: false, error: "read_failed" };
  } catch {
    return { ok: false, error: "read_failed" };
  }
}

export async function readPendingSetupBusinessContext(
  accountId: string,
): Promise<CommunicationBaseResult<string | null>> {
  if (!accountId) return { ok: false, error: "invalid" };
  try {
    const { data, error } = await createServiceClient()
      .from("account_pending_setup_conversations")
      .select("business_context_text,stage,completed_at")
      .eq("account_id", accountId)
      .eq("stage", "completed")
      .not("completed_at", "is", null)
      .limit(2);
    if (error) return { ok: false, error: "read_failed" };
    return { ok: true, value: selectPendingSetupBusinessContext(data) };
  } catch {
    return { ok: false, error: "read_failed" };
  }
}

export async function readPendingSetupInitialContext(
  accountId: string,
): Promise<CommunicationBaseResult<PendingSetupInitialContext | null>> {
  if (!accountId) return { ok: false, error: "invalid" };
  if (!isE1011PassageEnabled()) {
    const legacy = await readPendingSetupBusinessContext(accountId);
    return legacy.ok
      ? { ok: true, value: legacy.value ? { businessName: null, businessContext: legacy.value } : null }
      : legacy;
  }
  try {
    const { data, error } = await createServiceClient()
      .from("account_pending_setup_conversations")
      .select("business_display_name,business_context_text,stage,completed_at")
      .eq("account_id", accountId)
      .eq("stage", "completed")
      .not("completed_at", "is", null)
      .limit(2);
    if (error) return { ok: false, error: "read_failed" };
    return { ok: true, value: selectPendingSetupInitialContext(data) };
  } catch {
    return { ok: false, error: "read_failed" };
  }
}

export async function createCommunicationBase(
  accountId: string,
  initialSections: Record<string, unknown> = {},
): Promise<CommunicationBaseResult<CommunicationBase>> {
  if (!accountId || !parseStoredSections(initialSections)) {
    return { ok: false, error: "invalid" };
  }
  try {
    const service = createServiceClient();
    const { data, error } = await service
      .from("account_communication_bases")
      .insert({ account_id: accountId, sections_json: initialSections })
      .select(COLUMNS)
      .single();
    if (error) {
      if (error.code === "23505") {
        const latest = await readWithService(accountId);
        return latest ?? { ok: false, error: "read_failed" };
      }
      return { ok: false, error: "write_failed" };
    }
    const base = projectCommunicationBase(data as BaseRow);
    return base ? { ok: true, value: base } : { ok: false, error: "read_failed" };
  } catch {
    return { ok: false, error: "write_failed" };
  }
}

export async function saveCommunicationSection(input: Readonly<{
  accountId: string;
  key: string;
  value: CommunicationSectionValue;
  expectedVersion: number;
  origin: CommunicationSection["origin"];
}>): Promise<CommunicationBaseResult<CommunicationBase>> {
  if (!input.accountId || !Number.isInteger(input.expectedVersion) || input.expectedVersion <= 0) {
    return { ok: false, error: "invalid" };
  }
  try {
    const service = createServiceClient();
    const { data: current, error: readError } = await service
      .from("account_communication_bases")
      .select(COLUMNS)
      .eq("account_id", input.accountId)
      .limit(1)
      .maybeSingle();
    if (readError) return { ok: false, error: "read_failed" };
    if (!current || current.version !== input.expectedVersion) {
      return { ok: false, error: "conflict" };
    }
    const sections = parseStoredSections(current.sections_json);
    if (!sections) return { ok: false, error: "read_failed" };
    const next = withSection(sections, input.key, input.value, input.origin);
    if (!next) return { ok: false, error: "invalid" };

    const { data, error } = await service
      .from("account_communication_bases")
      .update({
        sections_json: next,
        version: input.expectedVersion + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("account_id", input.accountId)
      .eq("version", input.expectedVersion)
      .maxAffected(1)
      .select(COLUMNS)
      .maybeSingle();
    if (error) return { ok: false, error: "write_failed" };
    if (!data) return { ok: false, error: "conflict" };
    const base = projectCommunicationBase(data as BaseRow);
    return base ? { ok: true, value: base } : { ok: false, error: "read_failed" };
  } catch {
    return { ok: false, error: "write_failed" };
  }
}

async function readWithService(
  accountId: string,
): Promise<CommunicationBaseResult<CommunicationBase> | null> {
  const { data, error } = await createServiceClient()
    .from("account_communication_bases")
    .select(COLUMNS)
    .eq("account_id", accountId)
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  const base = projectCommunicationBase(data as BaseRow);
  return base ? { ok: true, value: base } : null;
}
