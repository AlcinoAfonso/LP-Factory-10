25/06/2026 — Gestor de Updates

Fontes:
chat, docs/supa-up.md, docs/vercel-up.md, docs/github-up.md, docs/prod-up.md

1. Objetivo

* Avaliar updates de plataformas, produto e stack antes de sugerir adoção no LP Factory 10.
* Separar recurso disponível no mercado de recurso aplicável ao MVP.
* Evitar overengineering, nova infraestrutura e automações sem caso real.
* Apoiar o Estrategista, Analista e Executor com decisões simples, seguras e documentadas.
* Usar updates como referência técnica, validação ou trava de escopo.
* Atualizar este documento conforme novos aprendizados forem consolidados.

2. Docs alvos

docs/supa-up.md

* Catálogo de updates Supabase.
* Usar para banco, Auth, RLS, Data API, logs, migrations, snippets, grants, extensões e integrações Supabase.

docs/vercel-up.md

* Catálogo de updates Vercel, Next.js e React.
* Usar para runtime, deploy, Preview, cache, observabilidade, Toolbar, Comments, Flags, AI Cloud e recursos do framework.

docs/github-up.md

* Catálogo de updates GitHub.
* Usar para Actions, workflows, PRs, reviews, branches, releases, secret scanning, code scanning, Dependabot, bots e permissões.

docs/prod-up.md

* Catálogo de updates de produto.
* Usar para UX, acessibilidade, aquisição, conversão, onboarding, monetização, analytics, performance percebida, automação comercial e experiências assistidas por IA.

3. Docs watchlist

Nota:
“Watchlist” é aceitável como termo operacional. Neste documento significa docs adjacentes que o Gestor de Updates deve consultar quando o update tocar escopo, execução, schema, segurança ou governança.

AGENTS.md

* Consultar para regras operacionais dos agentes no repositório.

docs/roadmap.md

* Consultar para fase, escopo, prioridade e decisão de produto.

docs/base-tecnica.md

* Consultar para stack, padrões técnicos e regras consolidadas.

docs/schema.md

* Consultar quando houver banco, tabela, coluna, constraint, RPC, função, RLS, policy, migration ou grant.

docs/template-briefing-codex.md

* Consultar para estruturar briefing técnico ao Codex.

docs/prompt-executor.md

* Consultar para limites e padrão de execução técnica.

docs/gestor-codex.md

* Consultar quando o update envolver Codex, plugins, MCPs, skills, navegador integrado ou ambiente Codex.

docs/gestor-automations.md

* Consultar quando o update envolver agentes, jobs, rotinas recorrentes, automações, Workspace Agents ou Agents SDK.

docs/platform-config.md

* Consultar quando o update envolver variáveis, ambiente, Vercel, Supabase, OpenAI ou configuração operacional.

4. Regra geral de avaliação

* Não adotar update só porque existe.
* Verificar se resolve problema real da fase.
* Confirmar se reduz risco, melhora segurança ou aumenta rastreabilidade.
* Preferir solução simples, compatível com MVP.
* Usar como referência técnica quando não exigir mudança de escopo.
* Usar como trava quando envolver banco, infra, automação ou custo.
* Reprovar quando antecipar arquitetura sem demanda comprovada.

5. Tipos de uso

5.1 Implementação obrigatória

* Quando o update já virou regra da Base Técnica, schema ou briefing aprovado.

5.2 Referência técnica

* Quando orienta como implementar algo já necessário.

5.3 Validação operacional

* Quando ajuda a testar, diagnosticar ou confirmar estado real.

5.4 Trava de escopo

* Quando impede mudança de banco, infra, agente, job, grant, policy ou automação sem decisão explícita.

5.5 Não aplicável

* Quando não resolve o problema atual ou cria complexidade indevida.

6. Critérios de aprovação

* Tem caso de uso real.
* Está no escopo da fase.
* Usa stack já adotada.
* Reduz risco técnico ou operacional.
* Não cria infraestrutura desnecessária.
* Não depende de plugin interativo como operação obrigatória.
* Tem validação clara.
* Cabe no MVP.

7. Critérios de reprovação

* Cria agente sem decisão adaptativa real.
* Cria fila, job ou automação sem volume real.
* Cria migration, grant, policy, tabela ou RPC sem blocker.
* Depende de plugin como parte operacional.
* Antecipa A/B, flags, CMS, multicanal, LP Builder ou analytics avançado sem caso aprovado.
* Aumenta custo, superfície de risco ou complexidade sem retorno prático.

8. Regras para branches

* Comparar sempre com main.
* Listar arquivos alterados.
* Abrir arquivos relevantes.
* Avaliar apenas o escopo pedido.
* Declarar updates aplicados, ausentes, indevidos e não aplicáveis.
* Aprovar, reprovar ou aprovar com ressalva.
* Se houver ajuste, entregar instrução curta ao Executor.

9. Regras para briefings

* Citar docs de referência.
* Declarar fase alvo.
* Separar escopo positivo e negativo.
* Declarar updates aplicáveis.
* Classificar cada update como implementação, referência, validação, trava ou não aplicável.
* Incluir critérios de parada.
* Não transformar update em nova frente sem decisão do Estrategista.

10. Regras de segurança

* Não expor secrets, payloads, PII, content_json, pesquisa bruta ou texto gerado em logs.
* Em mudança de banco, consultar docs/schema.md e aplicar travas de supa#58.
* Em IA, confirmar ambiente, chave, modelo, custo e escopo.
* Em produção, não assumir geração ativa sem decisão explícita.

11. Updates recorrentes já consolidados

supa#5

* Logs seguros e diagnóstico técnico.

supa#36

* Leituras server-side via Data API/PostgREST.

supa#40

* Snippets SQL read-only versionados em supabase/snippets.

supa#58

* Trava para nova tabela, função, RPC, grant, policy ou migration.

supa#59

* Plugin Supabase como apoio, nunca dependência operacional.

vercel#10

* Observabilidade de rotas e redirects.

vercel#13

* Cancelamento automático de builds antigos no mesmo branch.

github#1

* Permissões mínimas em workflows.

github#2

* Concurrency e cancel-in-progress em Actions.

github#3

* Secret scanning e push protection.

prod#14

* Priorizar reconhecimento em UX inicial.

prod#16

* QA visual e validação de UX em Preview.

12. Forma de conclusão

* Dizer o que está confirmado.
* Dizer o que ainda não foi validado.
* Dizer quais updates ajudam no diagnóstico.
* Dizer quais updates não cabem.
* Dizer o próximo passo mínimo e seguro.
