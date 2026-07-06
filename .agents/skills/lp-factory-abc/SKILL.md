---
name: lp-factory-abc
description: Generate ABC delta-only updates for LP-Factory-10 canonical documentation. Use when the user asks for an ABC, DOC_ALVO update, delta-only documentation patch, or conversion of a final report/implementation result into updates for docs/base-tecnica.md, docs/schema.md, docs/roadmap.md, docs/design-system.md, docs/platform-config.md, docs/services.md, or docs/automations.md. Also use when the user asks to triage which canonical docs need ABCs.
---

# LP Factory ABC

## Purpose

Generate the human ABC for LP Factory 10 canonical documentation.

The output is delta-only. It must identify only the changes needed to reflect confirmed final state in the selected target document.

## Required Inputs

- Repository: `LP-Factory-10`.
- Reference: `main`, branch, commit, or the current checkout. If not provided, use the current requested repo state.
- `DOC_ALVO`: one of:
  - `docs/base-tecnica.md`
  - `docs/schema.md`
  - `docs/roadmap.md`
  - `docs/design-system.md`
  - `docs/platform-config.md`
  - `docs/services.md`
  - `docs/automations.md`
- Source material: final report, implementation result, implementation history, plan-base execution context, PR summary, branch diff, human briefing, or other explicit source.

If the source material is missing and cannot be reconstructed from the current thread and repository evidence, stop and ask for it. If `DOC_ALVO` is missing, run the multi-document triage first.

## Source Modes

Use one of two source modes.

### Report Mode

Use Report Mode when the user provides a final report, PR summary, handoff, explicit implementation result, or other consolidated source.

Treat the provided source as the main evidence, then compare it against the requested `DOC_ALVO` and the current repo state.

### Implementation Mode

Use Implementation Mode when the user asks for an ABC based on "this implementation", "this branch", "this plan-base execution", "what was implemented", or similar wording without providing a formal final report.

In Implementation Mode, reconstruct the source material from the current thread and repository evidence:

- plan-base path and phase discussed in the thread, when available;
- current branch and commit range;
- files changed in `main...HEAD`;
- relevant git diff for changed files;
- commits created for the implementation;
- validations executed and their results;
- implementation decisions explicitly made in the thread;
- current known blockers, skipped validations, fallbacks, and residual risks.

Use this reconstructed evidence only to identify confirmed final state. Do not treat attempts, intermediate errors, provisional ideas, or unvalidated assumptions as implemented or defined.

If the current thread and repo evidence are insufficient to identify the implemented/defined final state, stop and ask for the exact missing evidence instead of generating a weak ABC.

## Content Residency

- `docs/schema.md`: database contract, DB objects and DB permissions.
- `docs/base-tecnica.md`: runtime technical contract and rules for safe implementation.
- `docs/roadmap.md`: final state of E* cases, including status, scope, dependencies, decisions, pending items, and linked structures/artifacts.
- `docs/design-system.md`: current product visual contract, UI patterns, components, visual surfaces, and usage rules.
- `docs/platform-config.md`: operational platform contract, env vars, secrets by name only, URLs, endpoints, redirects, DNS, and external configuration.
- `docs/services.md`: human catalog of deployable services, MCPs, service endpoints, reusable infrastructure with its own identity, deploy boundaries, and main consumers.
- `docs/automations.md`: operational automations catalog, human use, status, dependencies, consumer components, operational rules, and automation learnings.

## Global Anti-Inflation Rules

- Use one content residence per subject.
- Do not duplicate guardrails or lists already covered by a dedicated repo contract. In docs, keep only a one-line objective, paths, and reference when needed.
- Everything outside the selected `DOC_ALVO` residency is out of scope.
- Docs describe current project state. Historical evolution belongs only in changelog when the document has a changelog.
- When updating a section, replace old state with consolidated current state. Do not preserve superseded intermediate phases.
- Platform configuration, envs, secrets, endpoints, official URLs, redirects, DNS, and external parameters belong in `docs/platform-config.md`; `docs/base-tecnica.md` should keep only technical implementation rules and short references when necessary.
- Deployable services, MCPs, and reusable infrastructure with their own identity belong in `docs/services.md`; consumer automations belong in `docs/automations.md`; operational platform configuration belongs in `docs/platform-config.md`.
- Operational automations, their uses, status, inputs, expected responses, execution rules, and learnings belong in `docs/automations.md`; platform configs belong in `docs/platform-config.md`; reusable services/MCPs belong in `docs/services.md`.

