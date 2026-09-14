# Matriz de consolidação — E20.8

## 1. Referências imutáveis

- Caso: `E20.8 — Substituição greenfield e simplificação terminal da E20`.
- Fonte funcional: Debate 12B, PB 1.
- Plano-base: `docs/lousa-plano-base-e20-8.md`.
- V1 congelada: commit `84534bdbf674859b388009bea3c11f74ced5e3e6`, blob `a598addc9ad1a52085ecbe5ef34e8a7e683b34c1`.
- V2 inicial: commit `0e46babf8117a5b61a12ceb83d28acec37b1192d`, blob `b2cbb1c0269db6311ef94326a3900266818dca4d`.
- V2 corrigida após a Passagem 1: commit `4cd8efa7c3e4db2cb75d4458f159328cf04207cd`, blob `731cb32376c238b0dba2048b1395c8c129600625`.
- Registro posterior da revisão delta: commit `13cd50841c34d005665c19c534c178ef7227b9ec`, blob do plano `17b579fee6962a98ec2b95ea0fbb58579ffbe61e`.
- Base técnica: `origin/main@806bf0f8cf13d5222537953eef175fbde355c0fb`.
- Snapshot-base de `docs/roadmap.md`: blob `f948e5fd2c3ebc9f2dd2fa6ed987fdff36ee2eb2`.
- Plano conceitual: `N/A`.
- PR/branch/worktree: `#939`, `codex-app/e20-8-greenfield`, `C:\Users\alcin\.codex\worktrees\0518\LP-Factory-10`.
- Execução: Complexa. Supervisão: Autônomo.

## 2. Estado do gate de plano

- Os pareceres originais dos Gestores Estrutural, de Updates e de Automações foram recuperados dos mesmos agentes que avaliaram o blob imutável da V1; não houve reavaliação ou novo especialista.
- A Passagem 1 e sua revisão delta foram recuperadas do mesmo Analista e permanecem integralmente registradas na lousa.
- A conclusão `aprovado para merge do plano-base v2` de `13cd5084` encerrou somente a revisão delta dos sete achados da Passagem 1. Ela não substituiu a Passagem 2 obrigatória com pareceres integrais e esta matriz.
- A Passagem 2 auditou os pareceres integrais e esta matriz, solicitou dois fechamentos documentais e aprovou o delta no mesmo Analista. A revisão do roadmap ainda deve concluir antes do novo checkpoint `LP-Factory-Stage: plan-v2-approved`.
- Nenhum achado abaixo amplia o resultado funcional da V1. Cada tratamento é classificado como `derivação técnica da V1`, `modernização técnica justificada` ou `não incorporado`.

## 3. Parecer do Gestor Estrutural — derivação inicial

