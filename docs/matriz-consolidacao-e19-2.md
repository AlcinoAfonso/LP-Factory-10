# Matriz de consolidação — E19.2

## Referências imutáveis

- V1: `b8979e2f7fd27bac792e183b5402b3bf33c8e763:docs/lousa-plano-base-e19-2.md`, blob `54d6655b95afbf3b0deb34d166ed8a3564709742`.
- V2 avaliada na Passagem 1: `f2d7d552697d21797110488dd16f616c0b93e720:docs/lousa-plano-base-e19-2.md`.
- Roadmap-base: `22c72788d5884db753eece8e95a1c1b2c3605958:docs/roadmap.md`, blob `86cef6c6677d8a9eeed3251950512de1094daa3c`.
- Gestor Estrutural: parecer integral sobre o blob da v1, concluído como `bloqueado por decisão humana`.
- Gestor de Updates: parecer integral sobre o blob da v1, concluído como `bloqueado por decisão humana`.
- Gestor de Automações: `N/A`, pois o recorte e todas as fases declaram `Automação: não`.
- Decisões humanas: agregado versionado pré-`draft` por conta/jornada; logo sem upload ou infraestrutura de assets nesta entrega.

## Achados e tratamentos

| Especialista | ID | Achado fiel | Classificação original | Relação com o escopo | Tratamento | Destino do update | Localização na v2 | Evidência ou justificativa |
|---|---|---|---|---|---|---|---|---|
| Gestor Estrutural | `GE-E19.2-01` | Persistência pré-`draft` sem modelo físico na v1. | Bloqueante por decisão humana | extensão adjacente necessária e proporcional | incorporado | N/A | 0.4, 1.3, 2.4.5, 3.1 e 4.2 | Decisão humana escolheu agregado 1:1 versionado; a v2 define tabela, payload, revision, RLS, grants e adapter. |
| Gestor Estrutural | `GE-E19.2-02` | Logo dependia de decisão de produto e infraestrutura inexistente. | Bloqueante por decisão humana | preservação | incorporado | N/A | 0.4, 1.6, 3.3 e 4.1/4.2 | Decisão humana excluiu upload e infraestrutura; ausência de logo permanece válida. |
| Gestor Estrutural | `GE-E19.2-03` | Residência de UI, action, provider e boundary não estava normativa. | Patch estrutural `PE-E19.2-01` | preservação | incorporado | N/A | 3.2 | Texto normativo do parecer incorporado literalmente. |
| Gestor Estrutural | `GE-E19.2-04` | Boundary não oferecia leitura confiável de zero, um ou vários drafts. | Patch estrutural `PE-E19.2-02` | extensão adjacente necessária e proporcional | incorporado | N/A | 3.4 | Texto normativo e casos de validação incorporados. |
| Gestor Estrutural | `GE-E19.2-05` | Controles de migration, RLS, grants e Data API dependiam da forma física. | Patch estrutural `PE-E19.2-03` | extensão adjacente necessária e proporcional | incorporado | N/A | 2.4.5 e 3.1 | Objeto escolhido e patch normativo incorporados; sem view ou grant de cliente. |
| Gestor de Updates | `supa#40` | Verificação read-only versionada para persistência, RLS e grants. | complementar / atual | extensão adjacente necessária e proporcional | incorporado | usar como referência, validação ou trava | 3.1 | Snippet read-only exigido no mesmo PR, sem mutação remota. |
| Gestor de Updates | `supa#47` | Controles de Supabase Storage caso assets fossem aprovados. | complementar / condicional | expansão | não incorporado — justificado | usar como referência, validação ou trava | N/A | Premissa rejeitada pela decisão humana: não há Storage, bucket ou upload neste recorte. |
| Gestor de Updates | `supa#63` | Matriz futura de regressão RLS para persistência tenant-sensitive. | complementar / futuro | expansão | não incorporado — justificado | preservar como oportunidade estratégica condicional | N/A | Gatilho futuro depende de banco descartável e custo material da matriz manual; sem Python, pgTAP ou workflow agora. |
| Gestor de Updates | `vercel#15` | Toolbar pode apoiar QA do Preview sem substituir evidência manual. | complementar / atual | preservação | incorporado | usar como referência, validação ou trava | 2.5 | Uso registrado como opcional e não autoritativo. |
| Gestor de Updates | `vercel#21` | Private Blob seria alternativa condicional para asset privado. | sobreposto / condicional | expansão | não incorporado — justificado | preservar como oportunidade estratégica condicional | N/A | Decisão humana excluiu infraestrutura de assets; comparação exige recorte futuro. |
| Gestor de Updates | `vercel#3` | Cache compartilhado é incompatível com jornada autenticada dependente de sessão. | incompatível / atual | expansão | não incorporado — justificado | não aplicável ao recorte | N/A | A rota permanece dinâmica e tenant/session-scoped. |
| Gestor de Updates | `prod#3` | Dados reais poderiam medir performance após tráfego suficiente. | complementar / futuro | expansão | não incorporado — justificado | preservar como oportunidade estratégica condicional | N/A | Sem tráfego, hipótese de regressão ou autorização para analytics neste recorte. |
| Gestor de Updates | `prod#12` | Contexto global conta → LP pode ajudar operação futura com múltiplas entidades. | complementar / futuro | expansão | não incorporado — justificado | preservar como oportunidade estratégica condicional | N/A | A entrega limita-se à conta atual e à escolha explícita de drafts; sem switcher global. |
| Gestor de Updates | `prod#14` | Próximo passo, pendências e bloqueios precisam ser reconhecíveis. | complementar / atual | preservação | incorporado | usar como referência, validação ou trava | 3.2 | Critério humano de reconhecimento incorporado sem métrica artificial. |
| Gestor de Updates | `prod#16` | Nova superfície exige evidência proporcional em Preview. | complementar / atual | preservação | incorporado | usar como referência, validação ou trava | 2.5 | Cenários desktop, mobile, teclado e runtime incorporados. |
| Gestor de Updates | `prod#17` | Onboarding requer baseline proporcional WCAG 2.2. | complementar / atual | preservação | incorporado | aplicar agora | 2.5 | Patch integral incorporado sem declarar conformidade global. |
| Gestor de Updates | `prod#19` | Entitlement interno deve permanecer autoritativo, separado de sinal externo e capability. | complementar / atual | preservação | incorporado | usar como referência, validação ou trava | 1.8 | Patch integral incorporado; sem Stripe Entitlements ou consulta client. |
| Gestor de Updates | `supa#52` | Generated column não deve materializar completude ou status derivado. | incompatível / atual | expansão | não incorporado — justificado | não aplicável ao recorte | N/A | Contraria completude derivada e a proibição de `onboarding_status`. |
| Gestor de Automações | `GA-E19.2-N/A` | Recorte e fases declaram `Automação: não`. | N/A | preservação | não incorporado — justificado | N/A | 0.1, 1.9 e 3.1–3.4 | O contrato de orquestração proíbe acionar este especialista sem `Automação: sim`. |
