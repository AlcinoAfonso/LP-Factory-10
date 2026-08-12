12/08/2026 — Lousa de auditoria e debate — arquitetura de geração de Landing Pages

## 0. Cabeçalho

- Documento: lousa de auditoria e debate da arquitetura de geração de Landing Pages.
- Status: debate aberto.
- Repositório: `AlcinoAfonso/LP-Factory-10`.
- Base auditada: `main` no SHA `27251d0887fb883035a9d7f67651f2a5e63b3326`.
- Primeira LP real: `landing_page_id = 4d91020a-07e5-4bf9-a1aa-272bbc0366ff`.
- Conta: `account_id = 6ecaf813-957e-4f2b-9ea7-3f2cb204a603`.
- Natureza: documentação e debate arquitetural em modo somente leitura.
- Responsável pela edição e consolidação da matriz: Auditor Independente da arquitetura de geração.

## 1. Objetivo

- Divulgar a auditoria da primeira LP real e permitir que outros chats ou especialistas apresentem críticas, confirmações, refutações e alternativas sustentadas por evidências.
- Determinar se a arquitetura precisa de correções cirúrgicas, redistribuição de responsabilidades ou reconstrução parcial.
- Determinar o menor ponto do pipeline ao qual será necessário voltar para produzir uma LP persuasiva, factual, visualmente competente e simples de manter.
- Preservar tudo que continue gerando valor.
- Não produzir nem autorizar plano de implementação enquanto o debate não estiver consolidado.

## 2. Conclusão-base da auditoria

### 2.1. Veredito original

- A recomendação inicial é redistribuir responsabilidades, com redesenho focal do núcleo editorial e geracional.
- Não há evidência para descartar pesquisa, configuração, segurança tenant, materialização, snapshot, preview privado ou todos os contratos estruturais.
- Correções apenas em prompt, `copySourceMap`, modelo e CSS provavelmente não resolvem a causa principal.
- O menor ponto de retrocesso indicado é o contrato da E20.3 persistido e ativado pela E12.4.
- O cenário inicialmente recomendado é o Cenário B — redistribuição de responsabilidades.
- Esta conclusão permanece aberta a confirmação, ajuste ou refutação pela matriz.

### 2.2. Causa central identificada

- A proposta de perfil analisa `lp_sections`, cobertura, compatibilidade e coerência global.
- O perfil ativo preserva principalmente módulo, variante, prioridade, ordem e orientação opcional.
- A relação rica entre seção, intenção narrativa, módulo e fontes concretas não chega integralmente à geração.
- A E19.3 volta à E18.5 e reconstrói a estratégia editorial por mapas genéricos de pesquisa.
- A E19.4 recebe contexto estruturalmente válido, porém amplo, concorrente e insuficientemente focal.
- O renderer materializa uma composição funcional, mas visualmente limitada.

## 3. Evidências-base

### 3.1. Documentação

- `README.md` — visão, proposta de valor e princípios do MVP.
- `docs/lp-planejamento.md`.
- `docs/roadmap.md`.
- `docs/base-tecnica.md`.
- `docs/schema.md`.
- `docs/design-system.md`.
- `docs/lousa-plano-base-e10-8.md`.
- `docs/lousa-plano-base-e18-4.md`.
- `docs/lousa-plano-base-e18-5.md`.
- `docs/lousa-plano-base-e20-2.md`.
- `docs/lousa-plano-base-e20-3.md`.
- `docs/lousa-plano-base-e19-2.md`.
- `docs/lousa-plano-base-e19-3.md`.
- `docs/lousa-plano-base-e19-4.md`.
- Planos e contratos vigentes da E12.4 relacionados à proposta, revisão e ativação do perfil.

### 3.2. Implementação

- `lib/conversion-content/landing-page/module-catalog/`.
- `lib/conversion-content/landing-page/generation-profile/`.
- `lib/conversion-content/landing-page/generation-profile/proposal.ts`.
- `lib/lp-builder/generationContext.ts`.
- `lib/lp-builder/generationContextContracts.ts`.
- `lib/lp-builder/landingPageGeneration.ts`.
- Contratos e builder de materialização.
- Renderer materializado.
- Validadores correspondentes.

### 3.3. Evidência empírica

- `public.account_landing_page_materializations` consultada em modo read-only.
- `content_json` da primeira LP real.
- `generation_context_snapshot_json` da primeira LP real.
- Configuração da LP que originou a materialização.
- Perfil de orientação ativo consumido.
- Pesquisas estruturadas efetivamente resolvidas.
- Avaliação humana da preview privada.