| ID | Origem | Achado vinculante | Classe | Tratamento | Localização na V2 | Evidência |
|---|---|---|---|---|---|---|
| `GE-E20.8-01` | invariante técnico | Registry v1–v6, `CURRENT_VERSION`, planos e lifecycle conflitam com a V1. | derivação técnica da V1 | Substituir in place o boundary por fields factuais correntes. | §§2, 4 e 5 | Boundary final sem registry/lifecycle/versionamento. |
| `GE-E20.8-02` | invariante técnico | `landing_page_input_catalog_drafts` materializa o lifecycle proibido. | derivação técnica da V1 | Remover pela migration de substituição após o cutover seguro. | §§3 e 10 | Migration, teste e snippet E20.8. |
| `GE-E20.8-03` | invariante técnico | `reviewed_input_catalog_version` atravessa schema e adapters sem responsabilidade vigente. | derivação técnica da V1 | Remover coluna, leituras, writes, DTOs e gates. | §§3, 9 e 10 | Migration e auditoria de runtime. |
| `GE-E20.8-04` | invariante técnico | `/admin/estrutura-lp?view=entradas` é a residência administrativa mínima. | derivação técnica da V1 | Reutilizar a rota e preservar a visão E18.4. | §8 | Página única e Admin estruturado. |
| `GE-E20.8-05` | invariante técnico | Editor JSON de draft é incompatível com gestão direta. | derivação técnica da V1 | Substituir por formulário estruturado com CRUD lógico. | §§8 e 12 | Componente e actions de factual fields. |
| `GE-E20.8-06` | invariante técnico | Release humano, taxon chain, E20.5 e assistência consultiva são preserváveis, mas dependiam de versão. | derivação técnica da V1 | Repontar para a cobertura factual corrente e remover marker/handoff. | §§2, 4 e 9 | Contratos e adapters greenfield. |
| `GE-E20.8-07` | invariante técnico | E20.7 não possui consumidor funcional. | derivação técnica da V1 | Remover boundary, adapters, workload, proofs, validators e scripts exclusivos. | §§5, 10 e 11 | Auditoria de dependências terminal. |
| `GE-E20.8-08` | invariante técnico | Custos E21 podem conter histórico de E20.7. | derivação técnica da V1 | Isolar o literal retirado somente no read model histórico; bloquear tracking novo. | §§5 e 12 | Boundary de custos separado da allowlist ativa. |
| `GE-E20.8-09` | invariante técnico | Objetos físicos E19 com `catalog_version` pertencem a outro caso. | não incorporado | Preservar integralmente; excluir da busca terminal focal da E20. | §§2 e 12 | Escopo negativo explícito. |
| `GE-E20.8-10` | invariante técnico | RLS e grants são controles independentes da Data API server-only. | derivação técnica da V1 | RLS sem policies públicas e grants mínimos para `service_role`. | §§3, 6 e 12 | SQL test, snippet e Security Controls. |
| `GE-E20.8-11` | invariante técnico | Deploy e apply não são atomicamente ordenados. | derivação técnica da V1 | Falhar fechado e executar o cutover supervisionado com apply suspenso. | §§2 e 10 | Sequência operacional de seis passos. |
| `GE-E20.8-12` | invariante técnico | Fontes canônicas ainda descrevem contratos superseded. | derivação técnica da V1 | Substituir seções vigentes por ABC, sem preservar arquitetura antiga como corrente. | §10 | Roadmap e documentos canônicos reconciliados. |

### 3.1 Condicionantes estruturais

| ID | Origem | Condicionante | Classe | Tratamento | Localização/evidência |
|---|---|---|---|---|---|
| `C-E20.8-01` | invariante técnico | Carga somente dos fields ativos da v6, sem propriedades proibidas. | derivação técnica da V1 | Manifesto explícito de 25 rows; negativas verificáveis. | §§3, 6 e 12. |
| `C-E20.8-02` | invariante técnico | Validar IDs, slugs, níveis e parentes antes da carga. | derivação técnica da V1 | Incompatibilidade aborta a transação inteira. | §§3 e 6. |
| `C-E20.8-03` | invariante técnico | Preservar E18.4, E20.5, E20.6 humano/consultivo, E21 comum e resíduos E19. | derivação técnica da V1 | Auditoria de imports e validators focais. | §§2, 5, 9 e 12. |
| `C-E20.8-04` | invariante técnico | E20.7 histórica só pode residir no boundary financeiro read-only. | derivação técnica da V1 | Remover capacidade operacional e manter evidência transversal inerte. | §§5 e 12. |
| `C-E20.8-05` | invariante técnico | Migration, repontamento e remoção formam checkpoint íntegro. | derivação técnica da V1 | Nenhum estado publicado depende de duas autoridades; apply ocorre após o runtime novo. | §§6 e 10. |
| `C-E20.8-06` | invariante técnico | Migration aplicada e verificada antes do encerramento hospedado. | derivação técnica da V1 | Workflow canônico, snippet e QA pós-apply. | §§10 e 12. |

## 4. Parecer do Gestor de Updates

