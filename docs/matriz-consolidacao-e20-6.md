# Matriz de consolidação — E20.6 — Liberação e revisão factual de taxons

## 1. Referências imutáveis

- Fonte funcional: Google Doc `Debate 12 — Evolução da revisão factual e UX administrativa da E20 — LP Factory 10`, documento `1XxMtfz_W0pTEWKiwQ00JIzrjQMC64fIAT40bIJpGZ5w`, revisão `ANLCKQl7xrJb-Wnad68kW00rg7fezszGop5fqv1nZRlzYfvt62xkp8mWMJkldGi3-KuPHUi4Ukdo_D0vNyg8J1H1Y2c788pikhljBOrjHhw`, seções 4.1–4.10.
- V1 congelada: commit `ed5d43654772bf7abd3cc5681db25cfd332fce1d`, blob `76d5ae3fff5b4361989552bf0257c51bacfd2996`, path `docs/lousa-plano-base-e20-6.md`.
- V2 inicial da Passagem 1: commit `b5133b78530d1795a44642ea18ab622432870535`, blob `99287bea354e5363bcaa88bba2af96b283c0a261`, mesmo path.
- V2 corrigida: commit `ce7b7a0d117c3a7afd3cd31e5e5840d37c595782`, blob `aa83d155a60f1f20f10a4b52279095220f7741ed`, mesmo path.
- Base e roadmap-base: `origin/main@71bd3041a8c59a0922fc5aa1c5344de8cf1a66dc`, blob `2284269cd4c7c281deb57c3db9d0e7930bb360d6` de `docs/roadmap.md`.
- PR único: `#936`, draft, base `main`, branch `codex-app/e20-6-liberacao-revisao-factual`.
- Plano conceitual: N/A. Confrontos estruturais de modernização: N/A, pois nenhum update aprovado teve impacto estrutural material.

## 2. Obrigações funcionais da V1

| ID | Origem | Classe | Tratamento | Localização/evidência | Destino de update | Confronto estrutural |
| --- | --- | --- | --- | --- | --- | --- |
| V1-E206-01 | v1 | derivação técnica da v1 | Manter catálogo factual único, publicado e plan-neutral | V2 5.1, 5.2 e 5.8 | N/A | N/A |
| V1-E206-02 | v1 | derivação técnica da v1 | Fixar cinco `value_scope` e rejeitar sexta categoria | V1 4.4/4.8; V2 5.2 e 5.8 | N/A | N/A |
| V1-E206-03 | v1 | derivação técnica da v1 | Novos usos selecionam internamente a versão publicada corrente | V2 5.2 e 5.11 | N/A | N/A |
| V1-E206-04 | v1 | derivação técnica da v1 | Preservar usos anteriores sem sincronização ou efeito retroativo | V2 5.6 e 5.9 | N/A | N/A |
| V1-E206-05 | v1 | derivação técnica da v1 | Criar todo novo taxon inativo e liberar somente por decisão humana | V2 5.3 | N/A | N/A |
| V1-E206-06 | v1 | derivação técnica da v1 | Permitir liberação sem OpenAI, pesquisa ou justificativa textual | V2 5.3 e 5.4 | N/A | N/A |
| V1-E206-07 | v1 | derivação técnica da v1 | Manter IA opcional, consultiva e transitória | V2 5.4 e 5.5 | N/A | N/A |
| V1-E206-08 | v1 | derivação técnica da v1 | Preferir E20.5 válida e usar Web Search controlada no fallback/focal | V2 5.5 | N/A | N/A |
| V1-E206-09 | v1 | derivação técnica da v1 | Encaminhar somente candidatos aceitos ao lifecycle humano E20.2 | V2 5.4 e 5.8 | N/A | N/A |
| V1-E206-10 | v1 | derivação técnica da v1 | Suportar add/edit/inactivate/reactivate preservando identidade e história | V2 5.8 | N/A | N/A |
| V1-E206-11 | v1 | derivação técnica da v1 | Manter taxon ativo durante revisão voluntária e publicação | V2 5.6 | N/A | N/A |
| V1-E206-12 | v1 | derivação técnica da v1 | Entregar página única com hierarquia e próprios/herdados | V2 5.7 | `prod#14`, `prod#16`, `prod#17` | N/A |
| V1-E206-13 | v1 | derivação técnica da v1 | Preservar workload E21, limites Responses API e zero retry | V2 5.5 | N/A | N/A |
| V1-E206-14 | v1 | derivação técnica da v1 | Não criar consumidor, snapshot, sessão, storage, infraestrutura ou E20.7 ativa | V2 5.1 e 5.9 | N/A | N/A |
| V1-E206-15 | v1 | derivação técnica da v1 | Não apagar versões, marcadores, evidências, decisões ou pesquisas históricas | V2 5.2 e 5.9 | N/A | N/A |
| V1-E206-16 | v1 | derivação técnica da v1 | Preservar somente as fases 20.6.3–20.6.7 | V2 5.3–5.7 e 5.11 | N/A | N/A |

