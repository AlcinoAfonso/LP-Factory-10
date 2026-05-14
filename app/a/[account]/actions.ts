// app/a/[account]/actions.ts
'use server';
import 'server-only';

import { redirect } from 'next/navigation';
import { headers, cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

import { getAccessContext } from '@/lib/access/getAccessContext';
import {
  updateAccountNameCore,
  renameAccountNoStatus,
  setAccountStatusActiveIfPending,
} from '@/lib/access/adapters/accountAdapter';
import { upsertAccountProfileV1 } from '@/lib/access/adapters/accountProfileAdapter';
import { validateE10_4SetupForm } from '@/lib/onboarding/e10_4_setup_validation';
import {
  mapDecisionToResolutionStatus,
  updateAccountNicheResolutionAiResult,
  upsertAccountNicheResolution,
} from '../../../lib/onboarding/niche-resolution/adapters/accountNicheResolutionAdapter';
import {
  linkAccountTaxonomyFromDeterministicDecision,
  shouldLinkAccountTaxonomyFromDecision,
} from '../../../lib/onboarding/niche-resolution/adapters/accountTaxonomyAdapter';
import { matchBusinessTaxonsDeterministic } from '../../../lib/onboarding/niche-resolution/adapters/taxonMatchAdapter';
import {
  resolveNicheWithOpenAi,
  shouldResolveNicheWithAi,
} from '../../../lib/onboarding/niche-resolution/adapters/openAiResolver';
import { evaluateDeterministicTaxonMatch } from '../../../lib/onboarding/niche-resolution/deterministicConfidence';

export type RenameAccountState = {
  ok: boolean;
  error?: string;
};

export type SetupSaveState = {
  ok: boolean;
  fieldErrors?: Partial<{
    name: string;
    niche: string;
    preferred_channel: string;
    whatsapp: string;
    site_url: string;
  }>;
  formError?: string;
};

function slugifyName(input: string): string {
  const base = input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return base.length > 0 ? base : 'acc';
}

function validateNameForRename(name: unknown): string {
  const trimmed = (name ?? '').toString().trim();
  if (trimmed.length < 3) throw new Error('invalid_name_length');
  return trimmed;
}

export async function renameAccountAction(
  _prevState: RenameAccountState | undefined,
  formData: FormData
): Promise<RenameAccountState> {
  const t0 = Date.now();
  const hdrs = await headers();

  const requestId = hdrs.get('x-vercel-id') ?? hdrs.get('x-request-id') ?? null;
  const ip = hdrs.get('x-forwarded-for') ?? null;

  try {
    const accountId = formData.get('account_id')?.toString() ?? '';
    const userId = formData.get('user_id')?.toString() ?? undefined;
    const name = validateNameForRename(formData.get('name'));
    const slug = slugifyName(name);

    if (!accountId) throw new Error('missing_account_id');

    const ok = await renameAccountNoStatus(accountId, name, slug);
    const latency = Date.now() - t0;

    if (ok) {
      console.error(
        JSON.stringify({
          event: 'account_renamed',
          account_id: accountId,
          user_id: userId ?? null,
          latency_ms: latency,
          timestamp: new Date().toISOString(),
          request_id: requestId,
          ip,
        })
      );

      redirect(`/a/${slug}`);
    }

    console.error(
      JSON.stringify({
        event: 'account_rename_failed',
        error: 'adapter_returned_false',
        account_id: accountId,
        user_id: userId ?? null,
        latency_ms: latency,
        timestamp: new Date().toISOString(),
        request_id: requestId,
        ip,
      })
    );

    return { ok: false, error: 'Nao foi possivel renomear a conta. Tente novamente.' };
  } catch (err: unknown) {
    const latency = Date.now() - t0;

    console.error(
      JSON.stringify({
        event: 'account_rename_failed',
        error: err instanceof Error ? err.message : String(err),
        latency_ms: latency,
        timestamp: new Date().toISOString(),
        request_id: requestId,
        ip,
      })
    );

    return { ok: false, error: 'Nao foi possivel renomear a conta. Tente novamente.' };
  }
}

function normalizeText(input: unknown): string {
  return (input ?? '').toString().trim();
}

function extractAccountSubdomainFromReferer(referer: string | null): string | null {
  if (!referer) return null;
  try {
    const url = new URL(referer);
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts[0] !== 'a') return null;
    const sub = (parts[1] ?? '').trim().toLowerCase();
    if (!sub || sub === 'home') return null;
    return sub;
  } catch {
    return null;
  }
}

async function readLastAccountSubdomainCookie(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const v = cookieStore.get('last_account_subdomain')?.value ?? '';
    const sub = v.trim().toLowerCase();
    if (!sub || sub === 'home') return null;
    return sub;
  } catch {
    return null;
  }
}