### 3.4. Índice curto de evidências

- `EV-01` — princípios do MVP e simplicidade proporcional.
- `EV-02` — pesquisa estruturada, `lp_overview` e `lp_sections`.
- `EV-03` — proposta, persistência e ativação do perfil E20.3/E12.4.
- `EV-04` — catálogo estrutural e editorial da E18.5.
- `EV-05` — compilação da E19.3.
- `EV-06` — geração, validação e materialização da E19.4.
- `EV-07` — renderer e apresentação materializada.
- `EV-08` — configuração, snapshot e conteúdo da primeira LP real.

## 4. Participação no debate

- Não existe lista fixa nem ordem obrigatória de especialistas.
- Um chat ou especialista participa quando houver necessidade concreta de sua competência.
- A manifestação deve indicar conclusão, evidência e recomendação objetiva.
- Os participantes não editam esta lousa; o Auditor Independente registra e consolida as manifestações na matriz.
- Título ou função não prevalecem sobre a evidência do repositório, banco ou materialização.

## 5. Classificações da matriz

- `em debate` — ainda sem consolidação.
- `confirmado` — a evidência sustenta a conclusão-base.
- `confirmado com ajuste` — a direção permanece, mas precisa de correção ou delimitação.
- `refutado` — a evidência demonstra que a conclusão-base está errada.
- `evidência insuficiente` — falta uma fonte específica para concluir.
- `decisão humana` — as fontes permitem mais de uma escolha material de produto ou escopo.

## 6. Matriz de auditoria e debate

