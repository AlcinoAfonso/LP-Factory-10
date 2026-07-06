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
  - Ajustados:
- Repositório:
  - Criados:
  - Ajustados:
  - Excluídos:
- Updates:
  - Aplicados:
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
- `Criados`: artefatos novos; `Ajustados`: artefatos existentes alterados materialmente; `Excluídos`: artefatos removidos.
- Consumo, leitura, citação, dependência ou reaproveitamento sem alteração material não entram em registros.
- Update apenas avaliado, rejeitado ou monitorado não entra em registros do roadmap.
- Se a avaliação gerar decisão permanente, registrar no conteúdo específico do recorte, não em `Updates`.
- `X.Y.2 Registros do recorte` deve ser usado quando houver implementação material ou registros reais.
- Recortes previstos, conceituais ou não implementados podem omitir `Registros do recorte`.

5. Regras anti-inflação
- Não criar seção de notas por padrão, observações gerais em `Objetivo e status`, registros fora de `X.Y.2` ou subseções vazias.
- Não criar blocos vazios de Banco, Repositório ou Updates apenas para preservar simetria.
- Não transformar previsão futura em implementação.