export async function saveSetupAndContinueAction(
  _prevState: SetupSaveState | undefined,
  formData: FormData
): Promise<SetupSaveState> {
  const t0 = Date.now();
  const hdrs = await headers();

  const requestId =
    hdrs.get('x-vercel-id') ?? hdrs.get('x-request-id') ?? (globalThis.crypto?.randomUUID?.() ?? null);

  const formSubdomain = normalizeText(formData.get('account_subdomain')).toLowerCase();
  const refererSubdomain = extractAccountSubdomainFromReferer(hdrs.get('referer'));
  const cookieSubdomain = await readLastAccountSubdomainCookie();
  const accountSubdomain = formSubdomain || refererSubdomain || cookieSubdomain || '';
  const route = accountSubdomain ? `/a/${accountSubdomain}` : '/a';

  if (!formSubdomain && (refererSubdomain || cookieSubdomain)) {
    console.warn(
      JSON.stringify({
        scope: 'onboarding',
        event: 'setup_account_subdomain_fallback',
        source: refererSubdomain ? 'referer' : 'cookie',
        request_id: requestId,
        ts: new Date().toISOString(),
      })
    );
  }

  const nameRaw = formData.get('name');
  const nicheRaw = formData.get('niche');
  const preferredRaw = formData.get('preferred_channel');
  const whatsappRaw = formData.get('whatsapp');
  const siteUrlRaw = formData.get('site_url');

  try {
    if (!accountSubdomain) throw new Error('missing_account_subdomain');

    const ctx = await getAccessContext({
      params: { account: accountSubdomain },
      route,
      requestId: typeof requestId === 'string' ? requestId : undefined,
    });

    if (!ctx || ctx.blocked) {
      return { ok: false, formError: 'Nao foi possivel salvar agora. Tente novamente.' };
    }

    const accountId = (ctx.account?.id ?? ctx.account_id ?? null) as string | null;
    const memberRole = (ctx.member?.role ?? null) as string | null;

    if (!accountId) throw new Error('missing_account_id');

    if (memberRole !== 'owner' && memberRole !== 'admin') {
      return { ok: false, formError: 'Voce nao tem permissao para salvar esta configuracao.' };
    }

    console.log(
      JSON.stringify({
        scope: 'onboarding',
        event: 'setup_save_attempt',
        account_id: accountId,
        request_id: requestId,
        ts: new Date().toISOString(),
      })
    );

    const validated = validateE10_4SetupForm({
      accountSubdomain,
      name: nameRaw,
      niche: nicheRaw,
      preferred_channel: preferredRaw,
      whatsapp: whatsappRaw,
      site_url: siteUrlRaw,
    });

    const fieldErrors: SetupSaveState['fieldErrors'] = validated.fieldErrors;

    if (!validated.ok) {
      const latency = Date.now() - t0;

      console.warn(
        JSON.stringify({
          scope: 'onboarding',
          event: 'setup_save_failed',
          error_type: 'validation',
          invalid_fields: Object.keys(fieldErrors).filter((k) => (fieldErrors as any)[k]),
          account_id: accountId,
          request_id: requestId,
          latency_ms: latency,
          ts: new Date().toISOString(),
        })
      );

      return { ok: false, fieldErrors };
    }

    const okProfile = await upsertAccountProfileV1({
      accountId,
      niche: validated.values.niche,
      preferredChannel: validated.values.preferred_channel,
      whatsapp: validated.values.whatsapp,
      siteUrl: validated.values.site_url,
    });
    if (!okProfile) throw new Error('profile_upsert_failed');

    const okName = await updateAccountNameCore(accountId, validated.values.name);
    if (!okName) throw new Error('account_name_update_failed');

    const okStatus = await setAccountStatusActiveIfPending(accountId);
    if (!okStatus) throw new Error('status_update_failed');

    try {
      const taxonomyMatchStartedAt = Date.now();
      const candidates = await matchBusinessTaxonsDeterministic(validated.values.niche, 10);
      const decision = evaluateDeterministicTaxonMatch(candidates);
      const topCandidate = decision.selectedCandidate;

      const resolutionSaved = await upsertAccountNicheResolution({
        accountId,
        rawInput: validated.values.niche,
        selectedTaxonId: topCandidate?.taxonId ?? null,
        confidence: decision.confidence,
        shouldUseDeterministicMatch: decision.shouldUseDeterministicMatch,
        shouldEscalateToAi: decision.shouldEscalateToAi,
        aiEscalationMode: decision.aiEscalationMode,
        needsAdminReview: decision.needsAdminReview,
        reason: decision.reason,
        resolutionStatus: mapDecisionToResolutionStatus(decision),
        matchSource: topCandidate?.matchSource ?? null,
        score: topCandidate?.score ?? null,
      });

      if (!resolutionSaved) {
        console.warn(
          JSON.stringify({
            scope: 'onboarding',
            event: 'setup_taxonomy_resolution_persist_failed',
            error_type: 'non_blocking_niche_resolution_persist',
            request_id: requestId,
            latency_ms: Date.now() - taxonomyMatchStartedAt,
            ts: new Date().toISOString(),
          })
        );
      }

      const shouldLinkAccountTaxonomy = shouldLinkAccountTaxonomyFromDecision(decision);
      let accountTaxonomyLinkStatus: string = shouldLinkAccountTaxonomy
        ? 'not_attempted'
        : 'skipped_not_high_confidence';

      console.log(
        JSON.stringify({
          scope: 'onboarding',
          event: 'setup_account_taxonomy_link_evaluated',
          account_id: accountId,
          taxon_id: topCandidate?.taxonId ?? null,
          source_type: 'taxonomy_match',
          status: accountTaxonomyLinkStatus,
          reason: decision.reason,
          request_id: requestId,
          latency_ms: Date.now() - taxonomyMatchStartedAt,
          ts: new Date().toISOString(),
        })
      );

      if (shouldLinkAccountTaxonomy) {
        const linkResult = await linkAccountTaxonomyFromDeterministicDecision({
          accountId,
          decision,
        });
        accountTaxonomyLinkStatus = linkResult.status;

        const linkLogEvent =
          linkResult.status === 'saved'
            ? 'setup_account_taxonomy_link_saved'
            : linkResult.status === 'failed'
              ? 'setup_account_taxonomy_link_failed'
              : 'setup_account_taxonomy_link_skipped';

        const linkLogReason =
          linkResult.status === 'skipped_conflicting_primary'
            ? 'conflicting_primary'
            : linkResult.status === 'skipped_not_high_confidence'
              ? 'not_high_confidence'
              : linkResult.status;

        const linkLogPayload: Record<string, unknown> = {
          scope: 'onboarding',
          event: linkLogEvent,
          account_id: accountId,
          taxon_id: linkResult.taxonId,
          source_type: 'taxonomy_match',
          status: linkResult.status,
          reason: linkLogReason,
          request_id: requestId,
          latency_ms: Date.now() - taxonomyMatchStartedAt,
          ts: new Date().toISOString(),
        };

        if (linkResult.status === 'failed') {
          console.warn(JSON.stringify(linkLogPayload));
        } else {
          console.log(JSON.stringify(linkLogPayload));
        }
      }

      const aiEligible = shouldResolveNicheWithAi(decision);
      let aiResolutionStatus = aiEligible ? 'not_attempted' : 'skipped_not_eligible';
      let aiResolutionUxMode: string | null = null;
      let aiResolutionOptionsCount = 0;
      let aiResolutionNeedsAdminReview: boolean | null = null;
      let aiResolutionNeedsUserConfirmation: boolean | null = null;
      let aiResolutionPersisted = false;
      let aiResolutionErrorCode: string | null = null;

      if (aiEligible) {
        const aiResolutionStartedAt = Date.now();
        const aiResult = await resolveNicheWithOpenAi({
          rawInput: validated.values.niche,
          decision,
          candidates,
        });

        aiResolutionStatus = aiResult.status;

        if (aiResult.ok) {
          aiResolutionUxMode = aiResult.output.uxMode;
          aiResolutionOptionsCount = aiResult.output.options.length;
          aiResolutionNeedsAdminReview = aiResult.output.needsAdminReview;
          aiResolutionNeedsUserConfirmation = aiResult.output.needsUserConfirmation;
          aiResolutionPersisted = await updateAccountNicheResolutionAiResult({
            accountId,
            status: 'resolved',
            errorCode: null,
            model: aiResult.model,
            schemaVersion: aiResult.schemaVersion,
            result: aiResult.output,
            uxMode: aiResult.output.uxMode,
            suggestedTaxonId: aiResult.output.options[0]?.taxonId ?? null,
            suggestedNewTaxonLabel: aiResult.output.suggestedNewTaxonLabel,
            needsUserConfirmation: aiResult.output.needsUserConfirmation,
            needsAdminReview: aiResult.output.needsAdminReview,
            reason: aiResult.output.reason,
          });

          console.log(
            JSON.stringify({
              scope: 'onboarding',
              event: 'setup_taxonomy_ai_resolution_evaluated',
              status: aiResult.status,
              ux_mode: aiResult.output.uxMode,
              options_count: aiResult.output.options.length,
              needs_admin_review: aiResult.output.needsAdminReview,
              needs_user_confirmation: aiResult.output.needsUserConfirmation,
              should_create_official_link: aiResult.output.shouldCreateOfficialLink,
              persisted: aiResolutionPersisted,
              schema_version: aiResult.schemaVersion,
              request_id: requestId,
              latency_ms: Date.now() - aiResolutionStartedAt,
              ts: new Date().toISOString(),
            })
          );
        } else {
          const event =
            aiResult.status === 'skipped_missing_env'
              ? 'setup_taxonomy_ai_resolution_skipped'
              : 'setup_taxonomy_ai_resolution_failed';
          const persistedStatus = aiResult.status === 'failed' ? 'failed' : 'skipped';
          aiResolutionErrorCode = aiResult.reason;
          aiResolutionPersisted = await updateAccountNicheResolutionAiResult({
            accountId,
            status: persistedStatus,
            errorCode: aiResult.reason,
            model: aiResult.model,
            schemaVersion: aiResult.schemaVersion,
            result: null,
            uxMode: null,
            suggestedTaxonId: null,
            suggestedNewTaxonLabel: null,
            needsUserConfirmation: false,
            needsAdminReview: false,
            reason: aiResult.reason,
          });

          console.warn(
            JSON.stringify({
              scope: 'onboarding',
              event,
              status: aiResult.status,
              error_code: aiResolutionErrorCode,
              persisted: aiResolutionPersisted,
              schema_version: aiResult.schemaVersion,
              request_id: requestId,
              latency_ms: Date.now() - aiResolutionStartedAt,
              ts: new Date().toISOString(),
            })
          );
        }
      }

      console.log(
        JSON.stringify({
          scope: 'onboarding',
          event: 'setup_taxonomy_match_evaluated',
          candidates_count: candidates.length,
          confidence: decision.confidence,
          should_use_deterministic_match: decision.shouldUseDeterministicMatch,
          should_escalate_to_ai: decision.shouldEscalateToAi,
          ai_escalation_mode: decision.aiEscalationMode,
          needs_admin_review: decision.needsAdminReview,
          reason: decision.reason,
          resolution_saved: resolutionSaved,
          account_taxonomy_link_status: accountTaxonomyLinkStatus,
          ai_resolution_status: aiResolutionStatus,
          ai_resolution_ux_mode: aiResolutionUxMode,
          ai_resolution_options_count: aiResolutionOptionsCount,
          ai_resolution_needs_admin_review: aiResolutionNeedsAdminReview,
          ai_resolution_needs_user_confirmation: aiResolutionNeedsUserConfirmation,
          ai_resolution_persisted: aiResolutionPersisted,
          ai_resolution_error_code: aiResolutionErrorCode,
          top_match_source: topCandidate?.matchSource ?? null,
          top_score: topCandidate?.score ?? null,
          account_id: accountId,
          request_id: requestId,
          latency_ms: Date.now() - taxonomyMatchStartedAt,
          ts: new Date().toISOString(),
        })
      );
    } catch (err: unknown) {
      console.warn(
        JSON.stringify({
          scope: 'onboarding',
          event: 'setup_taxonomy_match_failed',
          error_type: 'non_blocking_taxonomy_match',
          error: err instanceof Error ? err.message : String(err),
          request_id: requestId,
          latency_ms: Date.now() - t0,
          ts: new Date().toISOString(),
        })
      );
    }

    const latency = Date.now() - t0;

    console.log(
      JSON.stringify({
        scope: 'onboarding',
        event: 'setup_completed',
        account_id: accountId,
        request_id: requestId,
        latency_ms: latency,
        ts: new Date().toISOString(),
      })
    );

    revalidatePath(route);

    console.log(
      JSON.stringify({
        scope: 'onboarding',
        event: 'setup_redirect',
        from: route,
        to: route,
        account_id: accountId,
        request_id: requestId,
        ts: new Date().toISOString(),
      })
    );

    redirect(route);
  } catch (err: unknown) {
    const latency = Date.now() - t0;

    if (
      err &&
      typeof err === 'object' &&
      'digest' in err &&
      String((err as any)?.digest ?? '').startsWith('NEXT_REDIRECT')
    ) {
      throw err;
    }

    console.error(
      JSON.stringify({
        scope: 'onboarding',
        event: 'setup_save_failed',
        error_type: 'system',
        error: err instanceof Error ? err.message : String(err),
        request_id: requestId,
        latency_ms: latency,
        ts: new Date().toISOString(),
      })
    );

    return { ok: false, formError: 'Nao foi possivel salvar agora. Tente novamente.' };
  }
}
