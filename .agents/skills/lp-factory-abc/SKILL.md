---
name: lp-factory-abc
description: Generate ABC delta-only updates for LP-Factory-10 canonical documentation. Use whenever the user asks to update, adjust, correct, or synchronize canonical documents based on a report, final report, implementation result, implementation history, PR summary, handoff, assessment, diagnosis, current branch, or plan-base execution. Also use for explicit ABC requests, DOC_ALVO updates, delta-only documentation patches, and triage of which canonical docs need updates among docs/base-tecnica.md, docs/schema.md, docs/roadmap.md, docs/design-system.md, docs/platform-config.md, docs/services.md, and docs/automations.md.
---

# LP Factory ABC v2

## Purpose

Generate a short, human, executable ABC for LP Factory 10 canonical documentation.

The output is delta-only: identify only the smallest changes required to reflect confirmed final state in the target document.

Before adding content, evaluate in this order:

1. remove;
2. adjust;
3. replace;
4. consolidate;
5. add only when necessary.

Default to `SEM ALTERACOES NECESSARIAS` when no permitted delta exists.

## Required Inputs

- Repository: `AlcinoAfonso/LP-Factory-10` or the current `LP-Factory-10` checkout.
- Reference: `main`, branch, commit, or current checkout. If not provided, use the current requested repo state.
- `DOC_ALVO`, when provided:
  - `docs/base-tecnica.md`
  - `docs/schema.md`
  - `docs/roadmap.md`
  - `docs/design-system.md`
  - `docs/platform-config.md`
  - `docs/services.md`
  - `docs/automations.md`
- Source material: final report, implementation result, implementation history, plan-base execution context, PR summary, branch diff, human briefing, or other explicit source.

If `DOC_ALVO` is missing, run triage first. If the source material is missing and cannot be reconstructed from the thread and repository evidence, stop and ask for the exact missing source.

## Source Modes

### Report Mode

Use when the user provides a final report, PR summary, handoff, explicit implementation result, or other consolidated source.

Treat the provided source as the main evidence, then compare it with `DOC_ALVO` and the current repo state.

### Implementation Mode

Use when the user asks for an ABC based on "this implementation", "this branch", "this plan-base execution", "what was implemented", or similar wording without a formal report.

Reconstruct evidence from:

- plan-base path and phase discussed in the thread, when available;
- current branch and commit range;
- files changed in `main...HEAD`;
- relevant git diff;
- commits created for the implementation;
- validations executed and results;
- implementation decisions explicitly made in the thread;
- current blockers, skipped validations, fallbacks, and residual risks.

Use reconstructed evidence only to identify confirmed final state. Do not treat attempts, intermediate errors, provisional ideas, or unvalidated assumptions as implemented or defined.

If the thread and repo evidence are insufficient to identify final state, stop and ask for the missing evidence.

## Mandatory Sources

Read:

1. source material;
2. current `DOC_ALVO`, when provided;
3. applicable structural source.

Structural source rules:

- For `docs/roadmap.md`, read `docs/template-roadmap.md` from the same requested ref before generating deltas.
- For other docs, use the document's own structure, current sections, relation to other docs, version/date, changelog, and any explicit local template or contract when present.
- Use structural sources to shape valid operations. Do not copy the template or structural source into the ABC output.

## Evidence Extraction

Extract only:

- implemented final state;
- defined final state;
- approved future decision;
- current pending item;
- permanent limit.

Ignore:

- hypothesis;
- unapproved proposal;
- operational history;
- superseded step;
- transient validation narrative;
- console narrative;
- branch, PR, merge, screenshot, or command detail unless it became a current pending item, permanent limit, or current requirement.

## Document Residency

Use one residence per subject. Do not duplicate canonical sources.

- `docs/roadmap.md`: cases, status, scope, decisions, pending items, dependencies, and final case artifacts.
- `docs/base-tecnica.md`: durable technical rules for future implementations.
- `docs/schema.md`: real database contract, DB objects, permissions, policies, functions, migrations, and grants.
- `docs/design-system.md`: visual contract, components, UI patterns, responsive behavior, and visual surfaces.
- `docs/platform-config.md`: external platforms, env var and secret names, URLs, endpoints, redirects, DNS, SMTP, GitHub Actions secrets, and redeploy/config rules.
- `docs/services.md`: deployable services, MCPs, service endpoints, deploy boundary, implementation location, consumers, dependencies, status, and service-level pending items.
- `docs/automations.md`: operational automations, workflows, jobs, agents, usage, inputs, expected responses, local runtime, dependencies, rules, learnings, and automation-level pending items.

Everything outside the selected `DOC_ALVO` residency is out of scope.

## Global Gates

- Docs describe current project state, not execution history.
- Replace old state with consolidated current state. Do not preserve superseded intermediate phases.
- Keep only executable deltas: `ADICIONAR`, `SUBSTITUIR`, or `REMOVER`, with the minimum target snippet.
- Do not include long justifications, lists of content not to include, report summaries, or already known context.
- Do not introduce secret values, PII, raw payloads, or volatile console details.
- Do not add content merely because it is new; add only when it belongs to `DOC_ALVO` and changes the durable documented state.

## Specific Gates

### `docs/roadmap.md`

Generate deltas only for case status, scope, dependencies, decisions, current pending items, approved future decisions, permanent limits, and created/adjusted/removed final artifacts.

Rules:

- Apply `docs/template-roadmap.md`.
- Respect report-indicated subsections when present.
- Do not create empty blocks.
- Do not list actions that did not occur.
- Use `N/A` only when the template requires it.
- In artifact records, use only names or paths.
- Do not record `docs/**` as artifacts.
- For records, include only DB objects and functional repo artifacts created, adjusted, or removed.
- Do not describe columns, policies, internal logic, file contents, implementation narrative, PRs, branches, commands, screenshots, or transient validations.
- Updates related to the case may appear only as short IDs in the existing roadmap pattern, without inventing categories or IDs.
- Before `SUBSTITUIR_SECAO`, verify the replacement does not remove approved future decisions, current pending items, or still-valid limits.

