# Template do roadmap

1. Objetivo
Definir o padrão estrutural para organizar casos macro no `docs/roadmap.md`.

2. Estrutura padrão

2.1 Recorte implementado ou materialmente ajustado
```md
X. E[n] — Nome do caso macro
- Objetivo:
- Status:

X.1 [Recorte funcional implementado]
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

X.1.3 [Implementação, definição, contrato, validação ou limite]
- Status:
- Conteúdo:
```

2.2 Recorte previsto, conceitual ou não implementado
```md
X. E[n] — Nome do caso macro
- Objetivo:
- Status:

X.2 [Recorte funcional previsto]
X.2.1 Objetivo e status
- Objetivo:
- Status: previsto / não implementado.

X.2.2 Critérios para abertura futura
- Conteúdo:

X.2.3 Fora do escopo atual
- Conteúdo:
```

3. Regras de hierarquia
- Nível 1 = caso macro.
- Nível 2 = recorte funcional.
- `X.Y.1` = objetivo e status.
- Para recortes implementados ou materialmente ajustados, `X.Y.2` = registros do recorte.
- Para recortes previstos, conceituais ou não implementados, `X.Y.2` pode ser conteúdo específico, como critérios futuros, previsão ou fora do escopo.
- `X.Y.3` até `X.Y.n` = conteúdo específico complementar.
- Nível 4 = exceção, só quando item de nível 3 ficar grande ou ambíguo; não deve ter objetivo, status ou registros próprios.

4. Regras de registros
- `Criados`: artefatos novos; `Ajustados`: artefatos existentes alterados materialmente; `Excluídos`: artefatos removidos.
- Consumo, leitura, citação, dependência ou reaproveitamento sem alteração material não entram em registros.
- Update apenas avaliado, rejeitado ou monitorado não entra em registros do roadmap.
- Se a avaliação gerar decisão permanente, registrar no conteúdo específico do recorte, não em `Updates`.
- `Registros do recorte` só deve existir quando houver ao menos um registro real em Banco, Repositório ou Updates.
- Não criar `Registros do recorte` apenas para preservar simetria.
- Não manter categorias vazias de Banco, Repositório ou Updates em recortes previstos.
- Recortes sem implementação material devem omitir registros.

5. Regras anti-inflação
- Não criar seção de notas por padrão, observações gerais em `Objetivo e status`, registros fora de `X.Y.2` ou subseções vazias.
- Não criar `Registros do recorte` vazio em recortes previstos, conceituais ou não implementados.
- Não criar subseções vazias para Banco, Repositório ou Updates.
- Não transformar previsão futura em implementação apenas para preencher registros.
