---
name: lp-factory-avaliar-plano-automacoes
description: Avaliar questão concreta de automação, IA, agente, workflow, job, integração ou service por meio do custom agent gestor-automacoes, quando acionada pelo Executor ou por pedido humano autorizado.
---

# Avaliar automações do plano-base

Na execução, receba a chamada decidida pelo Executor (§3.2); valide a entrada sem refazer o roteamento. Pedidos humanos autorizados permanecem aceitos. No retorno, confira questão focal, parecer/contexto anterior, delta e evidências pertinentes.

Delegar uma avaliação read-only ao custom agent `gestor-automacoes` e devolver seu parecer integral.

## Preparar a entrada

1. Confirmar repositório, worktree, branch e estado Git.
2. Resolver a fonte sem inferir outro caso:
   - PR: confirmar número, URL, base, head, head SHA e estado; resolver a fonte aprovada recuperável do mesmo caso no PR/Git, conforme 3.1 do Executor;
   - path local: confirmar existência e coerência entre path, conteúdo e caso.
3. Confirme acesso à versão indicada; leia integralmente as fontes pertinentes por referência, transportando conteúdo somente se o destinatário não conseguir resolvê-la ou se o julgamento exigir recebê-lo. Fonte mutável sem recuperação durável exige preservar antes o conteúdo aprovado indispensável, conforme 3.1 do Executor. Confirme a questão concreta, o recorte, limites e critérios afetados.
4. Confirmar `docs/gestor-automations.md`; deixar ao agente a seleção das demais fontes competentes.
5. Parar e pedir somente o dado ausente se a questão ou o recorte continuar ambíguo.
6. Registrar o estado Git anterior à delegação.

## Delegar e devolver

1. Iniciar exatamente um subagent `gestor-automacoes`.
2. Entregar questão focal, worktree, branch, metadados, referência recuperável da fonte, caso e recortes aplicáveis, garantindo leitura integral conforme a preparação.
3. Não repetir critérios de automação no handoff: o contrato runtime está em `.codex/agents/gestor-automacoes.toml` e a governança em `docs/gestor-automations.md`.
4. Aguardar o parecer sem realizar avaliação paralela.
5. Validar identificação, fontes, questão focal, um veredito permitido, decisões/dimensões aplicáveis, patches e próximo passo. Quando houver OpenAI com prompt consumido no runtime, validar também que o parecer registre `docs/template-prompts.md` e o complemento específico aplicável entre as fontes efetivamente consultadas, a conclusão de aderência ao contrato vigente e a validação representativa exigida por `docs/gestor-automations.md`; ausência de qualquer desses elementos torna o handoff incompleto.
6. Em `automação aplicável com patches autossuficientes`, exigir patch completo para cada decisão aprovada. Em `requer investigação factual`, exigir evidência faltante e forma de obtê-la. Em `requer decisão material`, exigir decisão, alternativas verificáveis e evidências, sem escolher o próximo avaliador.
7. Se o contrato estiver incompleto, devolver o conteúdo recebido e marcar o handoff como incompleto; não completar nem reinterpretar o parecer.
8. Confirmar novamente o estado Git e distinguir alterações preexistentes.
9. Preservar e devolver ao Executor o parecer integral, salvo quando o escritor autorizado já tiver preservado duravelmente o original completo e o acesso pelos próximos consumidores estiver comprovado. Nesse caso, devolver a referência recuperável, sem retranscrever o parecer, respeitando a necessidade de acesso/julgamento da preparação. Informar plano e recortes avaliados, veredito, agente acionado e confirmação de que o repositório permaneceu inalterado.

## Limites

Não editar plano, fontes ou PR; criar branch, commit ou PR; pesquisar recursos sem caso concreto; implementar; consolidar v2; acionar outro especialista; decidir pelo Analista ou executar fases.