| ID | Origem | Relação/horizonte | Decisão | Classe | Tratamento e destino | Evidência |
|---|---|---|---|---|---|---|
| `supa#2` | update | complementar/atual | referência e trava | derivação técnica da V1 | Confrontar Security Controls após o apply sem substituir SQL test/snippet. | §§3, 6, 10 e 12. |
| `supa#40` | update | complementar/atual | aplicar agora | modernização técnica justificada | Versionar snippet read-only reexecutável. | §§3, 6, 10, 12 e 13. |
| `supa#52` | update | sobreposto/atual | rejeitado | não incorporado | Não criar coluna normalizada que duplique `fieldKey`. | §§2, 3 e 13. |
| `supa#63` | update | complementar/condicional | oportunidade futura | não incorporado | Não instalar ferramenta, pgTAP ou workflow; reavaliar só diante de lacuna RLS demonstrável. | §13. |
| `vercel#31` | update | substituto/atual | referência e trava | derivação técnica da V1 | Preservar Next.js `16.3.3` ou baseline corrigida superior; sem novo upgrade/cache. | §10. |
| `github#14` | update | complementar/atual | referência e trava | derivação técnica da V1 | Evidência durável em PR, commits e documentos; runs/logs apenas suplementares. | §10. |
| `prod#14` | update | complementar/atual | aplicar agora | modernização técnica justificada | Tornar camada, próprio/herdado e próxima ação reconhecíveis sem detalhes técnicos. | §§8, 12 e 13. |
| `prod#16` | update | complementar/atual | referência e trava | derivação técnica da V1 | QA hospedado desktop/mobile dos fluxos e estados relevantes. | §§8, 10 e 12. |
| `prod#17` | update | complementar/atual | aplicar agora | modernização técnica justificada | Validar teclado, foco, labels, erros, anúncios, contraste, alvos de 44 px e ausência de hover-only. | §§8, 10, 12 e 13. |

### 4.1 Patches de update incorporados

- `supa#40`: o snippet `supabase/snippets/e20_8_factual_fields_verify.sql` é estritamente read-only e comprova schema, constraints, FK, índice, trigger, RLS, grants mínimos, carga inicial e ausência dos objetos removidos.
- `prod#14`: o `platform_admin` deve reconhecer camada, proveniência próprio/herdado e próxima ação sem abrir detalhes técnicos; não se cria telemetria de tempo/clique.
- `prod#17`: o QA cobre os critérios WCAG 2.2 pertinentes sem declarar conformidade integral.
- Não houve candidato a confronto estrutural nem a arbitragem funcional. Todos os updates aplicados possuem impacto estrutural baixo e impacto funcional nulo.

## 5. Parecer do Gestor de Automações

| ID | Origem | Conclusão | Classe | Tratamento | Localização/evidência |
|---|---|---|---|---|---|
| `GA-E20.8-01` | v1 | Preservar `taxon_input_catalog_sufficiency_evaluation` como único workload OpenAI da E20, foreground, opcional e consultivo. | derivação técnica da V1 | Adaptar ao Supabase corrente; `gpt-5.6-terra + low`, Structured Output, `store:false`, `background:false`, 45 s, zero retry e Web Search estritamente limitada. Nenhuma mutação/persistência pela IA. Validar o prompt/contrato greenfield contra `docs/template-prompts.md` e `docs/template-prompts-gpt-5-6.md`. | §§9, 10 e 12. |
| `GA-E20.8-02` | v1 | Retirar integralmente E20.7 e `landing_page_dynamic_market_research` das superfícies correntes. | derivação técnica da V1 | Remover runtime/configuração ativa; preservar somente histórico E21 com responsabilidade independente e inerte. | §§5, 10 e 12. |
| `GA-E20.8-03` | v1 | Reconciliar a documentação de automações/configuração/modelos. | derivação técnica da V1 | E20.8.7 substitui E20.6 corrente; E20.7 deixa de ser capacidade vigente; estado hospedado vem da fonte operacional. | §10. |