## Base Tecnica Relevance

Generate a delta for `docs/base-tecnica.md` only if the change affects:

- how AI should generate correct code; or
- how AI should build a safe, deterministic execution plan.

Do not add a novelty to `docs/base-tecnica.md` if it has no implementation impact. When adding content there, record only stable rule, contract, or parameter. Do not include console narrative or volatile detail.

Do not generate a `docs/base-tecnica.md` delta only to record a URL, env, secret, endpoint, external project, dashboard configuration, or DNS. Those belong to `docs/platform-config.md`, except when the information is indispensable as a technical implementation rule.

## Reading Rules

1. Open `DOC_ALVO` at the requested source/ref.
2. Identify in `DOC_ALVO`:
   - document function;
   - relation to other documents;
   - existing sections;
   - structural pattern;
   - version/date, when present;
   - changelog, when present.
3. If `DOC_ALVO` does not have an explicit function or document-relation section, use this skill's content residency and allowlists as the source of documentary residency.
4. When `DOC_ALVO` is `docs/roadmap.md`, read `docs/template-roadmap.md` from the same requested ref before comparing or generating deltas. Use it as the structural authority for roadmap hierarchy, recorte layout, registros do recorte, artifact/update registration, and anti-inflation rules. Do not copy the template into the ABC output; use it only to shape valid operations.

## Allowlists By DOC_ALVO

### `docs/base-tecnica.md` - CONTRATO_TECNICO

ENTRA:

- permanent technical product rules;
- safe implementation standards;
- runtime;
- security such as PII, secrets, and minimum permission;
- SSR;
- adapters;
- imports;
- layers and boundaries;
- validation;
- safe logs;
- stable minimum observability;
- integrations with fixed parameters;
- mandatory repo conventions;
- stable, normative, reusable architecture decisions that apply to future implementations beyond the immediate case.

NAO ENTRA:

- E* case status, phase, PR, branch, merge, validation evidence, screenshots, artifact state, pilot taxon, record counts, next step, phase out-of-scope, product pending items, decisions that only explain a specific delivery, or items belonging to DB/schema, roadmap/cases, design system, platform config, services, or automations.

Rules:

- If the information answers "what this case/phase delivered, validated, decided, or left for later", it belongs in `docs/roadmap.md`.
- A case decision enters `docs/base-tecnica.md` only when it becomes a durable technical standard for future implementations.
- DB objects and permissions belong in `docs/schema.md`; platforms/env/secrets belong in `docs/platform-config.md`; automations and operational flows belong in `docs/automations.md`; E* status, scope, decisions, and phases belong in `docs/roadmap.md`.

### `docs/schema.md` - CONTRATO_DB

ENTRA:

- tables;
- columns;
- constraints;
- enums;
- relationships;
- views;
- RPCs/functions;
- triggers;
- RLS/policies;
- grants;
- minimum Supabase validation notes.

Rules:

- For confirmed RPCs/functions, record signature, security, `search_path`, grants, and stable behavior.
- The source report must include observable DB execution evidence: applied migration, SQL that changes schema, or Supabase confirmation.
- Use TBD only for missing detail on a DB object that already exists in Supabase, with a validation path.

NAO ENTRA:

- runtime/base-tecnica items, roadmap/cases, design system, platform config, services, or automations.

### `docs/roadmap.md` - CONTRATO_DE_CASOS

ENTRA:

- status with date;
- short final-scope bullets;
- dependencies between E* cases;
- explicit decisions;
- pending items marked in the report;
- structures/artifacts linked to the final case state.

Rules:

