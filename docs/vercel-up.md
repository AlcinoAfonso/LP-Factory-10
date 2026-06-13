# LP Factory 10 — Vercel + Next.js Update

---

## Convenção de leitura (mercado x projeto)

- O heading/badge de cada item representa o estado do recurso no mercado/plataforma (Vercel/Next.js/React).
- Cada item ativo possui um bloco `### Status no Projeto` para separar o estado de implementação no LP Factory 10.
- Valores aceitos em `Status no Projeto`:
  - `Não implementado`
  - `Em implementação por casos de uso`
  - `Implementado globalmente no projeto`
- Quando necessário, incluir observação curta complementar (ex.: `Duplicado`, `Superado por item mais novo`, `Deferido`, `Não apto no plano atual`).

---

## 1 — Vercel AI Cloud *(🟨 Disponibilidade por recurso/plano)*
2025-06-30

### Status no Projeto
- Status: Não implementado
- Evidência: `docs/roadmap.md` cita AI Gateway como referência futura (fase IA-ready), sem adoção operacional registrada no stack atual.
- Observação: monitoramento de mercado; disponibilidade varia por recurso/plano.

### Descrição
Conjunto de capacidades de plataforma com disponibilidade e cobrança próprias por recurso/plano:
- **AI Gateway:** endpoint unificado para acessar múltiplos modelos, acompanhar uso e orçamento, aplicar balanceamento e fallbacks.
- **Fluid Compute:** execução de Functions otimizada para concorrência e workloads com espera de I/O, com cobrança que distingue CPU ativa do tempo de espera/memória.
- **Sandbox:** ambientes Linux efêmeros e isolados para executar código não confiável, scripts gerados por agentes, testes e servidores temporários.
- **BotID:** proteção invisível contra bots para rotas sensíveis, com validação client-side e verificação server-side.

### Valor para o Projeto
- Pode apoiar workloads de IA, execução isolada e proteção de endpoints quando existir um caso de uso aprovado.
- Permite avaliar custo, segurança e operação por capacidade, sem tratar “AI Cloud” como adoção única ou automática.

### Valor para o Usuário
- Benefícios potenciais de resiliência, segurança e desempenho dependem de uma aplicação concreta e validada.

### Ações Recomendadas
1. Manter AI Gateway, Fluid Compute, Sandbox e BotID sem adoção no LP Factory 10 enquanto não houver caso aprovado.
2. Avaliar separadamente requisitos de plano, custos, dados e segurança antes de qualquer implementação.
3. Não transformar essas capacidades em requisito da primeira entrega da E10.6.

---

## 2 — Next.js 16 *(🟩 Estável)*
2025-10-22

### Status no Projeto
- Status: Implementado globalmente no projeto
- Evidência: `docs/base-tecnica.md` define Next.js 16.1.1 como base; `package.json` mantém `next` em `^16.1.1`.

### Descrição
Linha estável do Next.js adotada no projeto, com App Router e alinhamento ao stack atual.

### Valor para o Projeto
- Base técnica atual padronizada e documentada.
- Compatibilidade com práticas de manutenção contínua do repo.

### Valor para o Usuário
- Navegação e carregamento consistentes com o baseline atual da aplicação.

### Ações Recomendadas
1. Manter rotina contínua de validação de upgrades de patch.
2. Acompanhar breaking changes e notas de segurança/upgrade do ecossistema Next.

---

## 3 — Cache Components *(🟩 Estável — opt-in no Next.js 16)*
2025-10-22

### Status no Projeto
- Status: Não implementado
- Evidência: ausência de adoção explícita no roadmap e na configuração corrente do projeto; item mantido como monitoramento técnico.

### Descrição
Recurso oficial do Next.js 16 para controle de cache por componentes, com adoção opt-in.

### Valor para o Projeto
- Permite granularidade maior entre blocos estáticos e dinâmicos quando houver necessidade.

### Valor para o Usuário
- Pode melhorar latência e consistência de renderização em páginas com partes reutilizáveis.

### Ações Recomendadas
1. Avaliar somente em casos com benefício claro de performance.
2. Medir impacto em Web Vitals antes de qualquer adoção ampliada.

---

## 4 — Turbopack *(🟩 Estável)*
2025-10-22

