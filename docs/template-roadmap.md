# Template do roadmap

1. Objetivo
Definir o padrão estrutural para organizar casos macro no `docs/roadmap.md`.

2. Estrutura padrão
```md
X. E[n] — Nome do caso macro
- Objetivo:
- Status:
X.1 [Recorte funcional]
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
  - Reaproveitados:
  - Ajustados:
  - Excluídos:
- Updates:
  - Aplicados:
  - Avaliados:
  - Rejeitados / monitorados:
X.1.3 [Implementação, definição, contrato, previsão, critério ou limite]
- Status:
- Conteúdo:
X.1.n [Implementação, definição, contrato, previsão, critério ou limite]
- Status:
- Conteúdo:
```

3. Regras de hierarquia
- Nível 1 = caso macro; nível 2 = recorte funcional.
- `X.Y.1` = objetivo e status; `X.Y.2` = registros; `X.Y.3` até `X.Y.n` = conteúdo específico.
- Nível 4 = exceção, só quando item de nível 3 ficar grande ou ambíguo; não deve ter objetivo, status ou registros próprios.

4. Regras de registros
- `Criados`: artefatos novos; `Reaproveitados`: artefatos existentes cuja reutilização foi decisão relevante.
- `Ajustados`: artefatos existentes alterados materialmente; consumo, leitura, citação ou dependência não são ajuste.
- Artefato criado e ajustado no mesmo recorte deve aparecer preferencialmente só em `Criados`.
- Artefato alterado materialmente por recorte posterior pode aparecer como `Ajustado` nesse recorte posterior.

5. Regras anti-inflação
- Não criar seção de notas por padrão, observações gerais em `Objetivo e status`, registros fora de `X.Y.2` ou subseções vazias.
- Não transformar previsão futura em implementação.