## 3. Achados do Gestor Estrutural

| ID | Origem | Classe | Tratamento | Localização/evidência | Destino de update | Confronto estrutural |
| --- | --- | --- | --- | --- | --- | --- |
| GE-E20.6-01 | invariante técnico | derivação técnica da v1 | Criar projeção operacional corrente plan-neutral e isolar resolver histórico por plano | V2 5.2; contratos/validators `input-catalog` | N/A | N/A |
| GE-E20.6-02 | invariante técnico | derivação técnica da v1 | Retirar evidência, blocker e coordenação por taxon da publicação E20.2 | V2 5.8; `adminInputCatalogLifecycle*` | N/A | N/A |
| GE-E20.6-03 | invariante técnico | derivação técnica da v1 | Substituir gravação de marcador por liberação CAS que altera somente `is_active` | V2 5.3; adapter focal E20.6 | N/A | N/A |
| GE-E20.6-04 | invariante técnico | derivação técnica da v1 | Eliminar reabertura/invalidação automática de taxon ativo | V2 5.6 e 5.8 | N/A | N/A |
| GE-E20.6-05 | invariante técnico | derivação técnica da v1 | Permitir reativação forward-only e proteger identidade semântica | V2 5.8 e 5.11 | N/A | N/A |
| GE-E20.6-06 | invariante técnico | derivação técnica da v1 | Tornar contexto IA plan-neutral e admitir taxon servido inativo no modo administrativo | V2 5.5 | N/A | N/A |
| GE-E20.6-07 | invariante técnico | derivação técnica da v1 | Reutilizar provider, runtime gate, transporte, parser e E21 | V2 5.5 e 5.9 | N/A | N/A |
| GE-E20.6-08 | invariante técnico | derivação técnica da v1 | Substituir UI centrada em versão por cobertura, liberação e revisão voluntária | V2 5.7 | N/A | N/A |
| GE-E20.6-09 | invariante técnico | derivação técnica da v1 | Alterar default físico de `is_active` para false sem tocar linhas existentes | V2 5.3 e 5.11 | `supa#40` | N/A — impacto estrutural baixo |

## 4. Achados do Gestor de Automações

| ID | Origem | Classe | Tratamento | Localização/evidência | Destino de update | Confronto estrutural |
| --- | --- | --- | --- | --- | --- | --- |
| AUT-P01 | invariante técnico | derivação técnica da v1 | Manter liberação determinística e IA somente por ação explícita | V2 5.4 | N/A | N/A |
| AUT-P02 | invariante técnico | derivação técnica da v1 | Reusar workload/configuração E21 e provar novo prompt/schema | V2 5.5 | N/A | N/A |
| AUT-P03 | invariante técnico | derivação técnica da v1 | Fixar Responses foreground, Web Search 0/1–2, timeout 45s, `store:false` e zero retry | V2 5.5 | N/A | N/A |
| AUT-P04 | invariante técnico | derivação técnica da v1 | Remover planos, fork e marcador do contexto; aceitar inativo/ativo conforme modo | V2 5.5 | N/A | N/A |
| AUT-P05 | invariante técnico | derivação técnica da v1 | Exigir Structured Output, fontes reais e falha sem mutação | V2 5.5 | N/A | N/A |
| AUT-P06 | invariante técnico | derivação técnica da v1 | Reutilizar o mesmo fluxo na revisão voluntária sem gatilho automático | V2 5.6 | N/A | N/A |
| AUT-P07 | invariante técnico | derivação técnica da v1 | Orquestrar página server-side, separar IA/decisão e preservar acessibilidade | V2 5.7 | `prod#17` | N/A |
| AUT-P08 | invariante técnico | derivação técnica da v1 | Reusar telemetria/custos E21 com payload mínimo e sem conteúdo sensível | V2 5.5 | N/A | N/A |

## 5. Updates consolidados

