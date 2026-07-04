25/06/2026 — Gestor de Updates

Fontes:
chat, docs/supa-up.md, docs/vercel-up.md, docs/github-up.md, docs/prod-up.md

1. Objetivo

* Avaliar updates de plataformas, produto e stack antes de sugerir adoção no LP Factory 10.
* Separar recurso disponível no mercado de recurso aplicável ao MVP.
* Evitar overengineering, nova infraestrutura e automações sem caso real.
* Apoiar o Estrategista, Analista e Executor com decisões simples, seguras e documentadas.
* Receber instruções curtas do Estrategista, como “Avalie a fase XX do plano-base Y segundo suas diretrizes documentadas”, e aplicar este documento como critério de avaliação dentro do escopo do Gestor de Updates.
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

13. Protocolo para rodada de atualização dos catálogos

13.1. Objetivo

* Manter os catálogos de updates como catálogos ativos, não históricos completos.
* Remover itens sem decisão futura útil.
* Preservar rastreabilidade dos IDs.
* Adicionar novos recursos apenas com fonte oficial e aproveitamento real ou condicional.

13.2. Catálogos-alvo

* `docs/supa-up.md`
* `docs/vercel-up.md`
* `docs/github-up.md`
* `docs/prod-up.md`

13.3. Ordem obrigatória da rodada

* Ler o catálogo-alvo em `main`.
* Consultar `docs/gestor-updates.md`.
* Consultar `README.md` para escopo, MVP e princípios.
* Consultar `docs/base-tecnica.md`, `docs/schema.md`, `docs/platform-config.md` ou `docs/roadmap.md` quando o update tocar stack, banco, plataforma, roadmap ou decisão já consolidada.
* Classificar itens existentes antes de propor novos itens.
* Fazer varredura em fonte oficial externa quando o catálogo depender de updates de plataforma/produto.
* Entregar análise ao usuário antes do briefing para Codex.
* Só depois gerar briefing determinístico para Codex.
* Revisar o PR antes do merge.

13.4. Regra de catálogo ativo

Remover do catálogo ativo itens que estejam:

* implementados globalmente;
* absorvidos por Base Técnica, schema, roadmap ou outro documento normativo;
* duplicados em outro catálogo;
* deprecados, superados ou sem aproveitamento concreto;
* genéricos demais para orientar decisão futura.

Manter no catálogo ativo itens que sejam:

* ainda não implementados;
* úteis por caso;
* pagos, enterprise ou futuros, desde que tenham aplicação plausível;
* travas, referências ou validações úteis para decisões futuras.

13.5. Regra de IDs canônicos e lacunas

* IDs `supa#n`, `vercel#n`, `github#n` e `prod#n` são canônicos.
* Não renumerar IDs.
* Não preencher lacunas.
* Não reutilizar IDs removidos.
* IDs removidos ficam aposentados/reservados.
* Lacunas numéricas são corretas.
* Novos itens usam o próximo ID livre após o maior ID já usado no catálogo.
* Exemplo: se `github#1`, `github#2` e `github#3` forem removidos, `github#4` continua sendo `github#4`; o próximo item novo é `github#5`.

13.6. Briefing determinístico para Codex

O briefing para Codex não deve pedir apenas para “revisar”, “melhorar” ou “atualizar” o catálogo.

O briefing deve declarar objetivamente:

* arquivo único a alterar;
* arquivos proibidos de alterar;
* IDs a remover;
* IDs a manter;
* IDs a atualizar;
* novos IDs a criar;
* texto ou estrutura esperada para novos blocos;
* itens avaliados e não adicionados;
* regra de não renumerar IDs;
* regra de não reutilizar IDs removidos;
* regra de manter lacunas numéricas;
* validações textuais obrigatórias;
* dispensa justificada de `npm ci` e `npm run check` quando for alteração apenas documental.

13.7. Regras para novos itens

* Só adicionar item novo com fonte oficial.
* Não adicionar release genérico, anúncio cosmético, modelo específico ou recurso sem aplicação clara.
* Não criar item novo para recurso já melhor coberto por outro catálogo.
* Não transformar recurso futuro, pago, enterprise ou experimental em adoção automática.
* Quando a varredura oficial for necessária, fazer antes do merge e preferencialmente no mesmo PR.

13.8. Revisão do PR

Antes de aprovar merge, conferir:

* PR aberto, mergeable e não draft;
* apenas o arquivo-alvo alterado;
* itens removidos saíram integralmente;
* itens mantidos não foram renumerados;
* lacunas numéricas foram preservadas;
* novos IDs seguem o próximo número livre;
* não há `### Filtro na primeira varredura`;
* não há tabela-resumo nova sem pedido;
* não houve alteração de código, workflow, banco, rota, job, agente, automação, engine ou infraestrutura;
* checks foram executados ou dispensados com justificativa documental.

13.9. Decisão final

* Aprovar merge quando o arquivo estiver correto, o escopo preservado e os IDs íntegros.
* Não bloquear merge por descrição de PR desatualizada quando o arquivo final estiver correto e não houver risco real.
* Pedir ajuste quando houver renumeração, alteração fora de escopo, item novo sem fonte oficial, reutilização de ID removido ou adoção automática de recurso condicional.
