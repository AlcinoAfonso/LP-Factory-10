# PB 1 — E12.7 Contrato mínimo canônico para novas páginas do Admin

## V1 funcional aprovada — Debate 13, seção 4.1

- Fonte: `Debate 13 — Arquitetura transversal de apresentação, UI e UX dos dashboards — LP Factory 10`, seção 4.1, revisão `ANLCKQmRlbunVJBS7IttiUPl9Juro3Oz6_VC08KayBrnbm4VtLOBiYIw0o5YcoIDjhUfuvH6Bp_uJ_Qev3EOuJSgdR9FL0lXhWgfjLScFvw`.
- Estado: V1 funcional aprovada pelo titular; handoff autorizado.
- Execução: Light. Automação: não. Supervisão: Autônomo.

### Problema e resultado

- O contrato mínimo de apresentação para novas páginas do Admin está aprovado, mas ainda não reside na fonte canônica visual do repositório.
- Torná-lo regra canônica do Design System para novas páginas e recortes administrativos, preservando a simplicidade do MVP sem antecipar o redesign das superfícies existentes.
- O resultado protege novas páginas agora sem fechar o restante da arquitetura transversal em debate.

### Usuários e comportamento

- Usuário funcional: `platform_admin`; regras e operações de domínio continuam pertencendo aos casos respectivos.
- Toda nova página administrativa confronta sua apresentação com o contrato mínimo antes de ser considerada aderente ao Admin.
- Coleções avaliam lista com aparência tabular como primeira opção: identidade do registro, atributos essenciais e abertura explícita do detalhe.
- Filtros e ordenação são condicionais à utilidade para localizar ou comparar; detalhe é orientado à tarefa e não apresenta contratos técnicos como linguagem principal.
- Mobile preserva identidade, estado, informação essencial e acesso ao detalhe. Cards substituem a lista apenas com justificativa funcional de UX melhor para tarefa, conteúdo ou viewport.
- Estados vazio, loading, erro e sucesso e a acessibilidade vigente permanecem aplicáveis. A tecnologia da lista permanece aberta.

### Limites e escopo negativo

- Não adaptar, redesenhar ou normalizar páginas existentes.
- Não alterar componentes, rotas, banco, migration, RPC, job, agente, automação, engine, infraestrutura ou contratos de domínio.
- Não adicionar AG Grid, MUI Data Grid ou outra biblioteca; não criar componente novo de lista ou grid nem escolher tecnologia futura.
- Não alterar `docs/platform-config.md` nem duplicar regras específicas de domínio no Design System.
- Não retirar nem substituir regras visuais vigentes compatíveis: o delta documental deve ser cirúrgico.
- Formulários, IA, feedback, wireframes, piloto E20 e adoção incremental ficam fora deste PB; o recorte amplo permanece em debate no Debate 13.

### Posição, fase e aceite

- Posição: E12.7 — Contrato mínimo de apresentação para novas páginas do Admin. E12 mantém a arquitetura administrativa; `docs/design-system.md` é a fonte canônica visual.
- Fase única: **12.7.3 — Materialização canônica do contrato mínimo**: incorporar o baseline aprovado ao Design System e registrar E12.7 no roadmap, sem código ou mudança nas superfícies existentes.
- O Design System deve explicitar cabeçalho mínimo; lista tabular como primeira opção; identidade; filtros e ordenação condicionais; abertura do detalhe; linguagem humana; mobile; cards como exceção funcional; estados; acessibilidade; preservação funcional; e tecnologia em aberto, sem duplicar domínio.
- O roadmap registra somente E12.7 e os registros/fases efetivamente materializados. Nenhum arquivo de código, runtime ou configuração operacional muda; o recorte amplo não é declarado concluído.
- Evidência: diff restrito ao contrato canônico e ao roadmap, leitura final coerente com a V1 e ausência de alterações em código, componentes, rotas, banco, automações, infraestrutura e `docs/platform-config.md`.

## V2 técnica mínima — Light

### Fonte e alcance

- V1 congelada: commit `3cf4e21de60306bae67d0681edfa04776c519765`.
- Parecer obrigatório do Gestor de Updates: `prod#17` aplicável como referência normativa documental; `prod#16` como trava para validação de futuras superfícies; sem candidato a confronto estrutural ou arbitragem funcional. `vercel#15` é oportunidade condicional sem implementação; `supa#10` não se aplica.
- Fase única mantida: **12.7.3**. A entrega modifica somente este plano, `docs/design-system.md` e `docs/roadmap.md`.

### Delta executável

1. Em `docs/design-system.md`, incorporar o contrato mínimo aprovado da seção 3.15 do Debate 13 para **novas** páginas e recortes do Admin. Ajustar a regra vigente de cards apenas para admitir sua exceção funcional de coleção; preservar a aplicação atual das demais regras e a autoridade dos contratos de domínio.
2. Declarar WCAG 2.2 como baseline de acessibilidade para novas páginas administrativas, com critérios relevantes ao fluxo, inspeção automática e validação manual proporcionais; não declarar conformidade integral sem auditoria, escopo e evidências próprias. Não executar auditoria ou QA de UI neste PB documental.
3. Em `docs/roadmap.md`, registrar E12.7 após E12.6 conforme `docs/template-roadmap.md`, com objetivo/status, referências materiais a este plano e ao Design System, `prod#17` em Updates aplicados e conteúdo restrito ao contrato canônico entregue. Não registrar artefatos de código ou fase não executada.
4. Reconciliar cada documento canônico pelo `docs/prompt-abc.md` antes da edição. A implementação não muda código, frontend, banco, configuração operacional ou comportamento de páginas existentes.

### Validação e aceite

- Conferir por leitura o contrato canônico contra a V1 e o Debate 13: cabeçalho, coleção, identidade, exploração condicional, detalhe, linguagem humana, mobile, cards condicionais, estados, acessibilidade, preservação funcional e escolha tecnológica aberta.
- Conferir `docs/roadmap.md` contra o template e comprovar que registra somente a fase 12.7.3 materializada; confirmar `git diff --check` e diff documental restrito aos três arquivos previstos.
- `npm ci`, `npm run check`, `npm run dev` e QA de Preview não se aplicam ao delta exclusivamente documental. A adoção em futuras páginas requer validação própria conforme o respectivo recorte.