### `docs/base-tecnica.md`

Generate deltas only for durable, reusable technical rules that affect future implementations or safe deterministic planning.

Hard gate:

- Classify candidate content as `REGRA_TRANSVERSAL_REUTILIZAVEL` or `ESTADO_ESPECIFICO_DE_CASO`.
- Only `REGRA_TRANSVERSAL_REUTILIZAVEL` can enter `docs/base-tecnica.md`.
- If no reusable rule exists, output `SEM ALTERACOES NECESSARIAS`.

Do not add:

- case/phase status, PR, branch, validation evidence, screenshots, artifact state, counts, next step, pending product item, or case-specific decision;
- URL, env, secret, endpoint, dashboard config, DNS, or external platform detail, unless indispensable as a technical implementation rule;
- values or lists already defined in code, registry, schema, config, or other versioned canonical source.

When needed, record only the permanent rule and the path of the canonical source.

### `docs/schema.md`

Generate deltas only with real DB change and evidence from source material or repository state.

Allowed content:

- tables, columns, constraints, enums, relationships, views, RPCs/functions, triggers, RLS/policies, grants, migrations, and minimum Supabase validation notes.

Rules:

- For confirmed RPCs/functions, record signature, security, `search_path`, grants, and stable behavior.
- Evidence must show an applied or intended schema-changing artifact, such as migration, SQL that changes schema, or Supabase confirmation.
- Use TBD only for missing detail on a DB object that already exists, with a validation path.

### Other Docs

- `docs/design-system.md`: current visual standards, active UI components, usage rules, responsive behavior, and consolidated visual surfaces. Avoid file inventory when roadmap already records artifacts.
- `docs/platform-config.md`: external configuration and platform contract. Never include real secret values; record only name, purpose, platform, and environment scope.
- `docs/services.md`: reusable deployable service/MCP inventory and service-level operation. Do not include consumer automation details or general platform inventory.
- `docs/automations.md`: consumer automations, recurring workflows, agents, jobs, and operational rules. Secrets/envs/endpoints/workflows may appear only as short dependency references.

## Operations

Permitted operation types:

- `SUBSTITUIR_TRECHO`
- `SUBSTITUIR_SECAO`
- `ADICIONAR_TRECHO`
- `ADICIONAR_SECAO`
- `REMOVER_TRECHO`
- `REMOVER_SECAO`

Rules:

- Prefer TRECHO: line, bullet, short paragraph, or small stable block.
- Use SECAO only for structural change.
- Addition requires a clear anchor.
- For TRECHO operations, use the section where the snippet enters or leaves.
- For `ADICIONAR_SECAO`, use the immediately preceding section at the same level when one exists.
- If the anchor is unclear in `DOC_ALVO`, do not generate the addition.
- `CONTEUDO` must be literal and must not use ellipses (`...`).

## Version And Changelog

- Version, date, and changelog change only with a real document delta.
- A real document delta is at least one operation that is not header/versioning and not changelog.
- Changelog receives only the new entry.
- Changelog does not enter `OPERACOES`.

## Output Format

Use `America/Sao_Paulo` time.

When emitting an ABC for a `DOC_ALVO`, the answer must start exactly with:

```text
DD/MM/YYYY HH:MM - ABC (DELTA-ONLY) para <DOC_ALVO>
```

With `DOC_ALVO`:

```text
DD/MM/YYYY HH:MM - ABC (DELTA-ONLY) para <DOC_ALVO>
DOC_ALVO: <DOC_ALVO>
```

With no permitted deltas:

```text
DD/MM/YYYY HH:MM - ABC (DELTA-ONLY) para <DOC_ALVO>
DOC_ALVO: <DOC_ALVO>
SEM ALTERACOES NECESSARIAS
```

With permitted deltas:

```text
DD/MM/YYYY HH:MM - ABC (DELTA-ONLY) para <DOC_ALVO>
DOC_ALVO: <DOC_ALVO>
VERSAO_NOVA: <vX.Y.Z>
DATA_NOVA: <DD/MM/YYYY>

OPERACOES

OP1)
TIPO: <operacao>
ALVO: <alvo>
ANCORA: <ancora, somente quando aplicavel>
CONTEUDO:
<conteudo literal>

CHANGELOG

CH1)
<nova entrada>
```

Omit `VERSAO_NOVA`, `DATA_NOVA`, and `CHANGELOG` when there is no real document delta.

## Triage Without DOC_ALVO

When `DOC_ALVO` is not provided, start with:

```text
TRIAGEM
```

Then:

- list only documents with permitted deltas;
- include a short reason for each listed document;
- do not list documents with no delta unless the user asks for the full audit;
- emit one complete independent ABC block per document with deltas;
- do not mix versions, operations, or changelogs across documents.

## Mandatory Pause

Run the complete cycle only for the current `DOC_ALVO`, except when:

- the flow starts with triage;
- the user explicitly asks for multiple documents.

After emitting output, stop and wait for the next `DOC_ALVO`, except when triage or explicit instruction requires multiple ABC blocks.

## Verification Checklist

Before final output, verify:

- `DOC_ALVO` was read from the requested source/ref.
- Applicable structural source was read.
- Each proposed delta belongs to the selected document residency.
- No secret value, PII, raw payload, or volatile console narrative was introduced.
- Header/date/version/changelog changes exist only when there is a real document operation.
- The output contains only executable delta content or `SEM ALTERACOES NECESSARIAS`.