### Status no Projeto
- Status: Não implementado
- Evidência: `docs/base-tecnica.md` registra priorização do Next 16 para Turbopack, sem migração mandatória do projeto como ação concluída.

### Descrição
Bundler oficial do ecossistema Next.js 16 para desenvolvimento/build, com foco em performance.

### Valor para o Projeto
- Potencial de reduzir tempo de build e iteração quando aplicável.

### Valor para o Usuário
- Entregas e ciclos de preview potencialmente mais rápidos.

### Ações Recomendadas
1. Validar comportamento e compatibilidade do bundler atual no contexto real do projeto.
2. Ajustar configuração/fallback apenas se surgir necessidade específica.

---

## 5 — Routing e Navegação Aprimorados *(🟩 Estável)*
2025-10-22

### Status no Projeto
- Status: Não implementado
- Evidência: não há adoção explícita registrada no roadmap para este pacote de capacidades como iniciativa dedicada.

### Descrição
Capacidades de navegação e roteamento do framework evoluídas no ciclo atual do Next.js.

### Valor para o Projeto
- Base para simplificar padrões de navegação quando houver demanda de produto.

### Valor para o Usuário
- Potencial de navegação mais fluida em fluxos críticos.

### Ações Recomendadas
1. Avaliar adoção incremental por necessidade funcional comprovada.

---

## 6 — DevTools MCP *(🟩 Disponível no ecossistema Next.js 16+)*
2025-10-22

### Status no Projeto
- Status: Não implementado
- Evidência: inexistência de configuração/adoção explícita no repositório atual (sem registro de uso operacional no roadmap/base técnica).

### Descrição
Integração MCP do Next.js para conectar agentes ao servidor de desenvolvimento e permitir acesso a erros de build, runtime e tipos, logs do navegador/servidor, metadados de projeto e páginas, rotas, componentes, Server Actions e informações de runtime em tempo real.

### Valor para o Projeto
- Pode acelerar diagnóstico técnico e dar mais contexto aos agentes durante o desenvolvimento.
- É uma avaliação futura de produtividade técnica, não uma feature de produto.

### Valor para o Usuário
- Indiretamente reduz tempo de resolução de incidentes.

### Ações Recomendadas
1. Avaliar adoção somente quando houver demanda clara de produtividade de engenharia.
2. Formalizar padrão de uso no projeto antes de habilitar em rotina.

---

## 7 — React 19.2 *(🟩 Estável)*
2025-10-22

### Status no Projeto
- Status: Implementado globalmente no projeto
- Evidência: `docs/base-tecnica.md` define React 19.2.x; `package.json` fixa `react`/`react-dom` em `19.2.1`.

### Descrição
Versão estável do React já usada no stack atual do LP Factory 10.

### Valor para o Projeto
- Base moderna e suportada para evolução do App Router e Server Components.

### Valor para o Usuário
- Comportamento de UI consistente com runtime atualizado.

### Ações Recomendadas
1. Manter acompanhamento de patches e notas de compatibilidade.
2. Tratar recursos opcionais (ex.: View Transitions) como adoção conservadora e orientada a caso de uso.

---

## 8 — APIs de Cache refinadas *(🟩 Estável no framework)*
2025-10-22

### Status no Projeto
- Status: Não implementado
- Evidência: não há integração explícita no projeto para fluxo com `updateTag()`/`revalidateTag()` como padrão operacional.

### Descrição
APIs do framework para invalidação de cache por tag. `revalidateTag()` deve receber um profile como `"max"` ou `"stale"`, conforme a política desejada; a chamada sem segundo argumento usa o comportamento legado de expiração imediata e está deprecada. `updateTag()` invalida imediatamente para cenários de read-your-own-writes e só pode ser usado em Server Actions.

### Valor para o Projeto
- Possibilita atualização pontual de dados sem estratégia global de rebuild, desde que exista cache real e uma política de consistência definida.

### Valor para o Usuário
- Pode melhorar frescor de dados em áreas com atualização frequente.

### Ações Recomendadas
1. Manter sem adoção no projeto até existir cache real que justifique invalidação por tag.
2. Ao adotar, escolher explicitamente o profile de `revalidateTag()` e reservar `updateTag()` a Server Actions que exijam atualização imediata.
3. Não introduzir cache dinâmico na primeira entrega da E10.6.

