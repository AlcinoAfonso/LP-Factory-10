# LP Factory 10 — Estratégia de Produtos  

---

## Objetivo e escopo

Este documento registra práticas, capacidades e tendências externas que possam gerar valor concreto para o produto LP Factory 10.

Só devem entrar updates relacionados a:

* UX e acessibilidade;
* aquisição, conversão e retenção;
* onboarding e experiência do usuário;
* monetização, billing e pricing;
* analytics de produto;
* performance percebida;
* automação comercial;
* experiências de produto assistidas por IA.

Não registrar novidades genéricas sem caso de uso, impacto ou decisão aplicável ao projeto.

## Fontes prioritárias

A pesquisa deve usar prioritariamente documentação oficial de:

* OpenAI, para IA, agentes e experiências assistidas;
* Google Search Central e web.dev, para SEO, performance e experiência web;
* Meta Ads e Google Ads, para aquisição, conversão e tracking;
* WhatsApp Business Platform e Meta Business Messaging, para mensageria, campanhas, atendimento, qualificação, venda, automação e IA conversacional;
* Stripe, para billing, checkout, pricing e monetização;
* W3C/WAI, para acessibilidade e WCAG.

Vercel, Supabase e GitHub entram apenas quando o recurso tiver impacto direto em produto ou experiência. A descrição técnica completa deve permanecer nos respectivos catálogos, com referência curta neste documento para evitar duplicação.

Fontes secundárias podem apoiar a análise, mas não devem substituir documentação oficial.

## Critério de validação

Antes de registrar ou atualizar um item:

1. confirmar o estado atual na fonte oficial;
2. identificar valor concreto para o LP Factory 10;
3. verificar custo, plano, maturidade e dependências;
4. definir se o recurso deve ser adotado, avaliado depois ou descartado;
5. confirmar no roadmap e no repositório se já existe implementação;
6. buscar referências pelo ID e semanticamente pela capacidade, incluindo recortes, código, migrations, testes e decisões;
7. confirmar a cobertura dos canais estratégicos do `README.md`, especialmente WhatsApp.

## Convenção de referência

O identificador canônico dos itens deste catálogo é `prod#n`.

Esse identificador deve ser usado no roadmap, Base Técnica, briefings, relatórios e referências cruzadas. Todo ID publicado deve permanecer localizável. A numeração não deve ser apagada, renumerada ou reutilizada após implementação, absorção, rejeição, depreciação ou substituição.

## Critério do catálogo ativo

Este documento mantém práticas, capacidades e tendências de produto aproveitáveis em casos atuais, futuros ou condicionais, além dos registros históricos necessários à rastreabilidade.

Itens absorvidos, implementados, duplicados, superados ou sem aproveitamento concreto podem sair do catálogo ativo, mas permanecem como registro histórico compacto com estado final, evidências, recortes e eventual substituto.

Recursos pagos, enterprise ou futuros podem permanecer quando ainda tiverem aproveitamento possível em algum caso específico.

A rejeição ou adoção de cada item deve ser decidida caso a caso pelo Gestor de Updates, conforme o plano-base avaliado.

## 1 — SSO Self-Service *(🟨 Futuro condicional — Pro/Ultra)*

2025-05-11  
Reavaliado em 2026-08-04

### Status no Projeto

- Status: não implementado; capacidade de produto preservada para clientes empresariais.
- Evidência: não há configuração autônoma de Google Workspace, Microsoft Entra ID/Azure AD ou Okta no Dashboard; `supa#61` mantém a capacidade técnica de provedores OAuth/OIDC customizados.
- Relação com a arquitetura: `prod#1` representa a experiência comercial e administrativa; `supa#61` representa a capacidade técnica. Não são substitutos documentais.
- Horizonte sugerido: Pro/Ultra, sujeito à decisão do Estrategista e a demanda enterprise real.

### Valor para o Projeto

- Pode reduzir suporte e ampliar competitividade em contas empresariais.
- Preserva a evolução multi-tenant sem antecipar complexidade no Starter.

### Gatilho futuro de avaliação

Avaliar quando houver cliente ou venda enterprise que exija provedor corporativo, domínio verificado, governança de acesso e configuração administrável.

### Limites

- Exige segurança, recuperação, auditoria, suporte e confirmação de disponibilidade/custo do provedor.
- Não criar UI, rota, banco, integração ou promessa comercial por causa deste registro.

---

## 3 — Speed Insights para validar performance percebida *(🟨 Adoção condicional)*
2025-06-01  
Atualizado em 2026-08-03

### Status no Projeto

- Status: Não implementado — mensuração real de usuários ainda não adotada.
- Evidência: o repositório não contém `@vercel/speed-insights`, `SpeedInsights` nem registro de ativação; a E10.6 já foi validada sem transformar analytics em requisito de entrega.

### Descrição

Speed Insights coleta dados reais de experiência para Core Web Vitals e ajuda a identificar regressões percebidas por dispositivo e ambiente. Neste catálogo, o interesse é de produto: obter uma baseline antes de priorizar trabalho de performance, sem duplicar detalhes técnicos da Vercel.

### Valor para o Projeto

- Apoia decisões de UX com comportamento real, em vez de otimização baseada apenas em teste sintético.
- Permite comparar Preview e produção quando houver tráfego suficiente.
- Evita bloquear a primeira entrega por uma instrumentação que ainda não tem rotina de leitura.

### Valor para o Usuário

- Pode orientar correções de lentidão, instabilidade visual e baixa responsividade que afetem conversão.

### Gatilho futuro de avaliação

Avaliar somente quando houver:

1. página funcional com tráfego suficiente para produzir amostra útil;
2. responsável e frequência definidos para revisar os dados;
3. hipótese de regressão ou objetivo mensurável de experiência;
4. plano, retenção, custo e tratamento de dados confirmados.

