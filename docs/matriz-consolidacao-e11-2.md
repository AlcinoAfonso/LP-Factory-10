# Matriz de consolidação E11.2

- Caso: E11.2 — Autoridade comercial e elegibilidade para gestão de membros
- V1 congelada: commit `44349ceaf990792a2755e09135f0f06acdb52942`, blob `861fac03ccaaa3ff34769fc47f37c06d186124e9`
- V2 avaliada na Passagem 1: commit `3303e921887fd19896f7482382c344924fd1d6e8`, blob `4283f172798621e92b84908f246119bf7fc98086`
- Plano conceitual: N/A confirmado
- Automação: N/A — todas as fases da v1 registram `Automação: não`

| Especialista | ID | Achado fiel | Classificação original | Relação com o escopo | Tratamento | Destino do update | Localização na v2 | Evidência ou justificativa |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Gestor Estrutural | EST-E11.2-001 | O contexto de gestão não transportava a condição autoritativa de conta `active`; endurecer o guard global bloquearia operações preservadas. | bloqueante | preservação | incorporado | N/A | 2.3 e E11.2.4 | `accountStatus` deriva do Access Context e bloqueia somente convite/reenvio antes de efeitos, sem query ou boundary novo. |
| Gestor Estrutural | EST-E11.2-002 | As novas decisões críticas de checkout, convite e reenvio precisavam materializar a observabilidade mínima da Base Técnica. | bloqueante | extensão adjacente necessária e proporcional | incorporado | N/A | 2.7, E11.2.3 e E11.2.4 | Evento estruturado seguro cobre `allowed`, `denied` e `error`, exatamente um evento por decisão, falha não interferente e ausência de PII, payload externo, URL, token ou secret. |
| Gestor Estrutural | EST-E11.2-003 | A migration E11 está aplicada, mas `docs/schema.md` 1.2.4 ainda registra apply futuro. | bloqueante para consolidação, não para runtime | expansão | não incorporado — justificado | N/A | N/A | A dívida é separável, pertence à E11.1 e deve seguir em microdelta documental próprio; não bloqueia o runtime E11.2 nem autoriza banco. |
| Gestor Estrutural | EST-E11.2-004 | Reuso e separação de responsabilidades já estão adequados nos boundaries e componentes existentes. | não bloqueante | preservação | não incorporado — justificado | N/A | N/A | Confirmação de cobertura preexistente na v1; a v2 apenas preserva Access Context, commercial-entitlements, account-members, billing-checkout e componentes route-local. |
| Gestor Estrutural | EST-E11.2-005 | GRANTs e RLS permanecem controles distintos e não exigem alteração na E11.2. | não bloqueante | preservação | não incorporado — justificado | N/A | N/A | Confirmação de cobertura preexistente na v1; a E11.2 mantém a proibição de migration, policy, GRANT, view e mudança de Data API. |
| Gestor de Updates | supa#30 | Preservar `inviteUserByEmail` e o template nativo, com guard comercial anterior a Auth, membership, canal e envio. | complementar, horizonte atual | preservação | incorporado | usar como referência, validação ou trava | 2.3 e E11.2.4 | O texto preserva o template nativo e exige ausência de chamadas aos adapters em bloqueios. |
| Gestor de Updates | supa#5 | Logs Explorer e AI Debugging podem reduzir MTTR em incidentes recorrentes não resolvidos pelos logs atuais. | complementar, horizonte condicional | preservação | não incorporado — justificado | preservar como oportunidade estratégica condicional | 2.7 | A v2 apenas registra hipótese, gatilho e limite; não habilita AI Debugging, drains, alertas ou integração. |
| Gestor de Updates | vercel#15 | Toolbar pode apoiar feedback e inspeção visual se já estiver disponível no Preview. | complementar, horizonte condicional | preservação | não incorporado — justificado | preservar como oportunidade estratégica condicional | 2.7 e E11.2.5 | A v2 apenas preserva a oportunidade: não configura, contrata nem torna Toolbar dependência; ferramentas disponíveis não substituem validação manual. |
| Gestor de Updates | vercel#27 | Update de segurança de Next.js é relacionado às superfícies, mas o repositório já está em `16.2.11`. | complementar, horizonte atual | preservação | não incorporado — justificado | não aplicável ao recorte | 2.7 | `package.json` e lockfile já satisfazem o gatilho; não reabrir dependências. |
| Gestor de Updates | prod#14 | Owner e não-owner precisam reconhecer sem ajuda o próximo passo correto e a ausência de ação financeira. | complementar, horizonte atual | extensão adjacente necessária e proporcional | incorporado | aplicar agora | 2.6 e E11.2.5 | Critério de reconhecimento foi acrescentado sem onboarding, telemetria, pesquisa ampla ou redesign. |
| Gestor de Updates | prod#16 | O impacto visual exige QA proporcional em Preview, desktop e mobile. | complementar, horizonte atual | extensão adjacente necessária e proporcional | incorporado | aplicar agora | E11.2.5 | A v2 exige matriz cruzada de variantes genérica/publicada, quatro papéis e dois estados de entitlement, além de capturas e validação manual proporcional. |
| Gestor de Updates | prod#17 | A experiência precisa explicitar o baseline aplicável de acessibilidade sem alegar conformidade integral. | complementar, horizonte atual | extensão adjacente necessária e proporcional | incorporado | aplicar agora | 2.4, 2.6 e E11.2.5 | Contraste, foco, teclado, rótulos, mensagens, disabled e alvos de toque foram incorporados com limite expresso. |
| Gestor de Updates | prod#19 | Stripe Entitlements é apenas benchmark e não substitui o sinal e a persistência internos. | complementar, horizonte atual | preservação | incorporado | usar como referência, validação ou trava | 1.5 e 2.7 | A v2 proíbe API, SDK, tabela, sincronização ou decisão por feature entitlement da Stripe. |

## Correções objetivas das Passagens 1 e 2

- Aplicado: cobertura explícita de `GenericCommercialPage` e `PublishedCommercialActivationPage`, sem alterar bundle, conteúdo persistido, composição, ordem ou schemas da E10.7.
- Aplicado: matriz cruzada de variante genérica/publicada, quatro papéis e dois estados de entitlement.
- Aplicado: correção de `docs/schema.md` 1.2.4 retirada da E11.2 e encaminhada a microdelta documental próprio da E11.1.
- Aplicado: registro do merge do PR #666 movido para a reconciliação do roadmap anterior a `plan-v2-approved`.
- Aplicado: evidência de `allowed`, `denied` e `error`, exatamente um evento por decisão e não interferência de falha de logging.

## Automação

Automação: N/A. A v1 e todas as fases registram `Automação: não`; nenhum especialista de automações foi acionado e nenhum agente, job, fila, cron ou automação integra o recorte.
