# E22.6 — Remoção do Validador Final e automações adjacentes

Status: V1 funcional aprovada no Debate 07; execução Light; supervisão Autônoma.

Fonte aprovada: [Debate 07 — Remoção do Validador Final e automações adjacentes — LP Factory 10](https://docs.google.com/document/d/18SgNSLyqs1j-fk0IuM5hFlGrL_DJoFqW5WAlp4apPes/edit?usp=drivesdk), consultado em 06/09/2026.

## 1. Resultado esperado

- Retirar do projeto o Validador Final e o Niche Runtime Tests, junto com seus componentes exclusivos, sem afetar o produto, o CI, a mailbox institucional ou os dados já criados.

## 2. Comportamento e limites

- A retirada ocorre conjuntamente em um único plano e um único PR predominantemente de exclusão.
- Não é criada automação substituta neste recorte.
- A mailbox institucional e seus secrets permanecem disponíveis para a E17.9.3.
- Usuários, contas, memberships, sessões históricas e demais dados existentes no Supabase não são excluídos nem alterados.
- O produto, os gates vigentes e as automações sem dependência desses ativos permanecem fora da superfície de mudança.

## 3. Atores e supervisão

- O Executor inventaria consumidores, realiza a retirada, reconcilia a documentação e apresenta as evidências.
- Após o handoff, o fluxo segue sem supervisão rotineira do Estrategista original; ele permanece autoridade de escalada quando a execução não puder prosseguir dentro da autoridade concedida.
- Modo de supervisão aprovado: Autônomo.

## 4. Posição no roadmap e fases

- E22.6.1 — Inventariar consumidores e confirmar os limites da retirada.
- E22.6.2 — Remover conjuntamente os workflows, runtimes e verificadores exclusivos e reconciliar as referências documentais.
- E22.6.3 — Executar os gates, comprovar a ausência de referências quebradas e registrar a conclusão.
- As três fases pertencem a um único plano e não autorizam PRs adicionais por conveniência.

## 5. Classificação e automação

- Classificação do plano: Light.
- Automação do recorte: não automatizar; trata-se de retirada determinística e única.
- OpenAI: não aplicável neste recorte.

## 6. Critérios de aceite e evidências

- Validador Final e Niche Runtime Tests são removidos conjuntamente.
- Workflows, runtimes e verificador de uso exclusivo desses ativos são removidos.
- Busca completa não encontra imports, paths, scripts, comandos ou referências operacionais quebradas ligadas aos ativos removidos.
- A mailbox institucional e os secrets `MAILBOX_EMAIL` e `MAILBOX_PASSWORD` permanecem preservados e documentados para a E17.9.3.
- Nenhum usuário, conta, membership ou dado existente no Supabase é excluído ou alterado.
- Nenhuma automação, agente, rota, banco, job ou infraestrutura substituta é criada neste recorte.
- `docs/automations.md`, `docs/platform-config.md`, `docs/roadmap.md` e `docs/github-up.md` ficam reconciliados, sem instruções operacionais obsoletas.
- `npm ci` e `npm run check` são aprovados.
- Security Checks são aprovados e o diff final permanece predominantemente de exclusão, sem mudanças alheias ao objetivo.
