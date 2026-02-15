# LP Factory 10 — Vercel + Next.js Update  

---

## 1 — Vercel AI Cloud *(🧪 Experimental)*  
2025-06-30  

### Descrição  
Nova fundação IA-native da Vercel com AI Gateway, Fluid Compute, Active CPU Pricing e Rolling Releases.  

### Valor para o Projeto  
- Reduz custo em workloads intermitentes (IA, relatórios).  
- Permite deploy seguro e reversível com rollback automático.  
- Cria base para automações IA e agentes no futuro.  

### Valor para o Usuário  
- Desempenho mais rápido e previsível.  
- Proteção automatizada contra falhas em rotas críticas.  

### Ações Recomendadas  
1. Testar Active CPU em workloads ocasionais.  
2. Avaliar Rolling Releases e BotID.  
3. Planejar uso do AI Gateway na fase IA-ready.  

---

## 2 — Next.js 16 *(🟩 Estável)*  
2025-10-22  

### Descrição  
Atualização central do Next.js com caching otimizado, edge runtime e integração com AI DevTools.  

### Valor para o Projeto  
- Melhora performance geral e controle de build.  
- Suporte completo a Turbopack, React 19.2 e Edge Boundaries.  

### Valor para o Usuário  
- Navegação mais fluida e carregamento instantâneo.  

### Ações Recomendadas  
1. Atualizar para Next 16.1 em ambiente staging.  
2. Validar compatibilidade com Supabase e Edge.  

---

## 3 — Cache Components *(⏳ Em Rollout)*  
2025-10-22  

### Descrição  
Novo modelo de cache explícito substitui o PPR, com diretiva `use cache`.  

### Valor para o Projeto  
- Controle granular de seções estáticas e dinâmicas.  
- Reduz latência p95 em blocos reutilizáveis.  

### Valor para o Usuário  
- LPs mais rápidas e consistentes.  

### Ações Recomendadas  
1. Ativar caching seletivo em seções principais.  
2. Monitorar Core Web Vitals após rollout.  

---

## 4 — Turbopack *(🟩 Estável)*  
2025-10-22  

### Descrição  
Novo bundler padrão substitui o Webpack, trazendo builds até 5x mais rápidos.  

### Valor para o Projeto  
- Melhora o tempo de build e deploy.  
- Reduz custo em pipelines de CI/CD.  

### Valor para o Usuário  
- Atualizações e previews mais ágeis.  

### Ações Recomendadas  
1. Migrar para Turbopack no próximo ciclo CI.  

---

## 5 — Routing e Navegação Aprimorados *(🟩 Estável)*  
2025-10-22  

### Descrição  
Introduz layout deduplication e prefetch adaptativo.  

### Valor para o Projeto  
- Estrutura de navegação simplificada e modular.  

### Valor para o Usuário  
- Experiência mais fluida e preditiva.  

### Ações Recomendadas  
1. Ativar prefetch apenas em rotas internas do Dashboard.  

---

## 6 — DevTools MCP *(⏳ Em Rollout)*  
2025-10-22  

### Descrição  
Ferramenta de depuração IA-assistida com logs unificados e contexto de renderização.  

### Valor para o Projeto  
- Diagnóstico automatizado de falhas SSR/Edge.  

### Valor para o Usuário  
- Menos erros visíveis e tempo de resposta menor.  

### Ações Recomendadas  
1. Habilitar assim que disponível para contas Free/Hobby.  

---

## 7 — React 19.2 *(🟩 Estável)*  
2025-10-22  

### Descrição  
Suporte a View Transitions e `useEffectEvent()`.  

### Valor para o Projeto  
- Permite transições suaves e dinâmicas entre rotas.  

### Valor para o Usuário  
- Navegação visualmente contínua e moderna.  

### Ações Recomendadas  
1. Aplicar View Transitions nas LPs consultivas.  

---

## 8 — APIs de Cache refinadas *(⏳ Em Rollout)*  
2025-10-22  

### Descrição  
Novas APIs `updateTag()` e `revalidateTag()` permitem invalidação granular de cache.  

### Valor para o Projeto  
- Atualizações pontuais sem rebuild completo.  

### Valor para o Usuário  
- Dados mais frescos e imediatos sem atrasos.  

### Ações Recomendadas  
1. Integrar revalidateTag ao fluxo de publicação das LPs.  