- Planning, in-progress, or partially implemented cases preserve debates, plans, provisional decisions, work in progress, missing items, and next steps.
- In that stage, do not change header, version, or changelog and do not mark the case as implemented or complete.
- Only when the full case or an autonomous slice is fully implemented and validated should the roadmap remove closed debates, consumed operational plans, unapproved hypotheses, and superseded provisional content.
- Preserve approved future decisions, current pending items, permanent limits, and already classified evolutions.
- For implemented cases, phases, or autonomous slices, roadmap body must be a current-state snapshot, not execution narrative.
- Do not copy PR, branch, merge commit, commands, screenshots, intermediate bugs, or transient validations unless they became a current pending item, permanent limit, or current requirement.
- Use "E" only in the main case title; subitems should not repeat "E".
- Structures and artifacts: record only DB objects and functional repo artifacts created, adjusted, or removed. Do not record `docs/**`, because docs are `DOC_ALVO`, source, or documentary patch.
- Categories:
  - Banco - Criados, Ajustados e Removidos
  - Repositorio - Criados, Ajustados e Removidos
- Updates: when the report brings applied, approved, or related updates in an already identified project pattern, record only the short ID reference in the existing roadmap format, for example: `Updates futuros ja aprovados relacionados: prod#3, vercel#8`.
- Do not convert updates into free platform categories, narrate operational execution, or invent missing IDs.
- Concision: record only names or paths, without describing columns, policies, internal logic, file contents, or implementation narrative.
- Omit empty categories and do not create the section when the report has no applicable structures or artifacts.
- DB object and permission details belong in `docs/schema.md`; technical implementation rules belong in `docs/base-tecnica.md`.
- When shaping roadmap deltas, apply `docs/template-roadmap.md` for hierarchy, recorte structure, registros placement, and anti-inflation constraints.

NAO ENTRA:

- detailed DB inventory, runtime rules, platform configuration, services catalog, automations catalog, or visual standards.

### `docs/design-system.md` - CONTRATO_VISUAL

ENTRA:

- current visual standards;
- active UI components;
- usage rules;
- responsive behavior;
- consolidated visual surfaces.

Rules:

- When citing surfaces, describe behavior or visual standard.
- Avoid file inventory if roadmap already contains it.

NAO ENTRA:

- roadmap/cases, DB/schema, runtime/base-tecnica, platform config, services, or automations.

### `docs/platform-config.md` - CONTRATO_OPERACIONAL_DE_PLATAFORMAS

ENTRA:

- platforms used by the project;
- external projects/environments;
- public variables;
- server-side secrets by name only;
- flags;
- official endpoints;
- production/preview URLs;
- redirects;
- SMTP;
- DNS/domain;
- GitHub Actions secrets;
- operational configuration and redeploy rules.

Rules:

- Never include real secret values. Record only variable name, purpose, platform, and environment scope.

NAO ENTRA:

- runtime/base-tecnica, DB/schema, roadmap/cases, design system, services, or automations.

### `docs/services.md` - CONTRATO_DE_SERVICES

ENTRA:

- deployable services;
- MCPs;
- service endpoints;
- service objective;
- canonical implementation;
- local technical README;
- operational deploy boundary;
- main consumers;
- direct dependencies;
- operational status;
- operational pending items linked to the service itself.

Rules:

- Endpoint/project appears only as service identification.
- Consolidated operational inventory belongs in `docs/platform-config.md`.

NAO ENTRA:

- consumer automations, general platform configs/secrets/envs, technical runtime rules, DB objects, E* case status, or visual standards.

### `docs/automations.md` - CONTRATO_DE_AUTOMACOES

ENTRA:

- operational automations;
- catalog;
- objective;
- status;
- human access;
- how to use;
- operational inputs;
- expected response;
- local runtime;
- local README;
- consumer workflow;
- consumer components;
- direct dependencies;
- operational rules;
- pre-merge execution standards;
- learnings;
- pending items linked to the automation.

Rules:

- Secrets/envs/endpoints/workflows may appear only as short dependency references.
- Consolidated inventory belongs in `docs/platform-config.md`.

NAO ENTRA:

- platform configs, secrets by name, canonical envs, canonical endpoints, consolidated workflow list, reusable services/MCPs, technical runtime rules, DB objects, E* status, or visual standards.

## Extraction Rules: Report To Final State

