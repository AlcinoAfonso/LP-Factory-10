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
* Meta e Google Ads, para aquisição, conversão e tracking;
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
5. confirmar no roadmap e no repositório se já existe implementação.

## Convenção de referência

O identificador canônico dos itens deste catálogo é `prod#n`.

Esse identificador deve ser usado no roadmap, Base Técnica, briefings, relatórios e referências cruzadas. A numeração não deve ser reutilizada após remoção, depreciação ou substituição de um item.

## Critério do catálogo ativo

Este documento deve manter apenas práticas, capacidades e tendências de produto que ainda possam ser aproveitadas pelo Gestor de Updates em algum caso atual, futuro ou condicional.

Itens já absorvidos pela Base Técnica, duplicados em catálogos técnicos, genéricos demais ou sem aproveitamento concreto não permanecem no catálogo ativo.

Recursos pagos, enterprise ou futuros podem permanecer quando ainda tiverem aproveitamento possível em algum caso específico.

A rejeição ou adoção de cada item deve ser decidida caso a caso pelo Gestor de Updates, conforme o plano-base avaliado.

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

## 9 — Google Ads Text Guidelines *(🧪 Beta)*
2025-10-14  
Atualizado em 2026-07-20

### Descrição  
Recurso em beta no nível da campanha para orientar assets criados exclusivamente por Text Customization em campanhas Performance Max e Search, incluindo restrições de termos, mensagens e tom. Text Customization precisa estar habilitado para que as diretrizes tenham efeito.

### Valor para o Projeto  
- Pode preservar restrições de marca em campanhas que usem geração automática de texto.
- Complementa, sem substituir, copy aprovada, revisão humana e políticas do Google Ads.

### Valor para o Usuário  
- Maior consistência entre a comunicação aprovada e variações geradas pelo Google Ads.

### Ações Recomendadas

1. Usar somente em campanha real com Text Customization habilitado.
2. Não tratar o beta como contrato garantido nem como recurso da landing page.
3. Validar termos, tom e resultados gerados antes de ampliar uso.

### Fonte Oficial

- [Google Ads — Use text guidelines with Performance Max and Search campaigns](https://support.google.com/google-ads/answer/16489313)

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

## 17 — WCAG 2.2 como baseline de acessibilidade *(🟩 Recomendação W3C)*
2026-07-04  
Atualizado em 2026-08-03

### Status no Projeto

- Status: Parcialmente incorporado — baseline aplicada em recortes, sem alegação de conformidade integral.
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

1. Aplicar critérios relevantes por fluxo e registrar evidência nas validações do caso.
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