### 5.1 Limites vinculantes da automação

- Não usar Agents API/SDK, conversation, sessão, background, fila, job, cache, retry, agente ou fallback Codex.
- Web Search ocorre somente quando autorizada pela estratégia: exatamente uma chamada para hipótese focal ou no máximo duas para fallback, aceitando apenas URLs HTTPS presentes na metadata do provider.
- Falha, recusa, timeout, indisponibilidade ou inconclusão afetam apenas a assistência e nunca bloqueiam CRUD ou liberação humana.
- Telemetria é sanitizada e não registra prompt, resposta integral, conteúdo de fontes, PII, secrets ou payload de negócio.
- O prompt/contrato greenfield só é aceito após confronto explícito com `docs/template-prompts.md` e `docs/template-prompts-gpt-5-6.md`.

## 6. Passagem 1 do Analista e revisão delta

| ID | Achado | Origem | Classe | Correção objetiva | Localização/evidência |
|---|---|---|---|---|---|
| `AN-P1-E20.8-01` | `field_key` como PK divergia da convenção de entidade. | invariante técnico | derivação técnica da V1 | Adotar `id uuid` como PK e `field_key` UNIQUE. | §3; revisão delta item 1. |
| `AN-P1-E20.8-02` | Bootstrap não possuía ator humano canônico para autoria NOT NULL. | invariante técnico | derivação técnica da V1 | Permitir autoria nula apenas no bootstrap; exigir ator nas mutações. | §3; revisão delta item 2. |
| `AN-P1-E20.8-03` | Faltava decisão de auditoria e Trigger Hub. | invariante técnico | derivação técnica da V1 | Registrar explicitamente `não` para ambos. | §3; revisão delta item 3. |
| `AN-P1-E20.8-04` | `definition jsonb` não estava tecnicamente fechado. | invariante técnico | derivação técnica da V1 | Fixar propriedades, enums, invariantes e paridade SQL/Zod. | §3; revisão delta item 4. |
| `AN-P1-E20.8-05` | Cutover não protegia runtime antigo do DROP automático. | invariante técnico | derivação técnica da V1 | Suspender apply, implantar novo SHA, restaurar gate e aplicar manualmente. | §10; revisão delta item 5. |
| `AN-P1-E20.8-06` | Carga v6 não declarava transformação/cardinalidade determinística. | invariante técnico | derivação técnica da V1 | Manifesto exato de 25 rows e aborto por qualquer divergência. | §§3 e 6; revisão delta item 6. |
| `AN-P1-E20.8-07` | Retirada E20.7 não separava allowlist ativa de histórico append-only. | invariante técnico | derivação técnica da V1 | Preservar histórico inerte e retirar consumidores, allowlists e tracking novo. | §§5 e 12; revisão delta item 7. |

- Passagem 1: `aprovado com correções obrigatórias` sobre `0e46babf`.
- Revisão delta do mesmo Analista: os sete itens foram encerrados sobre `4cd8efa7`, com conclusão `aprovado para merge do plano-base v2`.
- Essa conclusão é preservada como fechamento exclusivo da Passagem 1. A Passagem 2 ainda deve confrontar pareceres integrais e matriz antes de um novo checkpoint válido.

## 7. Classificação consolidada

- `derivação técnica da V1`: substituição in place do boundary, tabela única, migration/carga/cutover, resolver puro, adapters, Admin estruturado, liberação humana, preservação consultiva da IA, retirada E20.7, segurança, validações e reconciliação documental.
- `modernização técnica justificada`: somente `supa#40`, `prod#14` e `prod#17`, todos de baixo impacto estrutural e impacto funcional nulo.
- `ampliação de escopo`: nenhuma.
- `não incorporado`: `supa#52`, `supa#63` e remoções pertencentes a E19 ou a responsabilidades transversais preservadas.
- Confronto estrutural de modernização: `N/A`, conforme parecer integral de Updates.
- Arbitragem funcional: `N/A`.
- Investigação material pendente antes da Passagem 2: nenhuma.