### Ações Recomendadas

1. Manter deferido até o gatilho ocorrer.
2. Se adotado, registrar baseline e priorizar apenas regressões com impacto real.
3. Não usar o score isoladamente como prova de conversão nem como bloqueio automático de release.

### Fontes Oficiais

- [Vercel — Speed Insights](https://vercel.com/docs/speed-insights)
- [web.dev — Interaction to Next Paint (INP)](https://web.dev/articles/inp)

---

## 4 — Agent Experience (AX) para acesso por navegador *(⚪ Registro histórico — absorvido)*

2025-07-01  
Atualizado em 2026-08-04

### Estado e rastreabilidade

- Estado: não implementado como capacidade independente; princípios absorvidos por `prod#6` e `prod#17`.
- Evidência: conteúdo legível, HTML semântico, acessibilidade, rótulos claros e fluxos previsíveis beneficiam pessoas, tecnologias assistivas e agentes sem exigir protocolo especial.
- Recortes relacionados: conteúdo útil para busca generativa e baseline de acessibilidade.
- Horizonte: reavaliar somente se surgir experiência agentic real com requisito não coberto pelas práticas atuais.
- O ID permanece histórico e não pode ser reutilizado.

### Fonte Oficial

- [Google — Optimizing for generative AI features: Explore agentic experiences](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)

---

## 6 — Conteúdo útil para busca generativa *(🟩 Orientação oficial)*
2025-09-01  
Atualizado em 2026-07-20

### Descrição  
Aplicar às experiências generativas do Google os mesmos fundamentos de SEO: estrutura técnica clara e conteúdo original, útil, confiável e orientado a pessoas. Não existe schema especial obrigatório para busca generativa, e táticas como `llms.txt`, fragmentação artificial de texto ou menções inautênticas não substituem esses fundamentos.

### Valor para o Projeto  
- Evita transformar AEO/GEO em hacks ou escopo técnico sem evidência.
- Reforça pesquisa própria, clareza editorial e diferenciação por segmento.
- Mantém structured data apenas quando houver benefício normal de Search e rich results.

### Valor para o Usuário  
- Conteúdo mais claro, confiável e útil, independentemente de a descoberta ocorrer na busca tradicional ou generativa.

### Ações Recomendadas

1. Priorizar conteúdo original, específico e sustentado pelas pesquisas do taxon.
2. Não criar `llms.txt`, schema especial ou gating apenas para alegar otimização para IA.
3. Medir visibilidade generativa somente quando o relatório oficial estiver disponível, conforme `prod#20`.

### Fonte Oficial

- [Google — Optimizing for generative AI features](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)

---

## 7 — Google Preferred Sources *(🟩 Disponível globalmente)*
2025-09-15  
Atualizado em 2026-07-20

### Descrição  
O Google permite que usuários escolham domínios ou subdomínios como fontes preferidas. Conteúdo recente dessas fontes pode ganhar destaque em Top Stories e, onde disponível, em AI Mode e AI Overviews. Sites elegíveis podem usar o deeplink ou os assets oficiais para convidar leitores a fazer essa escolha.

### Valor para o Projeto  
- Pode apoiar clientes com publicação recorrente e audiência própria.
- Não se aplica automaticamente a landing pages promocionais sem conteúdo editorial recente.

### Valor para o Usuário  
- Permite optar por ver com mais destaque fontes que já considera úteis.

### Ações Recomendadas

1. Verificar elegibilidade do domínio na ferramenta oficial antes de propor CTA.
2. Usar somente em casos de conteúdo recorrente, sem prometer ranking ou destaque.
3. Não adicionar o CTA ao template geral de landing pages.

### Fonte Oficial

- [Google — Help your readers find your site through preferred sources](https://developers.google.com/search/docs/appearance/preferred-sources)

---

## 8 — Meta Value Rules e Conversions API *(🟨 Capacidades separadas)*
2025-10-10  
Atualizado em 2026-07-20

### Descrição  
Value Rules permitem informar ao sistema de anúncios diferenças de valor por critérios de audiência, placement e local de conversão. Conversions API é outra capacidade: conecta dados de marketing do anunciante, como eventos web, app, offline ou business messaging, aos sistemas da Meta. Uma não implementa nem exige automaticamente a outra.

### Valor para o Projeto  
- Permite avaliar otimização por valor e envio server-side de eventos como decisões independentes.
- Evita tratar qualquer clique ou scroll como dado automaticamente apropriado para Ads.

### Valor para o Usuário  
- Pode melhorar mensuração e otimização quando houver campanha, consentimento, evento e valor comercial definidos.

### Ações Recomendadas

1. Não incluir nenhuma das capacidades na primeira entrega genérica de LP.
2. Para Value Rules, exigir hipótese de valor e campanha real.
3. Para Conversions API, exigir plano próprio de tracking, consentimento, minimização de dados, deduplicação e validação.

### Fontes Oficiais

- [Meta — Value Rules](https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding/value-rules)
- [Meta — Conversions API](https://developers.facebook.com/documentation/ads-commerce/conversions-api)

---

## 9 — Google Ads Text Guidelines *(🧪 Beta; migração para AI Max anunciada)*
2025-10-14  
Atualizado em 2026-08-10

### Status no Projeto

- Status: não implementado; o repositório não contém integração, configuração ou campanha Google Ads executável.
- Evidência: `prod#9` aparece somente neste catálogo; as referências a Google Ads no planejamento e nos blueprints são orientações e fronteiras futuras, não uma conta ou campanha conectada.
- Mudança externa: a partir de setembro de 2026, o Google informa que campanhas Search que já usam Text Customization serão migradas automaticamente para AI Max.

### Descrição  
Recurso em beta no nível da campanha para orientar assets criados exclusivamente por Text Customization em campanhas Performance Max e Search, incluindo restrições de termos, mensagens e tom. Text Customization precisa estar habilitado para que as diretrizes tenham efeito.

Em Search, Text Customization passa a operar dentro de AI Max. A migração anunciada exige revisar a configuração completa da campanha: desabilitar Text Customization interrompe os assets gerados e também desabilita Final URL Expansion quando esta estiver ativa.

### Valor para o Projeto  
- Pode preservar restrições de marca em campanhas que usem geração automática de texto.
- Complementa, sem substituir, copy aprovada, revisão humana e políticas do Google Ads.

### Valor para o Usuário  
- Maior consistência entre a comunicação aprovada e variações geradas pelo Google Ads.

### Ações Recomendadas

1. Usar somente em campanha real com Text Customization habilitado.
2. Antes de setembro de 2026, auditar campanhas Search existentes que usem a capacidade e revisar explicitamente o upgrade para AI Max, incluindo Final URL Expansion.
3. Validar no relatório de assets o texto efetivamente veiculado e remover variações inadequadas; não tratar automação, guidelines ou avaliação de força do anúncio como substitutos de revisão humana.
4. Não tratar o beta como contrato garantido nem como recurso da landing page.
5. Não habilitar AI Max, alterar campanha ou ampliar escopo por causa deste registro.

### Fonte Oficial

- [Google Ads — Use text guidelines with Performance Max and Search campaigns](https://support.google.com/google-ads/answer/16489313)
- [Google Ads — About text customization in Search campaigns](https://support.google.com/google-ads/answer/11259373)
- [Google Ads — Turn text customization on or off in Search campaigns](https://support.google.com/google-ads/answer/16738708)

---

## 12 — Navegação multi-contas e LPs *(🟨 Adoção condicional)*
2025-11-20  
Atualizado em 2026-08-03

### Status no Projeto

- Status: Não implementado — oportunidade futura para operação de parceiros e agências.
- Evidência: não há breadcrumbs, switcher global, favoritos ou recentes no runtime; o roadmap mantém o Partner Dashboard como evolução e exclui navegação global multi-contas do recorte atual.

### Descrição

Evoluir a navegação para deixar explícito o contexto **Parceiro → Conta → LP → Seção** e permitir troca rápida entre entidades quando a operação real superar o fluxo atual.

### Valor para o Projeto

- Pode reduzir erro de contexto em cenários com muitas contas e LPs.
- Oferece uma direção de UX para o Partner Dashboard sem antecipar um sistema de navegação completo.
- Preserva a hierarquia de acesso existente como fonte de autorização server-side.

### Valor para o Usuário

- Ajuda operadores a entender onde estão e a trocar de conta ou LP com menos passos.
- Pode reduzir retrabalho causado por editar ou consultar a entidade errada.

### Gatilho futuro de avaliação

Avaliar somente quando houver:

1. Partner Dashboard ou fluxo equivalente aprovado;
2. usuários operando múltiplas contas ou LPs de forma recorrente;
3. evidência de perda de tempo ou erro de contexto no fluxo atual;
4. autorização server-side e estados bloqueados definidos para cada destino.

### Ações Recomendadas

1. Validar primeiro breadcrumbs e um switcher de contexto enxuto.
2. Adicionar favoritos, recentes, avatares ou telemetria apenas se houver necessidade observada.
3. Não fazer o client reinterpretar acesso nem expor destinos sem autorização.
4. Não criar nova infraestrutura por causa deste registro.

---

## 14 — Priorizar Reconhecimento nos Testes Iniciais *(✅ Implementado em recortes)*

2025-11-20  
Atualizado em 2026-08-04

### Estado e rastreabilidade

- Estado: incorporado parcialmente como critério de UX, sem telemetria ou programa próprio de testes.
- Evidência: o roadmap registra `prod#14` como aplicado; a matriz E11.2 incorporou reconhecimento do próximo passo correto para owner e non-owner.
- Recortes: E10.7 e E11.2.
- Escopo remanescente: aplicar o princípio em novos fluxos quando pertinente, sem transformar tempo de clique ou descoberta em métrica obrigatória por padrão.
- O ID permanece como referência do critério aplicado.

---

## 15 — Automação de Microeventos em LPs *(🟨 Estratégico; implementação progressiva)*

2025-11-17  
Atualizado em 2026-08-04

### Status no Projeto

- Status: implementado parcialmente no tracking mínimo; automação, segmentação e integrações permanecem futuras.
- Evidência: a E10.6 implementou `commercial_page_view`, `commercial_primary_cta_click` e `commercial_plan_cta_click`; não há `events_analytics`, taxonomia ampliada, RD Station, Meta Ads ou WhatsApp Business Platform integrados.
- Relação com `supa#19` e `supa#27`: esses IDs preservam a origem técnica das propostas de analytics e remarketing; `prod#15` é a referência de produto para sua evolução comercial.

### Descrição

Evoluir o tracking mínimo para microeventos selecionados — como scroll qualificado, visualização de preço, abertura de FAQ, início ou envio de formulário e clique contextual — capazes de alimentar análise, segmentação e follow-up por canais aprovados, incluindo e-mail e WhatsApp.

O valor está na cadeia `comportamento → sinal → segmentação → ação comercial`, não na coleta indiscriminada de eventos.

### Horizonte sugerido

- Starter: preservar os três eventos comerciais canônicos já implementados.
- Lite: adicionar somente microeventos internos com hipótese de decisão e taxonomia mínima.
- Pro: permitir segmentações e integrações aprovadas com CRM, Meta Ads e WhatsApp.
- Ultra: avaliar otimização multicanal e assistência por IA com mensuração e revisão humana.

A distribuição é hipótese estratégica e não decisão comercial final de plano.

### Valor para o Projeto

- Cria diferenciação por inteligência comercial progressiva.
- Permite melhorar conversão e priorizar leads sem exigir todo o pacote na primeira LP.
- Pode conectar LP, CRM, mídia e WhatsApp quando existir operação real.

### Gatilho futuro de avaliação

Avaliar cada avanço somente quando houver:

1. pergunta de negócio que o evento responderá;
2. ação concreta ligada ao sinal;
3. volume mínimo, consentimento, finalidade e retenção definidos;
4. canal e integração reais;
5. responsável por interpretar resultado e interromper automações inadequadas.

### Dependências, riscos e limites

- Evitar eventos sem uso, duplicação client/server, identificação excessiva e atribuição falsa de causalidade.
- WhatsApp, Meta Ads e RD Station exigem contas, autenticação, políticas, consentimento e contratos próprios.
- Follow-up automático exige opt-in, frequência, handoff humano, exclusão e observabilidade.
- Não criar tabela, rota, job, pixel, fila, agente ou automação nesta rodada.

### Fontes Oficiais

- [Meta — Conversions API](https://developers.facebook.com/documentation/ads-commerce/conversions-api)
- [RD Station — Conversão via API](https://developers.rdstation.com/reference/conversao)
- [Meta — Centralized Campaigns, AI Support and More for Businesses on WhatsApp](https://about.fb.com/news/2025/07/centralized-campaigns-ai-support-businesses-whatsapp/)

---

## 16 — QA visual e validação de UX em Preview *(✅ Implementado em recortes)*

2026-06-12  
Atualizado em 2026-08-20

### Estado e rastreabilidade

- Estado: baseline recorrente já incorporado em recortes; não existe implementação autônoma pendente nem dependência obrigatória de ferramenta paga.
- Evidência: o roadmap registra `prod#16` como aplicado; a matriz E11.2 incorporou validação em Preview, desktop/mobile, papéis e estados de entitlement.
- Recortes: E10.6/E10.7 e E11.2.
- Aplicação futura: toda nova superfície de UI deve repetir proporcionalmente a validação aplicável; o critério é global, mas sua execução não é automática e não substitui revisão manual.
- Relação técnica: `vercel#15` permanece como opção de ferramenta; `prod#16` preserva a prática de produto.
- O ID permanece como referência dos critérios aplicados.

---

## 17 — WCAG 2.2 como baseline de acessibilidade *(🟩 Recomendação W3C)*
2026-07-04  
Atualizado em 2026-08-20

### Status no Projeto

- Status: parcialmente incorporado — baseline global aplicada manualmente nos recortes de UI relevantes, sem implementação única ou alegação de conformidade integral.
- Evidência: a matriz E11 incorporou teclado, foco, labels, erros, feedback, contraste, toque e ausência de interação exclusiva por hover; o Design System já contém guardrails acessíveis, mas não há auditoria WCAG 2.2 global do produto.

### Descrição

Usar WCAG 2.2 como referência de produto para LPs, dashboards, autenticação e onboarding, priorizando critérios aplicáveis ao fluxo real e combinando inspeção automática com validação manual.

### Valor para o Projeto

- Mantém um baseline consistente para decisões de UX e critérios de aceite.
- Reduz regressões em navegação por teclado, foco, mensagens, contraste, alvos de toque e autenticação acessível.
- Continua reutilizável em módulos ainda não avaliados.

### Valor para o Usuário

- Melhora compreensão, legibilidade e operação por pessoas com diferentes necessidades de acesso.

### Ações Recomendadas

1. Aplicar obrigatoriamente os critérios relevantes em cada fluxo de UI e registrar evidência nas validações do caso; o recorte não rediscute a adoção do baseline.
2. Tratar ferramentas automáticas como apoio, não como prova suficiente de conformidade.
3. Não declarar conformidade WCAG integral sem auditoria, escopo e evidências próprios.
4. Remover este item do catálogo ativo somente quando o baseline estiver absorvido de forma canônica e abrangente.

### Fonte Oficial

- [W3C — Web Content Accessibility Guidelines (WCAG) 2.2](https://www.w3.org/TR/WCAG22/)

---

## 18 — OpenAI Plugins e MCP Apps *(🟨 Avaliação futura)*
2026-07-04  
Atualizado em 2026-08-03

### Status no Projeto

- Status: Fundação parcial, sem produto distribuído.
- Evidência: o repositório possui o service read-only `LPF Supabase Inspect MCP` e contratos operacionais de MCP, mas não possui manifesto de plugin, UI MCP Apps, autenticação de usuário final, submissão ou caso comercial aprovado.

### Descrição

A arquitetura atual da OpenAI permite empacotar skills e conexões a serviços externos em plugins reutilizáveis para ChatGPT e Codex. Capacidades com dados vivos ou ações usam servidor MCP; uma UI baseada no padrão MCP Apps é opcional quando o fluxo se beneficia de interação visual.

### Valor para o Projeto

- Pode transformar capacidades já úteis em um canal assistido e distribuível, sem substituir o produto web.
- Permite começar por instruções e tools existentes, adicionando UI apenas quando houver ganho de experiência.
- Torna explícita a diferença entre um MCP técnico interno e um produto com autenticação, política de dados e suporte.

### Valor para o Usuário

- Pode oferecer diagnóstico, briefing, consulta de relatórios ou orientação comercial no ambiente em que o cliente já trabalha.

### Gatilho futuro de avaliação

Avaliar somente quando houver:

1. um fluxo recorrente melhor do que a experiência web ou manual atual;
2. público, dados acessados, política de retenção e responsável pelo suporte definidos;
3. autenticação e escopos mínimos compatíveis com o consumidor;
4. critério de distribuição, manutenção e custo aprovado;
5. confirmação humana para qualquer operação irreversível ou que altere dados.

### Dependências, riscos e limites

- Validar inputs no servidor e assumir exposição a prompt injection.
- Não enviar secrets ou dados além do necessário no conteúdo retornado.
- Começar por leitura; writes exigem autorização, confirmação e trilha de auditoria.
- Não confundir existência do MCP interno com prontidão para publicação.
- Não criar plugin, UI, auth, rota, banco ou nova infraestrutura por causa deste registro.

### Fontes Oficiais

- [OpenAI — Plugins](https://developers.openai.com/plugins)
- [OpenAI — MCP server and UI quickstart](https://developers.openai.com/plugins/build/app-quickstart)
- [OpenAI — Security & Privacy for Plugins](https://developers.openai.com/plugins/guides/security-privacy)

---

## 19 — Stripe Entitlements como referência de feature access *(⚪ Registro histórico — implementado e absorvido)*

2026-07-04  
Atualizado em 2026-08-20

### Estado e rastreabilidade

- Estado final: implementado e integralmente absorvido como benchmark e trava arquitetural; Stripe Entitlements não foi adotado como autoridade do runtime.
- Evidência: E9 implementou `account_commercial_entitlements`, view efetiva, adapter Admin e webhook Stripe; `docs/base-tecnica.md` registra o boundary interno e proíbe plano, assinatura, feature ou resposta externa de provedor comercial de substituir esse sinal.
- Recortes: E9, E9.7, E11.2 e superfícies comerciais relacionadas.
- Documento competente: `docs/base-tecnica.md`, especialmente as regras de capacidades comerciais, commercial entitlements, webhook Stripe e consumo pelo LP Builder.
- Decisão preservada: plano, assinatura ou feature externa não substituem o sinal e a persistência internos; qualquer mudança exige novo recorte aprovado.
- O ID permanece histórico e não pode ser reutilizado.

---
## 20 — Search Generative AI Performance no Search Console *(🧪 Rollout limitado)*

2026-06-03

### Descrição

Relatórios dedicados do Search Console mostram visibilidade de URLs em recursos generativos do Google Search e Discover, com impressões, páginas, países, dispositivos e evolução temporal. O lançamento está restrito inicialmente a um subconjunto de sites.

### Valor para o Projeto

- Cria uma fonte oficial para avaliar presença de LPs e conteúdos em AI Overviews, AI Mode e experiências generativas do Discover.
- Permite separar mensuração real de alegações genéricas de AEO/GEO.
- Pode apoiar análise consultiva futura sem exigir tracking próprio da LP.

### Valor para o Usuário

- Oferece evidência de como o conteúdo é descoberto em experiências generativas quando o relatório estiver disponível para o domínio.

### Ações Recomendadas

1. Não criar integração, dashboard ou promessa comercial enquanto o relatório não estiver disponível ao domínio avaliado.
2. Quando disponível, usar como fonte complementar ao desempenho geral do Search Console.
3. Interpretar impressões como visibilidade, não como lead, conversão ou receita.

### Limites

- Rollout limitado; disponibilidade não garantida para o projeto ou clientes.
- O relatório não informa ranking interno, prompts completos nem causalidade de conversão.
- Não substitui Search Console geral, analytics da LP ou dados de campanha.

### Fonte Oficial

- [Google Search Central — Search Generative AI performance reports](https://developers.google.com/search/blog/2026/06/gen-ai-performance-reports)

---

## 21 — Meta Ads MCP Server *(🧪 Disponível; adoção condicional)*

2026-07-16

### Status no Projeto

- Status: Não implementado — capacidade futura de operação assistida
- Evidência: o repositório não possui Meta Ads MCP, Meta app ou fluxo aprovado de gestão de campanhas por agente; `prod#8` cobre Value Rules e Conversions API, não operação de campanhas por MCP

### Descrição

Servidor MCP oficial da Meta Ads, disponível para desenvolvedores com Meta app próprio, para expor capacidades de gestão de anúncios a clientes e ambientes compatíveis com MCP. Entre os casos oficiais estão operações sobre campanhas e catálogos, além de testes A/B e estudos de lift de conversão.

O recurso é uma camada operacional sobre capacidades da Meta Ads. Não substitui tracking, consentimento, Conversions API, governança de campanhas nem revisão humana.

### Valor para o Projeto

- Pode reduzir trabalho manual em operações futuras de campanhas ligadas às LPs.
- Pode apoiar diagnóstico e ações assistidas quando houver cliente, permissões e processo comercial aprovados.
- Complementa a Meta Marketing API e o `prod#8`; pode se sobrepor a uma integração customizada de gestão de anúncios.
- Preserva uma alternativa oficial antes de construir interface ou automação própria.

### Valor para o Usuário

- Futuro: operação mais rápida e contextual de campanhas, com possibilidade de relacionar anúncios, catálogos, testes e conversões ao trabalho de landing pages.

### Gatilho futuro de avaliação

Avaliar somente quando houver:

1. cliente ou operação aprovada que exija gestão recorrente de Meta Ads;
2. Meta app, escopos e responsáveis definidos;
3. comparação objetiva com Meta Business Manager e integração direta pela Marketing API;
4. fluxo de aprovação humana para toda ação que altere campanha, público, orçamento ou gasto.

### Dependências, riscos e limites

- Exige Meta app, autenticação, permissões e conformidade com políticas e versões da Marketing API.
- Tratar dados de anúncios, públicos e conversões segundo LGPD, consentimento e menor privilégio.
- Risco de prompt injection, ação destrutiva e gasto indevido exige allowlist de tools, confirmação humana e limites operacionais.
- Começar por leitura e diagnóstico; não autorizar mutações ou publicação automática no primeiro recorte.
- Não criar MCP, agente, rota, job, automação, banco ou nova infraestrutura por causa deste registro.
- O registro não autoriza implementação.

### Ações Recomendadas

1. Manter como capacidade futura e condicional.
2. Reavaliar apenas diante do gatilho definido.
3. Em eventual prova, comparar valor, custo, segurança e manutenção com operação manual e API direta.
4. Documentar permissões, aprovação e rollback antes de qualquer mutação.

### Fonte Oficial

- [Meta for Developers — Meta's ads MCP server is now available for developers](https://developers.facebook.com/blog/post/2026/07/16/meta-ads-mcp-server/)

---

## 22 — Propriedades de plataformas sociais no Search Console *(🟩 Disponível globalmente; uso condicional)*
2026-07-07  
Atualizado em 2026-08-03

### Status no Projeto

- Status: Disponível externamente, não adotado no projeto.
- Evidência: desde 2026-07-29, as propriedades de Instagram, TikTok, X e YouTube estão disponíveis globalmente; o repositório não possui autorização de conta social nem relatório consolidado de Search Console.

### Descrição

Após autorizar e verificar uma conta de plataforma compatível, o Search Console permite analisar como posts sociais e vídeos aparecem no Google Search, Discover e Google News. Os relatórios incluem cliques, impressões, consultas, posts de melhor desempenho, tendências e marcos de crescimento.

### Valor para o Projeto

- Pode complementar a análise de aquisição de clientes que já operam conteúdo social ou em vídeo.
- Oferece mensuração oficial sem criar coleta própria.
- Separa descoberta orgânica no Google das métricas da landing page, mídia paga e conversão.

### Valor para o Usuário

- Mostra quais conteúdos e consultas geram descoberta nos produtos do Google.
- Pode orientar temas e canais quando já existe uma operação editorial recorrente.

### Gatilho futuro de avaliação

Avaliar somente quando houver:

1. cliente com conta ativa em ao menos uma plataforma suportada;
2. responsável autorizado a conectar e verificar a conta;
3. necessidade real de analisar descoberta orgânica desse conteúdo;
4. plano para interpretar os dados junto das demais fontes de aquisição.

### Dependências, riscos e limites

- Exige autorização e verificação da conta da plataforma.
- Não mede alcance total da rede social, mídia paga, leads ou receita.
- Não substitui analytics da LP, dados nativos da plataforma, Ads ou CRM.
- Não criar integração, banco, dashboard ou promessa comercial por causa deste registro.
- O registro não autoriza conexão de contas nem tratamento de dados de clientes.

### Ações Recomendadas

1. Manter como capacidade condicional de mensuração.
2. Conectar apenas diante do gatilho definido e com responsável pelo acesso.
3. Interpretar cliques e impressões como descoberta orgânica, sem atribuir conversão automaticamente.

### Fontes Oficiais

- [Google Search Central — Platform properties roll out globally](https://developers.google.com/search/blog/2026/07/platform-properties-social-video-guide)
- [Google Search Central — Social and video platform performance](https://developers.google.com/search/blog/2026/07/search-console-social-video-platforms)

---

## 23 — WhatsApp Business Platform e Meta Business Agent *(🟨 Estratégico; adoção progressiva)*

2026-06-03  
Catalogado em 2026-08-04

### Status no Projeto

- Status: não implementado; canal existente apenas em recortes básicos de preferência e CTA.
- Evidência: o produto registra WhatsApp como canal e possui CTAs/fallbacks, mas não há WhatsApp Business Platform, Cloud API, Business Agent, campanhas centralizadas, voz, vídeo ou automação oficial integrados.
- Relação com a stack: complementar ao produto e potencialmente sobreposto à arquitetura própria de IA/OpenAI; exige comparação antes de adoção.

### Descrição

A Meta reúne capacidades para atendimento, qualificação, recomendações, agendamento, venda, handoff humano e campanhas no WhatsApp. O Meta Business Agent e sua plataforma ampliam esse caminho com IA, conexões a sistemas, controles, guardrails e mensuração. A WhatsApp Business Platform também evolui campanhas pelo Ads Manager e opções de chamada, voz e vídeo.

### Horizonte sugerido

- Starter: CTA, preferência de canal e continuidade manual segura.
- Lite: melhorar entrada, contexto e mensuração da conversa sem automação complexa.
- Pro: avaliar Business Platform, campanhas, templates, integrações e handoff humano.
- Ultra: avaliar Business Agent Platform, IA multicanal, ações integradas e mensuração avançada.

A distribuição é hipótese de evolução, não promessa comercial nem autorização técnica.

### Valor para o Projeto

- Mantém o produto competitivo no canal comercial prioritário.
- Pode reduzir tempo de resposta, qualificar leads e aproximar aquisição, atendimento e venda.
- Preserva alternativa oficial antes de construir mensageria ou agente próprios.

### Gatilho futuro de avaliação

Avaliar somente quando houver:

1. disponibilidade e elegibilidade confirmadas para o Brasil e para a conta;
2. operação comercial real com volume, responsáveis e metas;
3. preço, templates, opt-in, consentimento, retenção e políticas mapeados;
4. handoff humano, fallback e desligamento definidos;
5. comparação objetiva com operação manual, integração própria e agentes OpenAI.

### Dependências, riscos e limites

- Exige conta empresarial, número, verificação, permissões e conformidade com políticas da Meta.
- Pode introduzir lock-in, custo por mensagem/assinatura, tratamento de dados e dependência operacional.
- IA não pode responder ou agir sem limites, fontes, revisão, handoff e mensuração adequados.
- Não criar app Meta, Cloud API, rota, webhook, banco, job, agente ou automação nesta rodada.

### Fontes Oficiais

- [Meta — Be There for Every Customer With Meta Business Agent](https://about.fb.com/news/2026/06/meta-business-agent/)
- [Meta — Centralized Campaigns, AI Support and More for Businesses on WhatsApp](https://about.fb.com/news/2025/07/centralized-campaigns-ai-support-businesses-whatsapp/)
- [Meta — New AI Tools, Meta Verified and More for Businesses on WhatsApp](https://about.fb.com/news/2024/06/new-ai-tools-meta-verified-and-more-for-businesses-on-whatsapp/)

---

## 24 — Atendimento e qualificação por Instagram Direct *(🟨 Estratégico; adoção dependente de recorte)*

2026-08-19  
Catalogado em 2026-08-20

### Status no Projeto

- Status: não implementado; o Instagram é canal estratégico, mas não há mensageria, bot, webhook, Meta app ou automação de DM no repositório.
- Evidência: `README.md`, busca semântica no repositório e `vercel#30`, que preserva a alternativa técnica do Vercel Chat SDK.
- Natureza de uso: dependente de recorte de produto e canal.
- Relação com a stack e o produto: complementar a `prod#22` para mensuração social e comparável a `prod#23` como canal estratégico distinto, sem pressupor arquitetura multicanal; a descrição técnica do adapter permanece em `vercel#30`.
- Horizonte sugerido: Pro, Ultra ou indefinido, sujeito à decisão do Estrategista.

### Descrição

Mensageria por Instagram Direct pode apoiar atendimento, qualificação, venda e nutrição a partir de DMs e respostas a Stories. A novidade do adapter oficial do Vercel Chat SDK oferece uma alternativa TypeScript para o transporte, mas a capacidade de produto continua subordinada às regras e à Instagram Messaging API da Meta.

O caso não deve ser tratado como chatbot genérico nem como extensão automática do WhatsApp. Cada canal possui permissões, janelas, formatos, contexto e expectativas próprios.

No primeiro recorte aprovado de mensageria social, o projeto deve comparar WhatsApp e Instagram como canais distintos e escolher somente o canal exigido pelo caso real. O WhatsApp permanece prioritário conforme o `README.md`, salvo demanda concreta que justifique iniciar por Instagram. Essa avaliação não autoriza antecipar inbox universal, roteador, banco, agente ou arquitetura multicanal genérica.

### Valor para o Projeto

- Aproxima aquisição social, conversa comercial e futura continuidade multicanal.
- Pode reduzir perda de leads que já iniciam contato pelo Instagram.
- Preserva uma alternativa oficial antes de construir integração própria ou interface operacional.
- Pode permitir experimentos controlados de qualificação quando houver operação e demanda reais.

### Valor para o Usuário

- Possibilidade futura de responder e qualificar contatos no canal em que eles já interagem com o negócio.
- Continuidade mais rápida entre conteúdo, Story, DM e ação comercial, com handoff humano quando necessário.

### Gatilho futuro de avaliação

Avaliar somente quando houver:

1. cliente ou operação aprovada com volume e objetivo comercial reais em Instagram DM;
2. conta profissional, Meta app, permissões, webhooks e responsável operacional definidos;
3. regras de janela de atendimento, opt-in, privacidade, retenção, exclusão e handoff humano mapeadas;
4. comparação objetiva entre operação manual, integração direta pela Meta e alternativa `vercel#30`;
5. métricas de sucesso como tempo de resposta, qualificação, conversão assistida e necessidade de intervenção humana.

### Dependências, riscos e limites

- Depende de elegibilidade, políticas, revisão de app, disponibilidade e limites da Meta.
- Automação pode gerar resposta inadequada, spam, perda de contexto ou bloqueio da conta.
- Exige separação entre resposta assistida, envio automático e ação que dependa de confirmação humana.
- Dados e histórico de conversa exigem finalidade, minimização, segurança, retenção e LGPD.
- Não criar app Meta, bot, webhook, rota, banco, job, agente, automação, credencial ou interface nesta rodada.
- O registro não autoriza implementação, conexão de conta nem promessa comercial.

### Ações Recomendadas

1. Manter como capacidade estratégica futura do canal Instagram.
2. Reavaliar no primeiro recorte aprovado de mensageria ou qualificação social, comparando explicitamente o caso com o canal prioritário WhatsApp e escolhendo somente um canal para o recorte.
3. Começar, se Instagram for aprovado, por leitura/assistência e handoff humano antes de respostas ou ações autônomas.
4. Tratar `vercel#30` como alternativa técnica a comparar, não como escolha automática nem fundamento para arquitetura multicanal.

### Fontes Oficiais

- [Vercel Changelog — Chat SDK adds Instagram adapter](https://vercel.com/changelog/chat-sdk-adds-instagram-adapter)
- [Meta for Developers — Instagram Messaging API](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/messaging-api/)

---

## Registro da rodada de 2026-08-10

### Veredito

- Ajustado `prod#9` para registrar a migração anunciada de Text Customization para AI Max em campanhas Search a partir de setembro de 2026, sem autorizar conexão ou alteração de campanha.
- Mantidos os demais IDs e estados; nenhum item foi arquivado, absorvido, superado ou adicionado nesta rodada.

### Cobertura estratégica e fontes oficiais

- IA, automações e agentes: changelog e documentação da OpenAI; as novidades da Responses API não criaram caso de uso superior ao recorte já governado, e a desativação da Assistants API não afeta o projeto, que usa Responses API.
- Landing pages, SEO, performance e aquisição: Google Search Central, web.dev e Google Ads; não houve novidade relevante de Search Central ou web.dev, e a mudança de AI Max foi absorvida em `prod#9`.
- Instagram e mídia Meta: Meta for Developers e Meta Newsroom; o Meta AI Developer Assistant melhora suporte ao desenvolvedor, mas não acrescenta capacidade de produto ao catálogo.
- WhatsApp: WhatsApp Business Platform, Meta Business Messaging e fontes oficiais de negócio da WhatsApp; a publicação sobre orquestração de atendimento reforça `prod#23`, sem alterar disponibilidade, integração ou decisão do projeto.
- E-mail: changelog oficial da Resend; folders de templates não se aplicam ao uso atual por SMTP do Supabase Auth, e o Remote MCP sobrepõe o radar geral de `prod#18` sem caso de uso aprovado.
- Monetização: changelog e documentação da Stripe; nenhuma mudança validada exigiu ajustar o benchmark e a trava de autoridade interna de `prod#19`.
- Acessibilidade: W3C/WAI e WCAG 2.2; nenhuma mudança validada substituiu ou alterou o baseline de `prod#17`.
- Updates técnicos com impacto potencial em produto: os diffs desta execução em Supabase, Vercel e GitHub foram revisados; não houve efeito direto que justificasse duplicação neste catálogo.

### Itens mantidos e avaliados sem adição

- Mantidos `prod#1`, `prod#3`, `prod#4`, `prod#6`, `prod#7`, `prod#8`, `prod#12`, `prod#14`, `prod#15`, `prod#16`, `prod#17`, `prod#18`, `prod#19`, `prod#20`, `prod#21`, `prod#22` e `prod#23` nos estados e horizontes já registrados.
- Não adicionados: Fast mode e long context da OpenAI, desativação da Assistants API, Meta AI Developer Assistant, mudança de lances do Google Ads para campanhas limitadas por orçamento, Resend Template Folders e Remote MCP, e Web Sustainability Guidelines. Faltou caso de uso atual, superioridade sobre item existente ou maturidade normativa aplicável; nenhum foi descartado apenas por estar fora do Starter ou do MVP.
- Não validados: estado de contas, campanhas, elegibilidade, planos e custos externos, pois o repositório não contém credenciais nem acesso operacional e a rodada não realizou smoke autenticado.

### Validação e rastreabilidade

- O maior ID histórico permanece `prod#23`; nenhum ID desapareceu, foi renumerado ou reutilizado.
- Antes do ajuste, foram buscados `prod#9`, título, Text Guidelines, Text Customization, AI Max, Google Ads e artefatos de campanha em documentos e código; não foi encontrada implementação executável.
- O ajuste segue o `README.md`, preserva revisão humana e não autoriza código, configuração, integração, campanha, nova infraestrutura ou decisão final de plano.

---


## Registro da rodada de 2026-08-20

### Veredito

- `prod#24` foi adicionado para preservar a oportunidade de atendimento e qualificação por Instagram Direct, sem duplicar a descrição técnica de `vercel#30` e sem autorizar implementação.
- Mantidos os demais IDs e estados; nenhum item foi arquivado, absorvido, superado ou reclassificado nesta rodada.

### Cobertura estratégica e fontes oficiais

- IA, automações e agentes: OpenAI News e documentação oficial; Ultrafast para GPT-5.6 Sol é opção de processamento/modelo e deve ser avaliada no fluxo de workloads, não como nova capacidade de produto.
- Landing pages, SEO, performance e aquisição: Google Search Central, web.dev e Google Ads; não houve novidade de Search Central/web.dev aplicável, e a mudança de lances para campanhas limitadas por orçamento não cria integração nem caso de produto no projeto.
- Instagram e mídia Meta: Meta for Developers e a novidade oficial Vercel do adapter Instagram; o impacto direto foi catalogado em `prod#24`, com detalhe técnico em `vercel#30`.
- WhatsApp: WhatsApp Business Platform, Meta Business Messaging e Meta Newsroom; nenhuma novidade do período alterou `prod#23` ou seus gatilhos.
- E-mail: Resend Changelog; cancelamento de Broadcast, Agent Plugin e Compatibility Checker não se aplicam ao SMTP do Supabase Auth nem demonstram caso novo de produto.
- Monetização: Stripe Docs/Changelog e Blog; nenhuma mudança validada alterou `prod#19` ou a autoridade interna de entitlements.
- Acessibilidade: W3C/WAI e WCAG 2.2; nenhuma publicação do período alterou o baseline de `prod#17`.
- Updates técnicos com impacto potencial em produto: os resultados desta execução em Supabase, Vercel e GitHub foram revisados; `supa#69` é observabilidade transversal sem capacidade de produto, `vercel#30` fundamenta `prod#24`, e o catálogo GitHub não exigiu alteração.

### Itens mantidos e avaliados sem adição

- Mantidos `prod#1`, `prod#3`, `prod#4`, `prod#6`, `prod#7`, `prod#8`, `prod#9`, `prod#12`, `prod#14`, `prod#15`, `prod#16`, `prod#17`, `prod#18`, `prod#19`, `prod#20`, `prod#21`, `prod#22` e `prod#23` nos estados e horizontes já registrados.
- Não adicionados: OpenAI Ultrafast, ChatGPT for Teens, novidades Resend, mudanças operacionais do Google Ads, updates Stripe, Vercel KMS/Connect e novidades Copilot/GitHub. Faltou capacidade de produto nova, caso aprovado, superioridade sobre item existente ou aderência ao uso real; nenhum foi descartado apenas por estar fora do Starter ou do MVP.
- Não validados: elegibilidade e permissões do Instagram, custos e limites do adapter, estado de contas/campanhas externas e comportamento autenticado, pois a rodada não conectou contas nem realizou smoke operacional.

### Validação e rastreabilidade

- O maior ID histórico anterior era `prod#23`; `prod#24` foi atribuído acima dele e nenhum ID desapareceu, foi renumerado ou reutilizado.
- Antes da adição, foram buscados o ID, o título, Instagram, DM, Messaging API, Chat SDK, adapter, webhooks, bots e artefatos associados; não foi encontrada implementação executável.
- A atualização segue o `README.md`, preserva revisão humana e não autoriza código, configuração, integração, conexão de conta, campanha, nova infraestrutura ou decisão final de plano.

---
