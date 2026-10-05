---
name: lp-factory-avaliar-plano-automacoes
description: Avaliar automações, fluxos com IA, agentes, workflows, jobs, rotinas recorrentes, integrações e services previstos em um plano-base do LP Factory 10 por meio do custom agent gestor-automacoes. Usar quando a v1 identificar automação aplicável sem dispensa humana explícita da avaliação formal na v2, ou quando o humano pedir o parecer desse especialista.
---

# Avaliar automações do plano-base

Delegar uma avaliação read-only ao custom agent `gestor-automacoes` e devolver seu parecer integral.

## Preparar a entrada

1. Confirmar repositório, worktree, branch e estado Git.
2. Resolver a fonte sem inferir outro caso:
   - PR: confirmar número, URL, base, head, head SHA e estado; resolver a fonte aprovada recuperável do mesmo caso; selecionar automaticamente uma lousa somente quando houver exatamente um `docs/lousa-plano-base-*.md` no recorte;
   - path local: confirmar existência e coerência entre path, conteúdo e caso.
3. Confirme acesso à versão indicada; leia integralmente as fontes pertinentes por referência, transportando conteúdo somente se o destinatário não conseguir resolvê-la ou se o julgamento exigir recebê-lo. Fonte mutável sem recuperação durável exige preservar antes o conteúdo aprovado indispensável, conforme 3.1 do Executor. Identificar pelo contrato funcional quais entregas ou partes do plano serão automatizadas, sem depender de marcador literal ou posição fixa.
4. Se a v1 registrar dispensa humana explícita da avaliação formal e o humano não estiver pedindo nova avaliação, devolver `Gestor de Automações: N/A — avaliação formal dispensada na v1`, sem iniciar o agente.
5. Se a v1 excluir explicitamente automação, devolver `Gestor de Automações: N/A — plano sem automação aplicável`, sem iniciar o agente.
6. Para cada recorte aplicável, registrar identificador quando existir, objetivo, escopo, limites, critérios de aceite e automações, integrações ou services mencionados.
7. Confirmar `docs/gestor-automations.md`; deixar ao agente a seleção das demais fontes competentes.
8. Parar e pedir somente o dado ausente se a seleção do plano ou das fases continuar ambígua.
9. Registrar o estado Git anterior à delegação.

## Delegar e devolver

1. Iniciar exatamente um subagent `gestor-automacoes`.
2. Entregar worktree, branch, metadados, referência recuperável da fonte, caso e recortes aplicáveis, garantindo leitura integral conforme a preparação.
3. Não repetir critérios de automação no handoff: o contrato runtime está em `.codex/agents/gestor-automacoes.toml` e a governança em `docs/gestor-automations.md`.
4. Aguardar o parecer sem realizar avaliação paralela.
5. Validar identificação, fontes, um veredito permitido, classificação, ambiente, necessidade de OpenAI, decisão, patches e próximo passo. Quando houver OpenAI com prompt consumido no runtime, validar também que o parecer registre `docs/template-prompts.md` e o complemento específico aplicável entre as fontes efetivamente consultadas, a conclusão de aderência ao contrato vigente e a validação representativa exigida por `docs/gestor-automations.md`; ausência de qualquer desses elementos torna o handoff incompleto.
6. Em `automação aplicável com patches autossuficientes`, exigir patch completo para cada decisão aprovada. Em `requer investigação factual`, exigir evidência faltante e forma de obtê-la. Em `requer validação material pelo Analista`, exigir decisão material e alternativas verificáveis, sem abrir gate humano neste estágio.
7. Se o contrato estiver incompleto, devolver o conteúdo recebido e marcar o handoff como incompleto; não completar nem reinterpretar o parecer.
8. Confirmar novamente o estado Git e distinguir alterações preexistentes.
9. Preservar e devolver ao Executor o parecer integral, salvo quando o escritor autorizado já tiver preservado duravelmente o original completo e o acesso pelos próximos consumidores estiver comprovado. Nesse caso, devolver a referência recuperável, sem retranscrever o parecer, respeitando a necessidade de acesso/julgamento da preparação. Informar plano e recortes avaliados, veredito, agente acionado e confirmação de que o repositório permaneceu inalterado.

## Limites

Não editar plano, fontes ou PR; criar branch, commit ou PR; pesquisar recursos sem caso concreto; implementar; consolidar v2; acionar outro especialista; decidir pelo Analista ou executar fases.