Extract only content clearly marked or evidenced as final state: IMPLEMENTED or DEFINED.

Handle future content by condition:

- unapproved proposal: ignore;
- approved future decision: preserve;
- superseded operational next step: remove;
- current future evolution: preserve.

Hypotheses and assumptions to validate remain outside final state.

## Comparison Rules

Identify only deltas that are necessary to reflect final state and are allowed by the selected `DOC_ALVO` allowlist.

If there is no permitted delta, output `SEM ALTERACOES NECESSARIAS`.

## ABC Generation

Classify each delta by the smallest stable block possible.

Permitted operation types:

- `SUBSTITUIR_TRECHO` (`replace_snippet`)
- `SUBSTITUIR_SECAO` (`replace_section`)
- `ADICIONAR_TRECHO` (`insert_snippet_after_anchor`)
- `ADICIONAR_SECAO` (`insert_after_section`)
- `REMOVER_TRECHO` (`remove_snippet`)
- `REMOVER_SECAO` (`remove_section`)

Usage rules:

- Prefer TRECHO: line, bullet, short paragraph, or small stable block.
- Use SECAO only when the section structure needs to be rebuilt.
- Before `SUBSTITUIR_SECAO` in `docs/roadmap.md`, verify that the replacement does not eliminate approved future decisions, current pending items, or still-valid limits.

Anchor rules:

- For TRECHO operations, use the section where the snippet enters or leaves.
- For `ADICIONAR_SECAO`, use the immediately preceding section at the same level when one exists.
- If the anchor is unclear in `DOC_ALVO`, do not generate an addition operation.

The briefing must contain only executable deltas: ADICIONAR, SUBSTITUIR, or REMOVER, with the minimum target snippet. Do not include report, long justifications, lists of content not to include, or already known context.

## Version And Changelog Rules

- `99. Changelog` does not enter OPERACOES.
- Header/date/version and CHANGELOG change only if there is a real document change.
- Real document change means at least one operation exists that is not header/versioning and not section 99.
- In CHANGELOG, include only the new entry.

## Mandatory Output Format

The answer must start exactly with:

```text
DD/MM/YYYY HH:MM - ABC (DELTA-ONLY) para <DOC_ALVO>
```

Use the `America/Sao_Paulo` timezone.

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

OPERACOES (emitir apenas as necessarias)

OP1)
TIPO: <um dos tipos permitidos>
ALVO: <secao/titulo/identificador do alvo>
ANCORA: <secao ancora> (somente quando aplicavel)
CONTEUDO:
<bloco literal correspondente a operacao>

CHANGELOG (somente se houver alteracao real)
CH1) (entrada nova)
<bloco literal da entrada nova do changelog>
```

Block rules:

- Do not use ellipses (`...`) in `CONTEUDO`.
- In TRECHO operations, provide only the minimum stable and explicit snippet.
- In SECAO operations, start at the numbered section heading line and preserve line breaks and bullets.

## Multi-Document Triage

When the report does not define `DOC_ALVO`, first evaluate all permitted `DOC_ALVO` values and list:

- documents needing ABC;
- short reason for the delta;
- documents not needing ABC, with short reason.

Then generate ABC only for documents with permitted deltas.

If multiple documents have deltas, emit one complete and independent ABC block per document. Do not mix operations, versions, or changelogs.

## Mandatory Pause: One DOC Per Execution

Run the complete cycle only for the current `DOC_ALVO`, except when the flow starts with multi-document triage or the user explicitly asks for ABCs for multiple documents.

After emitting output, stop and wait for the next `DOC_ALVO`, except when prior triage identifies multiple documents with permitted deltas or the user explicitly requests multiple documents.

For multiple `DOC_ALVO` cases, emit one complete ABC block per document, keeping each block independent and without mixing operations, versions, or changelogs.

## Verification Checklist

Before final output, verify:

- `DOC_ALVO` was read from the requested source/ref.
- Each proposed delta belongs to the selected document residency.
- No secret value, PII, raw payload, or volatile console narrative was introduced.
- Header/date/version/changelog changes exist only when there is a real document operation.
- The output contains only executable delta content or `SEM ALTERACOES NECESSARIAS`.