---

## 9 — Novo modelo de proxy *(🧪 Experimental)*  
2025-10-22  

### Descrição  
Substitui `middleware.ts` por `proxy.ts`, com limites de edge explícitos.  

### Valor para o Projeto  
- Arquitetura mais previsível e auditável.  

### Valor para o Usuário  
- Melhor estabilidade nas rotas edge.  

### Ações Recomendadas  
1. Testar conversão para proxy.ts em staging.  

---

## 10 — Observability Redirects *(🟩 Estável)*  
2025-11-05  

### Descrição  
Novo painel Observability da Vercel inclui métricas de redirecionamentos e rewrites externos.  

### Valor para o Projeto  
- Diagnóstico preciso de gargalos e latência de proxies.  

### Valor para o Usuário  
- Performance consistente e monitorada.  

### Ações Recomendadas  
1. Ativar a seção de Redirects & Rewrites.  
2. Configurar alertas p95/p99.  

### Registro (Tipo A — Plataforma)  
- Status: OK  
- Verificado em: 08/02/2026  
- Ambiente: Vercel Dashboard (projeto `lp-factory-10`) → Observability → Edge Requests  
- Evidência: gráficos + tabela de rotas acessíveis; busca/filtro de rotas (ex.: `/a/home`) disponível.  
- Observação: no smoke do preview `e10.4.6`, validar também `/a/[account]` e sequência E10.4 → E10.5 (redirect/latência).  

---

## 11 — Server-side Tracking API *(🧪 Experimental)*  
2025-10-30  

### Descrição  
API para envio direto de eventos de conversão do servidor para Google Ads e Meta Ads.  

### Valor para o Projeto  
- Elimina dependência de tags de navegador.  
- Sinergia com módulo `events_analytics` do Supabase.  

### Valor para o Usuário  
- Leads mais precisos e campanhas com menor custo.  

### Ações Recomendadas  
1. Configurar `/api/track` com variáveis seguras.  
2. Validar integração com Ads APIs.  

---

## 12 — Vercel AI Cloud + Gateway *(🟩 Estável)*  
2025-11-12  

### Descrição  
Infraestrutura IA-native da Vercel, com AI Gateway e Fluid Compute, oferecendo deploy inteligente e seguro com detecção automática de bots.  

### Valor para o Projeto  
- Reduz custo de execução de rotas IA e workloads intermitentes.  
- Cria base para automações de agentes IA na camada Edge.  
- Facilita observabilidade e rollback de releases críticos.  

### Valor para o Usuário  
- Performance aprimorada e rotas mais estáveis.  
- Experiência de IA responsiva e sem interrupções.  

### Ações Recomendadas  
1. Ativar AI Gateway e Rolling Releases em ambiente staging.  
2. Validar compatibilidade com Supabase Auth e Access Context.  

---

## 13 — Auto Job Cancellation (deploys em fila no mesmo branch) (🟩 Estável)

2025-12-05

### Descrição
Quando há vários pushes no mesmo branch/PR enquanto um build está em execução, a Vercel prioriza o commit mais recente e cancela jobs intermediários enfileirados, mantendo o Preview alinhado ao “último estado” do branch.

### Valor para o Projeto
Reduz desperdício de builds em branches com commits rápidos (menos fila e menos ruído operacional).
Diminui risco de QA abrir Preview “antigo” quando há muitas iterações na mesma branch.
Acelera ciclos de correção durante execuções (ex.: branches de features como e10.4.6).

### Valor para o Usuário
Correções e melhorias chegam mais rápido ao Preview/produção (menos tempo de espera por deploys).
Menor chance de validação em estado desatualizado quando houver aprovação por Preview.

###  Ações Recomendadas
Tratar como comportamento padrão do Vercel↔GitHub e registrar como capacidade ativa.
Se houver necessidade de buildar todos os commits (caso específico de CI), avaliar opt-out via vercel.json (config de GitHub).

### Registro (Tipo B — Repo)
Status: PENDENTE
Nota (classificação): Default ON (sem ação). Mudança de comportamento (opt-out) via vercel.json = Tipo B.
Verificado em: —
Ambiente: Repo (vercel.json) + Vercel Project Settings (Git)
Evidência: —
Observação: manter default; só alterar se houver requisito explícito de CI por commit.