| ID | Origem | Classe | Tratamento | Localização/evidência | Destino de update | Confronto estrutural |
| --- | --- | --- | --- | --- | --- | --- |
| UP-supa-02 | update | derivação técnica da v1 | Usar Security Controls como prova complementar read-only pós-apply | V2 5.11 | gate hospedado | N/A — impacto baixo |
| UP-supa-05 | update | ampliação de escopo | Preservar Unified Logs apenas como diagnóstico condicional diante de falha inexplicada | V2 5.1/5.9, limite negativo | oportunidade futura | N/A — não implementar |
| UP-supa-40 | update | modernização técnica justificada | Aplicar snippet read-only e teste transacional; ganho reexecutável sem runtime | V2 5.1, 5.3 e 5.11 | `supabase/snippets/` e teste SQL focal | N/A — impacto baixo |
| UP-supa-53 | update | ampliação de escopo | Não instalar fila; preservar somente se volume/SLA real justificar novo recorte | V2 5.1/5.9 | oportunidade futura | N/A — não implementar |
| UP-supa-54 | update | ampliação de escopo | Não criar embeddings/RAG; preservar somente sob corpus e benchmark futuros | V2 5.1/5.9 | oportunidade futura | N/A — não implementar |
| UP-supa-57 | update | ampliação de escopo | Não usar visualizador de schema para mudança apenas de default | V2 5.11 | rejeitado | N/A |
| UP-supa-63 | update | ampliação de escopo | Não instalar `pgtap`/auditoria RLS ampla neste recorte | V2 5.1/5.9 | oportunidade condicional | N/A — não implementar |
| UP-vercel-01 | update | ampliação de escopo | Não introduzir AI Gateway sobre transporte direto/E21 | V2 5.1/5.9 | oportunidade condicional | N/A — não implementar |
| UP-vercel-03 | update | ampliação de escopo | Não aplicar Cache Components em rota administrativa dinâmica | V2 5.1/5.9 | rejeitado | N/A |
| UP-vercel-08 | update | ampliação de escopo | Não criar política de cache por tag; preservar `revalidatePath` vigente | V2 5.1/5.9 | rejeitado | N/A |
| UP-vercel-15 | update | ampliação de escopo | Admitir ferramenta apenas como QA suplementar se disponível sem configuração | V2 5.11 | oportunidade condicional | N/A — não implementar dependência |
| UP-vercel-26 | update | ampliação de escopo | Não usar Cache Reasons sem rota cacheável ou incidente | V2 5.1/5.9 | rejeitado | N/A |
| UP-vercel-31 | update | ampliação de escopo | Não repetir upgrade Next.js já incorporado à base | Base `package.json`/lockfile | não aplicável | N/A |
| UP-github-14 | update | derivação técnica da v1 | Tratar checks/runs como suplementares e preservar prova durável em PR/commits/docs | V2 5.11 | trava de fechamento | N/A — impacto baixo |
| UP-prod-03 | update | ampliação de escopo | Não adicionar RUM/Speed Insights sem tráfego e hipótese mensurável | V2 5.1/5.9 | oportunidade futura | N/A — não implementar |
| UP-prod-14 | update | derivação técnica da v1 | Validar reconhecibilidade do próximo passo humano na jornada | V2 5.7 e 5.11 | roteiro QA | N/A — impacto baixo |
| UP-prod-16 | update | derivação técnica da v1 | Executar QA hospedado desktop/mobile na página e estados afetados | V2 5.11 | gate Preview | N/A — impacto baixo |
| UP-prod-17 | update | modernização técnica justificada | Aplicar matriz WCAG 2.2 proporcional com ganho verificável e sem auditoria global | V2 5.1, 5.7 e 5.11 | UI e roteiro QA | N/A — impacto baixo |

## 6. Correções objetivas da Passagem 1

| ID | Origem | Classe | Tratamento | Localização/evidência | Destino de update | Confronto estrutural |
| --- | --- | --- | --- | --- | --- | --- |
| AN-P1-E206-01 | v1 | derivação técnica da v1 | Selecionar `CURRENT` internamente e rejeitar versão histórica no contrato corrente | V2 corrigida 5.2 e 5.11 | N/A | N/A |
| AN-P1-E206-02 | invariante técnico | derivação técnica da v1 | Tornar gate legado inerte e preservar matriz tipada E20.5/provider sem bloquear humano | V2 corrigida 5.5 e 5.11 | N/A | N/A |
| AN-P1-E206-03 | invariante técnico | derivação técnica da v1 | Atualizar `docs/platform-config.md` pela mudança semântica mesmo sem novo valor | V2 corrigida 5.10 | N/A | N/A |
| AN-P1-E206-04 | v1 | derivação técnica da v1 | Exigir diff, impacto ancestral e nova identidade para redefinição de field | V2 corrigida 5.8 e 5.11 | N/A | N/A |
| AN-P1-E206-05 | update | modernização técnica justificada | Identificar e comparar explicitamente `supa#40` e `prod#17` | V2 corrigida 5.1 | `supa#40`, `prod#17` | N/A — impacto baixo |

## 7. Decisões, travas e completude

- Gestor Estrutural: `aprovado com condicionantes`; todas as cinco condicionantes estão localizadas na V2 e não exigem decisão humana.
- Gestor de Automações: `automação aplicável com patches autossuficientes`; investigação e validação material adicionais: N/A.
- Gestor de Updates: `updates aplicáveis com patches autossuficientes`; confronto estrutural e arbitragem funcional: N/A.
- Passagem 1: `aprovado com correções obrigatórias`; revisão delta da V2 `ce7b7a0d` concluiu `aprovado para merge do plano-base v2` sem substituir a Passagem 2.
- Nenhuma ampliação de escopo foi incorporada. Oportunidades condicionais e updates rejeitados permanecem somente como limites negativos desta matriz.
- A implementação só pode iniciar após Passagem 2, reconciliação e aprovação do roadmap e checkpoint `LP-Factory-Stage: plan-v2-approved`.
- Nenhum merge ocorre antes da liberação explícita do Estrategista Autônomo.