## 8. Integridade dos pareceres e próximo gate

- Parecer Estrutural original: Gestor `estrutura_e20_8`, 14/09/2026 12:32, conclusão `aprovado com condicionantes`.
- Parecer de Updates original: Gestor `updates_e20_8`, 14/09/2026 12:42, conclusão `updates aplicáveis com patches autossuficientes`.
- Parecer de Automações original: Gestor `automacoes_e20_8`, 14/09/2026 12:40, conclusão `automação aplicável com patches autossuficientes`.
- Passagem 1 original: Analista `analista_p1_e20_8`, 14/09/2026 12:53, conclusão `aprovado com correções obrigatórias`; revisão delta de 14/09/2026 13:01 encerrou os sete itens.
- Os outputs integrais permanecem preservados na task original e foram entregues, sem resumo substitutivo, ao mesmo Analista na Passagem 2 juntamente com esta matriz.
- Próximo gate: revisão delta do roadmap pelo mesmo Analista; não reabrir especialistas nem antecipar implementação.

## 9. Passagem 2 e ABC de planejamento

- Passagem 2 (`auditoria_consolidacao`): executada pelo mesmo Analista em 14/09/2026 15:39 sobre o plano blob `17b579fee6962a98ec2b95ea0fbb58579ffbe61e` e a matriz blob `9e6870825e89b794fbfccab6a346ac18bc55a468`; conclusão `aprovado com correções obrigatórias`.
- Achados: explicitar na V2 a negativa de telemetria/métrica de tempo ou clique de `prod#14`; registrar na V2 e matriz o confronto do prompt greenfield com `docs/template-prompts.md` e `docs/template-prompts-gpt-5-6.md` para `GA-E20.8-01`.
- Delta corretivo: commit `cc0c330a74ba0bd40d4f76dced9cfd99d1f8a8d2`, plano blob `643f81033df64898e3ef205fe6d6e7899fb82e3e`, matriz blob `2d753148aaf6adbf8c7c587acaf3ae2232b0aa8e`.
- Revisão delta da Passagem 2: executada pelo mesmo Analista em 14/09/2026 15:41; os dois achados foram encerrados, nenhuma regressão material foi identificada e a conclusão formal foi `aprovado para merge do plano-base v2`.
- Snapshot-base do roadmap: `origin/main@806bf0f8cf13d5222537953eef175fbde355c0fb`, blob `f948e5fd2c3ebc9f2dd2fa6ed987fdff36ee2eb2`.
- A primeira revisão do roadmap, em 14/09/2026 15:47, confirmou que as duas correções da Passagem 2 não pertencem ao roadmap, mas rejeitou o `SEM ALTERAÇÕES NECESSÁRIAS` por duas violações da hierarquia do template em recortes materialmente afetados.
- Roadmap resultante corrigido: `docs/roadmap.md`, blob `b46d51ffd54ba3b7d5fd550937a1c329ad98c2fb`.
- O delta preserva todo o conteúdo vigente e apenas renumera `20.2.2 Encerramento` para `20.2.3` e `20.6.2 Contrato vigente` para `20.6.3`, sem criar blocos `.2` vazios ou duplicar os registros residentes em `20.8.2`.

```txt
14/09/2026 15:47 — ABC (DELTA-ONLY) para docs/roadmap.md
DOC_ALVO: docs/roadmap.md
VERSAO_NOVA: v1.5.234
DATA_NOVA: 14/09/2026

OPERAÇÕES

OP1)
TIPO: SUBSTITUIR_TRECHO
ALVO: 20.2.2 Encerramento
CONTEUDO:
20.2.3 Encerramento

OP2)
TIPO: SUBSTITUIR_TRECHO
ALVO: 20.6.2 Contrato vigente
CONTEUDO:
20.6.3 Contrato vigente
```
