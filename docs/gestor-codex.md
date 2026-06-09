# Gestor Codex — LP Factory 10

## 1. Objetivo

Este painel resume o valor, o estado e os limites dos recursos do Codex App avaliados para o LP Factory 10, sem repetir regras operacionais.

## 2. Referências

Estas fontes concentram regras, execução, automações e configuração fora deste painel.

* `AGENTS.md` — regras operacionais.
* `docs/prompt-codex-app-executor.md` — execução no Codex App.
* `docs/automations.md` — automações.
* `docs/platform-config.md` — configuração da plataforma.

## 3. Configurações

Configurações sustentam a execução local e a publicação do trabalho.

### Modo Personalizado (`config.toml`)
**Aptidão:** trabalho Git local.
**Estado:** adotado.
**Valor:** ambiente controlado para editar e validar.
**Limite:** não substitui `AGENTS.md`.

### Git local e `git push`
**Aptidão:** versionar e publicar branches.
**Estado:** validado.
**Valor:** conclui o fluxo sem interface gráfica.
**Limite:** requer remote e autenticação válidos.

### GitHub Web
**Aptidão:** PRs, Actions, preview e merge.
**Estado:** fonte de verdade.
**Valor:** centraliza revisão e decisão de merge.
**Limite:** não substitui validações locais.

### GitHub Desktop
**Aptidão:** operações Git por interface gráfica.
**Estado:** fora do fluxo principal.
**Valor:** alternativa para uso humano.
**Limite:** não publica pelo fluxo padrão do Codex App.

### Hooks
**Aptidão:** reagir automaticamente a eventos.
**Estado:** nenhum.
**Valor:** poderá padronizar verificações.
**Limite:** sem caso aprovado.

### Conexões
**Aptidão:** integrar serviços externos.
**Estado:** nenhuma ativa.
**Valor:** poderá reduzir trocas entre ferramentas.
**Limite:** acesso e necessidade não avaliados.

### Árvores de trabalho
**Aptidão:** isolar frentes paralelas.
**Estado:** nenhuma criada.
**Valor:** evita misturar branches e contextos.
**Limite:** ainda sem teste real.

## 4. Plugins

Plugins aproximam serviços externos da investigação e execução.

### Supabase Plugin
**Aptidão:** leitura e escrita no Supabase.
**Estado:** em teste; leitura aprovada.
**Valor:** investiga schema, tabelas, RLS, policies, views, functions, índices, extensões e migrations.
**Limite:** escrita não testada nem aprovada.

## 5. Skills

Skills tornam procedimentos recorrentes reutilizáveis e consistentes.

### Skills adotadas
**Aptidão:** padronizar tarefas especializadas.
**Estado:** nenhuma após a reinstalação.
**Valor:** poderão reduzir repetição.
**Limite:** skills do Supabase ficam no registro do plugin.

## 6. Automações

Automações podem reduzir o acionamento manual de rotinas recorrentes.

### Automações do Codex App
**Aptidão:** executar tarefas recorrentes.
**Estado:** nenhuma criada.
**Valor:** poderá reduzir trabalho operacional.
**Limite:** sem caso de uso e supervisão definidos.

## 7. Uso do computador e navegador

Esses recursos podem ampliar validações visuais e interações fora do terminal.

### Computer Use
**Aptidão:** interagir com interfaces gráficas.
**Estado:** disponível para instalar; não adotado.
**Valor:** poderá cobrir tarefas sem interface por código.
**Limite:** controle e segurança não avaliados.

### Chrome
**Aptidão:** interagir e verificar páginas web.
**Estado:** disponível para instalar; não adotado.
**Valor:** poderá validar navegação e comportamento.
**Limite:** ainda não testado no projeto.

### Navegador integrado
**Aptidão:** consultar e interagir com a web.
**Estado:** disponível; sem adoção final.
**Valor:** reduz trocas de contexto.
**Limite:** faltam critérios de uso e confiabilidade.

## 8. Agents SDK / Workspace Agents

Agentes podem coordenar fluxos especializados quando houver complexidade suficiente.

### Agent Builder
**Aptidão:** montar fluxos visualmente.
**Estado:** legado.
**Valor:** referência para fluxos existentes.
**Limite:** não expandir.

### Agents SDK
**Aptidão:** desenvolver agentes por código.
**Estado:** pendente de avaliação.
**Valor:** poderá oferecer orquestração controlada.
**Limite:** sem caso aprovado.

### Workspace Agents
**Aptidão:** organizar agentes especializados.
**Estado:** pendente de avaliação.
**Valor:** poderá distribuir responsabilidades complexas.
**Limite:** custo e benefício não validados.

## 9. Próximos testes

Os testes devem gerar evidência para adotar, limitar ou descartar recursos.

1. Validar uma worktree em frente paralela real.
2. Ampliar testes de leitura do Supabase Plugin, sem escrita.
3. Selecionar um procedimento candidato a skill.
4. Definir uma automação pequena e supervisionada.
5. Comparar Chrome e navegador integrado em validação visual.
6. Avaliar caso concreto para Agents SDK ou Workspace Agents.