---

## 9 — Modelo oficial de Proxy (`proxy.ts`) *(🟩 Estável — convenção de migração)*
2025-10-22

### Status no Projeto
- Status: Não implementado
- Evidência: o repositório mantém `middleware.ts` ativo; não há migração para `proxy.ts` registrada.

### Descrição
No ciclo atual do Next.js, `middleware.ts` foi substituído/deprecado em favor de `proxy.ts` como convenção oficial, com runtime Node.js como padrão para o Proxy.

### Valor para o Projeto
- Direção de migração mais clara e alinhada à documentação oficial do framework.

### Valor para o Usuário
- Pode trazer previsibilidade operacional ao fluxo de interceptação de rotas.

### Ações Recomendadas
1. Registrar migração como item técnico futuro, sem adoção imediata.
2. Preservar estabilidade do fluxo atual enquanto não houver justificativa de mudança.

---

## 10 — Observability Redirects *(🟩 Estável)*
2025-11-05

### Status no Projeto
- Status: Implementado globalmente no projeto
- Evidência: registro operacional Tipo A já validado neste documento para o projeto `lp-factory-10` no dashboard Vercel.
- Observação: visibilidade disponível para clientes; profundidade de métricas pode variar conforme plano/Observability Plus.

### Descrição
Painel de Observability da Vercel com métricas básicas de redirects e rewrites disponíveis nos planos da plataforma. Em Pro/Enterprise, o Observability Plus acrescenta métricas avançadas, como latência de conexão, recortes por origem/destino e rotas de destino do redirect. Logs de runtime estão disponíveis no dashboard; exportação por Drains, inclusive de redirects e rewrites, é um recurso de Pro/Enterprise e pode ter cobrança própria.

### Valor para o Projeto
- Diagnóstico mais rápido de comportamento de rotas e latência.

### Valor para o Usuário
- Maior consistência de navegação com monitoramento contínuo.

### Ações Recomendadas
1. Manter validações periódicas em smoke de Preview para rotas críticas usando as métricas básicas já disponíveis.
2. Avaliar Observability Plus, logs e Drains apenas se a necessidade operacional justificar plano, retenção e custo adicionais.

### Registro (Tipo A — Plataforma)
- Status: OK
- Verificado em: 08/02/2026
- Ambiente: Vercel Dashboard (projeto `lp-factory-10`) → Observability → Edge Requests
- Evidência: gráficos + tabela de rotas acessíveis; busca/filtro de rotas (ex.: `/a/home`) disponível.
- Observação: no smoke do preview `e10.4.6`, validar também `/a/[account]` e sequência E10.4 → E10.5 (redirect/latência).

---

## 11 — Server-side Tracking API (`@vercel/analytics/server`) *(🟩 Estável no ecossistema Vercel)*
2025-10-30

### Status no Projeto
- Status: Não implementado
- Evidência: roadmap/base técnica registram tracking interno em planejamento, sem adoção explícita de `@vercel/analytics/server` no projeto.
- Observação: custom events server-side estão disponíveis em planos Pro/Enterprise.

### Descrição
Capacidade de envio de eventos customizados server-side via `@vercel/analytics/server`, sem depender apenas de eventos client-side. Requer `@vercel/analytics >= 1.1.0`; em deploy protegido, a requisição de tracking pode exigir `VERCEL_AUTOMATION_BYPASS_SECRET` ou configuração equivalente de bypass para alcançar o endpoint de coleta.

### Valor para o Projeto
- Pode melhorar confiabilidade de telemetria em fluxos sensíveis.

### Valor para o Usuário
- Melhora indireta na qualidade de produto por decisões guiadas por eventos mais consistentes.

### Ações Recomendadas
1. Não adotar na primeira entrega da E10.6.
2. Antes de implementar, confirmar plano Pro/Enterprise, versão do pacote, proteção do deploy e estratégia única de tracking.
3. Evitar pressupor integração nativa pronta com APIs de Ads sem fonte oficial específica.

---

## 12 — Vercel AI Cloud + Gateway *(DEPRECADO — duplicado)*
2025-11-12

### Status no Projeto
- Status: Não implementado
- Evidência: item duplicado do `#1`, sem implementação dedicada no projeto.
- Observação: Duplicado / Superado por item mais novo (manter referência no `#1`).