| ID | Tema | Conclusão-base da auditoria | Evidência-base | Manifestações recebidas | Consolidação do Auditor | Status |
|---|---|---|---|---|---|---|
| AUD-01 | Veredito geral | O problema exige redistribuição de responsabilidades, não correção apenas local nem reconstrução geral. | `EV-01`, `EV-03` a `EV-08` | — | Pendente. | em debate |
| AUD-02 | Menor ponto de retrocesso | O primeiro contrato que precisa ser reaberto é a E20.3 persistida e ativada pela E12.4. | `EV-03`, `EV-05`, `EV-08` | — | Pendente. | em debate |
| AUD-03 | E10.8 | A resolução de pesquisas, versões e proveniência deve ser preservada. A perda ocorre no consumo posterior. | `EV-02`, `EV-05`, `EV-08` | — | Pendente. | em debate |
| AUD-04 | E18.5 estrutural | Identidade, variantes, fields, cardinalidades, policies, interações, suporte e limites permanecem úteis. | `EV-04`, `EV-06`, `EV-07` | — | Pendente. | em debate |
| AUD-05 | `copySourceMap` | A E18.5 não deve continuar como autoridade final sobre quais itens concretos alimentam a copy de cada LP. | `EV-03` a `EV-05`, `EV-08` | — | Pendente. | em debate |
| AUD-06 | `funnelCopyProfiles` | Podem permanecer como guardrails gerais, mas não como substitutos da decisão narrativa específica da LP. | `EV-04` a `EV-06`, `EV-08` | — | Pendente. | em debate |
| AUD-07 | Perfil narrativo | A cobertura e a relação entre `lp_sections`, módulos, intenção narrativa e fontes aplicáveis devem sobreviver no perfil aprovado. | `EV-02`, `EV-03`, `EV-08` | — | Pendente. | em debate |
| AUD-08 | Granularidade do perfil | A orientação deve existir por módulo e, seletivamente, por field de alto risco factual ou estratégico. | `EV-03` a `EV-06`, `EV-08` | — | Pendente. | em debate |
| AUD-09 | E19.3 | A E19.3 compila estrutura, mas atualmente reconstrói estratégia editorial; deve tornar-se um compilador mais enxuto das decisões aprovadas. | `EV-03` a `EV-05` | — | Pendente. | em debate |
| AUD-10 | E19.4 | Uma única chamada recebe decisões demais. Deve ser comparada com compreensão global seguida de produção focal, sem presumir Agents SDK. | `EV-05`, `EV-06`, `EV-08` | — | Pendente. | em debate |
| AUD-11 | Modelo e reasoning effort | Não há evidência para atribuir automaticamente a baixa qualidade ao `gpt-5.4-mini + none`; modelo deve ser avaliado depois de corrigir contexto, fontes e renderer. | `EV-05`, `EV-06`, `EV-08` | — | Pendente. | em debate |
| AUD-12 | Fidelidade à oferta | A ampliação de compra do primeiro imóvel para venda, locação e avaliação foi autorizada por pesquisas e mapas genéricos, apesar da configuração concreta `buy`. | `EV-04`, `EV-05`, `EV-08` | — | Pendente. | em debate |
| AUD-13 | Provas e fatos | Tipos genéricos de prova, como CRECI verificável e contrato por escrito, foram tratados como fatos concretos sem suporte suficiente no contexto exposto. | `EV-04` a `EV-06`, `EV-08` | — | Pendente. | em debate |
| AUD-14 | Validação | Os validadores protegem fortemente forma e integridade, mas não asseguram fidelidade comercial nem sustentação factual das afirmações. | `EV-04` a `EV-06`, `EV-08` | — | Pendente. | em debate |
| AUD-15 | Renderer | O renderer é funcional e determinístico, porém não tem capacidade atual para produzir consistentemente uma LP moderna e visualmente diferenciada. | `EV-07`, `EV-08` | — | Pendente. | em debate |
| AUD-16 | Header e Footer | Header, navegação e Footer devem ser tratados como moldura da página ou responsabilidade já existente de raiz/renderização, sem criar nova engine por padrão. | `EV-04`, `EV-07`, `EV-08` | — | Pendente. | em debate |
| AUD-17 | Paleta | Cinco cores são suficientes como entrada mínima de identidade, mas não substituem hierarquia, ritmo, composição e variedade de apresentação. | `EV-01`, `EV-07`, `EV-08` | — | Pendente. | em debate |
| AUD-18 | Complexidade | Há complexidade necessária em segurança, contratos e materialização, mas generalização editorial prematura e transformações redundantes precisam ser reduzidas. | `EV-01`, `EV-03` a `EV-08` | — | Pendente. | em debate |
| AUD-19 | Cenário A | Correções cirúrgicas podem mitigar falhas, mas têm baixa probabilidade de resolver a perda estrutural de intenção. | `EV-03` a `EV-08` | — | Pendente. | em debate |
| AUD-20 | Cenário B | Redistribuir E18.5, E20.3, E19.3 e E19.4 oferece a melhor relação entre qualidade, simplicidade, risco e reaproveitamento. | `EV-01`, `EV-03` a `EV-08` | — | Pendente. | em debate |
| AUD-21 | Cenário C | Reconstrução parcial ampla não está justificada antes de testar a redistribuição preservando os ativos válidos. | `EV-01`, `EV-03` a `EV-08` | — | Pendente. | em debate |
| AUD-22 | Ativos preservados | Pesquisa, configuração, segurança tenant, lifecycle do perfil, actions determinísticas, Structured Output, materialização write-once, snapshot e preview privado não devem ser refeitos sem nova evidência. | `EV-02` a `EV-08` | — | Pendente. | em debate |

## 7. Conflitos e novas questões

### 7.1. Conflitos registrados

- Nenhum até o momento.

### 7.2. Novas questões materiais

- Nenhuma até o momento.

### 7.3. Fontes faltantes

- Nenhuma identificada para abrir o debate.
- Cada conclusão específica deve ser interrompida caso dependa de fonte ainda inacessível.

## 8. Decisão consolidada

### 8.1. Estado atual

- Decisão final: pendente.
- Recomendação-base: Cenário B — redistribuição de responsabilidades.
- Menor ponto de retrocesso proposto: contrato E20.3/E12.4.

### 8.2. Conteúdo esperado ao encerrar o debate

- Veredito final.
- Nível de confiança.
- Achados confirmados, ajustados ou refutados.
- Menor ponto de retrocesso.
- Responsabilidades a preservar, simplificar, mover, remover ou redesenhar.
- Ativos que não devem ser refeitos.
- Decisões humanas estritamente necessárias.
- Indicação do próximo recorte a debater, sem antecipar plano de implementação.

## 9. Escopo negativo

- Não alterar código.
- Não alterar banco ou executar migration.
- Não gerar nova LP.
- Não fazer nova chamada OpenAI de produto.
- Não alterar perfil, configuração ou materialização.
- Não criar rota, tabela, engine, agente, automação, workflow ou infraestrutura.
- Não alterar `docs/roadmap.md` nem planos-base enquanto a decisão da auditoria estiver aberta.
- Não transformar esta lousa em plano técnico ou plano-base.
