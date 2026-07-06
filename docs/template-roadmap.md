# Template do roadmap

1. Objetivo

Este documento define o padrão estrutural para organizar casos macro no `docs/roadmap.md`.

O template deve ser usado para reorganizações, novos blocos e consolidações documentais do roadmap.

2. Hierarquia padrão

2.1 Nível 1 — Caso macro

Exemplo:

- `9. E9 — Billing, trial e entitlements`
- `10. E10 — [nome do caso macro]`
- `18. E18 — [nome do caso macro]`

Estrutura obrigatória:

- Objetivo:
- Status:

Regras:

- O nível 1 não deve ter item próprio de registros.
- O nível 1 não deve consumir uma subseção apenas para objetivo e status.
- O nível 1 deve conter apenas os bullets `Objetivo` e `Status` antes dos recortes funcionais.

2.2 Nível 2 — Recorte funcional

Exemplo:

- `9.1 Base universal de entitlement comercial`
- `9.2 Trial`
- `9.3 Stripe`
- `9.4 Mercado Pago`
- `9.5 Asaas`

Regras:

- Cada recorte funcional deve começar em `X.Y`.
- A numeração do recorte deve ser compatível com sua ordem dentro do caso macro.
- O primeiro recorte do caso macro deve ser `X.1`.
- O segundo recorte deve ser `X.2`.
- O recorte funcional pode representar implementação, base transversal, provedor, previsão, área operacional, contrato ou critério futuro.

2.3 Nível 3 — Organização interna do recorte

Estrutura obrigatória:

- `X.Y.1 Objetivo e status`
- `X.Y.2 Registros do recorte`
- `X.Y.3` até `X.Y.n` para implementação, definição, contrato, previsão, critério ou limite específico.

Regras:

- `X.Y.1` deve conter somente:
  - Objetivo:
  - Status:
- `X.Y.2` deve concentrar os registros do recorte.
- `X.Y.3` em diante deve conter o conteúdo específico do recorte.
- Não repetir registros em `X.Y.3` em diante.
- Não criar observações genéricas em `X.Y.1`.

2.4 Nível 4 — Exceção

O nível 4 só deve ser usado quando um item de nível 3 ficar grande demais ou ambíguo.

Regras:

- Nível 4 não deve ter `Objetivo e status`.
- Nível 4 não deve ter `Registros`.
- Nível 4 não deve ser usado para inflar previsões.
- Nível 4 não deve ser usado como padrão obrigatório.
- Se um nível 4 precisar de objetivo, status ou registros próprios, ele provavelmente deve virar item de nível 3 ou novo recorte de nível 2.

3. Modelo base

```md
X. E[n] — Nome do caso macro

- Objetivo:
- Status:

X.1 [Recorte funcional 1]

X.1.1 Objetivo e status

- Objetivo:
- Status:

X.1.2 Registros do recorte

- Banco:
  - Criados:
  - Reaproveitados:
  - Ajustados:
- Repositório:
  - Criados:
  - Ajustados:
  - Excluídos:
- Updates:
  - Aplicados:
  - Avaliados:
  - Rejeitados / monitorados:

X.1.3 [Implementação, definição, contrato, previsão, critério ou limite]

- Status:
- Conteúdo:

X.1.4 [Implementação, definição, contrato, previsão, critério ou limite]

- Status:
- Conteúdo:

X.1.n [Implementação, definição, contrato, previsão, critério ou limite]

- Status:
- Conteúdo:

X.2 [Recorte funcional 2]

X.2.1 Objetivo e status

- Objetivo:
- Status:

X.2.2 Registros do recorte

- Banco:
  - Criados:
  - Reaproveitados:
  - Ajustados:
- Repositório:
  - Criados:
  - Ajustados:
  - Excluídos:
- Updates:
  - Aplicados:
  - Avaliados:
  - Rejeitados / monitorados:

X.2.3 [Implementação, definição, contrato, previsão, critério ou limite]

- Status:
- Conteúdo:
```

4. Regras anti-inflação

- Não criar seção de notas por padrão.
- Não criar observações gerais dentro de `Objetivo e status`.
- Não repetir registros fora de `X.Y.2`.
- Não criar nível 4 sem necessidade real.
- Não transformar previsão futura em implementação.
- Não criar subseções vazias.
- Não criar novos bancos, rotas, jobs, agentes, automações, engines ou infraestrutura neste template.
- Não alterar `docs/roadmap.md` neste PR.
- Não alterar `docs/prompt-estrategista.md` neste PR.
- Não alterar versionamento ou changelog, salvo se `AGENTS.md` exigir explicitamente.