### Descrição
Item deprecado por ser duplicado e ter sido superado pelo detalhamento consolidado no `vercel#1`.

---

## 13 — Auto Job Cancellation (deploys em fila no mesmo branch) *(🟩 Estável)*
2025-12-05

### Status no Projeto
- Status: Implementado globalmente no projeto
- Evidência: comportamento default de integração Git ↔ Vercel já tratado como capacidade ativa neste documento.

### Descrição
Quando há vários pushes no mesmo branch/PR enquanto um build está em execução, a Vercel prioriza o commit mais recente e cancela jobs intermediários enfileirados, mantendo o Preview alinhado ao último estado do branch.

### Valor para o Projeto
- Reduz desperdício de builds em branches com commits rápidos (menos fila e menos ruído operacional).
- Diminui risco de QA abrir Preview antigo quando há muitas iterações na mesma branch.
- Acelera ciclos de correção durante execuções (ex.: branches de features como `e10.4.6`).

### Valor para o Usuário
- Correções e melhorias chegam mais rápido ao Preview/produção (menos tempo de espera por deploys).
- Menor chance de validação em estado desatualizado quando houver aprovação por Preview.

### Ações Recomendadas
1. Tratar como comportamento padrão do Vercel ↔ GitHub e manter registro operacional.
2. Só avaliar opt-out via `vercel.json` em caso específico que exija build de todos os commits.

### Registro (Tipo A — Plataforma)
- Status: N/A (default ON)
- Ação necessária: nenhuma
- Observação: somente criar `vercel.json` se optar por desabilitar o cancelamento automático.

---

## 14 — Optional AI model training / “Improve models with my data” *(🟩 Estável)*  
2026-03-17

### Status no Projeto
- Status: Não implementado
- Evidência: configuração sensível de plataforma sem registro de adoção deliberada no LP Factory 10.
- Observação: governança de dados; avaliar explicitamente antes de manter ativo.

### Descrição
Configuração opcional da Vercel para permitir uso de código e chats de agentes da Vercel em melhoria/treino de modelos, com possibilidade de compartilhamento com provedores de modelos para essa finalidade.

### Valor para o Projeto
- Registra uma decisão sensível de governança de dados da plataforma.
- Ajuda a evitar ativação por inércia em ambiente de projeto real.
- Cria referência documental para revisão futura de compliance e segurança.

### Valor para o Usuário
- Não há ganho direto de produto para o usuário final.
- O valor é indireto, na governança e no controle consciente da configuração.

### Ações Recomendadas
1. Registrar a configuração como sensível no contexto Vercel do projeto.
2. Manter desativado por padrão, salvo justificativa explícita.
3. Reavaliar somente se houver benefício claro e documentado para o projeto.

### Registro (Tipo A — Plataforma)
- Status: PENDENTE
- Verificado em: —
- Ambiente: Vercel Team/Project Settings / Data Preferences
- Evidência: —
- Observação: tratar como decisão consciente de governança; não como feature de produto.

---

## 15 — Vercel Toolbar *(🟩 Disponível na plataforma)*
2026-06-12

### Status no Projeto
- Status: Não implementado
- Evidência: não há configuração ou registro local que comprove adoção operacional no LP Factory 10.
- Observação: avaliar como hub técnico/operacional de Preview, sem tratá-lo como feature do produto.

### Descrição
Hub de inspeção e colaboração em deployments que centraliza Comments, Accessibility Audit Tool, Interaction Timing Tool, Layout Shift Tool, Flags Explorer e outras ferramentas de navegação e revisão.

### Valor para o Projeto
- Reúne validações de Preview no contexto da página e reduz a dispersão entre feedback, inspeção e dashboard.

### Valor para o Usuário
- Contribui indiretamente para páginas mais claras, acessíveis, estáveis e responsivas antes da publicação.

### Ações Recomendadas
1. Avaliar após existir o primeiro Preview funcional da E10.6.
2. Usar como prática operacional, sem criar nova infraestrutura.

---

## 16 — Vercel Comments *(🟩 Disponível na plataforma)*
2026-06-12

### Status no Projeto
- Status: Não implementado
- Evidência: não há registro local de Comments habilitado ou adotado no fluxo de aprovação.

### Descrição
Feedback localizado diretamente em deployments de Preview, associado ao ponto visual revisado e compartilhável com o time.

### Valor para o Projeto
- Facilita revisão visual e alinhamento de design/copy sem depender de prints soltos.

### Valor para o Usuário
- Reduz ambiguidades e retrabalho na correção de conteúdo e interface antes da publicação.

### Ações Recomendadas
1. Avaliar para validação operacional do Preview da E10.6, sem torná-lo bloqueio da primeira entrega.

---

## 17 — Accessibility Audit Tool *(🟩 Disponível na plataforma)*
2026-06-12

### Status no Projeto
- Status: Não implementado
- Evidência: não há registro local de uso da ferramenta no fluxo de QA.

### Descrição
Ferramenta da Vercel Toolbar para checar regras de acessibilidade, incluindo WCAG, contraste, semântica e estados de foco no contexto da página.

### Valor para o Projeto
- Apoia QA de páginas antes da aprovação e ajuda a localizar problemas diretamente no Preview.

### Valor para o Usuário
- Melhora legibilidade, navegação por teclado e compreensão da interface.

### Ações Recomendadas
1. Usar como apoio à revisão da E10.6 quando disponível no ambiente/plano.
2. Não substituir validação manual de teclado, foco, conteúdo e tecnologias assistivas.

---

## 18 — Interaction Timing Tool *(🟩 Disponível na plataforma)*
2026-06-12

### Status no Projeto
- Status: Não implementado
- Evidência: não há registro local de uso da ferramenta no fluxo de QA.

### Descrição
Ferramenta da Vercel Toolbar para inspecionar a latência de cada interação da sessão e apoiar a análise de INP.

### Valor para o Projeto
- Ajuda a revisar CTAs, FAQ, cards e outros componentes interativos no Preview.

### Valor para o Usuário
- Favorece respostas mais rápidas e previsíveis após cliques, toques e comandos de teclado.

### Ações Recomendadas
1. Aplicar como diagnóstico no Preview funcional, sem converter analytics em requisito da primeira entrega da E10.6.

---

## 19 — Layout Shift Tool *(🟩 Disponível na plataforma)*
2026-06-12

### Status no Projeto
- Status: Não implementado
- Evidência: não há registro local de uso da ferramenta no fluxo de QA.

### Descrição
Ferramenta da Vercel Toolbar para identificar visualmente elementos que causam CLS e deslocamentos de layout durante a sessão.

### Valor para o Projeto
- Apoia a revisão de hero, imagens, fontes, cards, FAQ e responsividade.

### Valor para o Usuário
- Reduz mudanças inesperadas de posição que prejudicam leitura e interação.

### Ações Recomendadas
1. Usar no QA do Preview quando disponível, mantendo inspeção manual em diferentes larguras de tela.

---

## 20 — Vercel Flags / Flags SDK / Flags Explorer *(🟨 Avaliação futura)*
2026-06-12

### Status no Projeto
- Status: Não implementado
- Evidência: não há flags, SDK, provider ou configuração do Flags Explorer registrados como adoção no LP Factory 10.
- Observação: recurso futuro; não recomenda A/B ativo na primeira entrega da E10.6.

### Descrição
Conjunto para definir e avaliar flags em código, aplicar targeting, segmentos e splits, controlar rollouts e testar overrides no navegador pelo Flags Explorer. O Explorer está disponível nos planos da plataforma, mas o uso sem assinatura adicional é limitado a 150 aplicações de overrides por mês; overrides ilimitados custam US$ 250/mês em Pro/Enterprise. O Vercel Flags possui cobrança e limites próprios por requisições, flags e segmentos.

### Valor para o Projeto
- Pode apoiar rollouts controlados, inspeção de estados e experimentos futuros quando houver hipótese, governança e medição aprovadas.

### Valor para o Usuário
- Pode reduzir risco de lançamentos futuros ao permitir exposição gradual e segmentada.

### Ações Recomendadas
1. Manter como avaliação futura e separar decisão de provider, SDK, Flags Explorer e experimentação.
2. Antes de adotar, validar limites, custos, targeting, privacidade, estratégia de medição e processo de remoção de flags.
3. Não implementar A/B, splits ou infraestrutura de flags na primeira entrega da E10.6.

---
