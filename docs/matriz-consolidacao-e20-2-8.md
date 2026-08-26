# Matriz de consolidação — E20.2.8

- V1 congelada: commit `ebde94d2757994e2121fd974ad667584a7f62203`, blob `14718243ce834b5e37406e9d560d1db2d1f3db9e`, `docs/lousa-plano-base-e20-2-8.md`.
- V2 avaliada na Passagem 1: commit `258e493f42e0c4a8ee5885c4fed2bcedc8f9848f`, blob `b95c18b250bb5744d6f0c9e11cba753f02cfec9e`.
- V2 após correções da Passagem 1: commit `6a3e6adbd45ab777a1b455d7fc87a0a7d300de0d`, blob `2b8ae1e122c163d7831c18f7da00ed538864ba8e`.
- Plano conceitual: `N/A` — nenhuma referência competente ou vínculo inequívoco adicional.
- Gestor de Automações: `N/A — nenhuma fase com Automação: sim`.

## Achados e tratamentos

| Especialista | ID | Achado fiel e classificação original | Relação com o escopo | Tratamento | Destino do update | Localização na v2 | Evidência ou justificativa |
|---|---|---|---|---|---|---|---|
| Gestor Estrutural | `GE-E20.2.8-01` | Identidade congelada confirmada; achado estrutural. | preservação | incorporado | N/A | Seção 1.1, linha 7 | V1, PR #809, branch, HEAD e blob estão identificados por referências imutáveis. |
| Gestor Estrutural | `GE-E20.2.8-02` | A autoridade física admitia catálogo persistido ou registry repo-only; bloqueio por decisão humana. | preservação | incorporado | N/A | Seções 1.1, 1.4, 2.1, 3.1 e 5.7 | Decisão humana de 24/08/2026 escolheu registry repo-only; somente o draft não operacional pode ter residência adicional. |
| Gestor Estrutural | `GE-E20.2.8-03` | Inventário de substituição incompleto; patch estrutural. | extensão adjacente necessária e proporcional | incorporado | N/A | Seção 2.4, linha 179 | O inventário cobre pin TypeScript, RPC, preparação, workspace, geração, contexto e `versions.at(-1)`, com remoção do legado sem consumidor. |
| Gestor Estrutural | `GE-E20.2.8-04` | Comparador sem regra executável suficiente; patch estrutural. | extensão adjacente necessária e proporcional | incorporado | N/A | Seção 1.6 | A v2 fixa projeção funcional, categorias mutuamente exclusivas, allowlist fechada e fallback conservador. |
| Gestor Estrutural | `GE-E20.2.8-05` | Publicação sem vínculo seguro entre conteúdo e evidências; patch estrutural. | extensão adjacente necessária e proporcional | incorporado | N/A | Seção 5.7, linhas 345–348 | Após a Passagem 1, a alegação de atomicidade cross-system foi substituída por sequência observável, identidade congelada e preservação da versão anterior em falha. |
| Gestor Estrutural | `GE-E20.2.8-06` | Paths administrativos mínimos já determináveis; patch estrutural. | extensão adjacente necessária e proporcional | incorporado | N/A | Seção 2.5, linha 194 | Reutiliza `/admin/estrutura-lp?view=entradas` e `/admin/taxonomia/[taxonId]`, com guard e adapter server-only. |
| Gestor Estrutural | `GE-E20.2.8-07` | Governança de banco ausente; patch estrutural condicional. | extensão adjacente necessária e proporcional | incorporado | N/A | Seção 3.1, linha 236 | A regra somente incide se o draft exigir banco e cobre migration, apply, RLS, policies, grants, Data API, views e funções. |
| Gestor Estrutural | `GE-E20.2.8-08` | `docs/schema.md` stale sobre o apply E19.5; condicionante objetiva. | extensão adjacente necessária e proporcional | incorporado | N/A | Seção 3.1, linha 239 | O plano exige reconciliação via ABC antes do gate de implementação que alterar banco; o documento canônico não foi editado na consolidação da v2. |
| Gestor Estrutural | `GE-E20.2.8-09` | Gate global sem prova de paginação, cardinalidade e completude; patch estrutural. | extensão adjacente necessária e proporcional | incorporado | N/A | Seções 2.5 e 3.1, linhas 197 e 237–238 | A v2 exige total autoritativo, falha fechada e teste acima de uma página; SQL read-only registrou o snapshot atual sem convertê-lo em limite. |
| Gestor de Updates | `prod#16` | Complementar, horizonte atual; QA proporcional da superfície Admin. | extensão adjacente necessária e proporcional | incorporado | usar como referência, validação ou trava | Seção 2.5, linha 197 | Critérios incluem Preview, desktop/mobile, acesso, estados e coleção paginada completa. |
| Gestor de Updates | `prod#17` | Complementar, horizonte atual; baseline acessível verificável. | extensão adjacente necessária e proporcional | incorporado | usar como referência, validação ou trava | Seção 2.5, linha 198 | Critérios incluem teclado, foco, labels, anúncios, contraste, toque e inspeção manual sem alegação global de conformidade. |
| Gestor de Updates | `supa#29` | Sobreposto, horizonte condicional; auditoria automatizada futura. | expansão | não incorporado — justificado | preservar como oportunidade estratégica condicional | N/A | A Passagem 1 confirmou que é adiável e cria frente independente; eventual interesse exige recorte futuro próprio. |
| Gestor de Updates | `supa#53` | Complementar, horizonte condicional; fila durável futura. | expansão | não incorporado — justificado | preservar como oportunidade estratégica condicional | N/A | A solução síncrona determinística ainda não demonstrou insuficiência; fila, worker e retries constituem frente independente. |
| Gestor de Updates | `supa#63` | Complementar, horizonte condicional; tooling de matriz RLS. | expansão | não incorporado — justificado | preservar como oportunidade estratégica condicional | N/A | Ferramenta, Python e pgtap são adiáveis e não necessários aos testes SQL dirigidos deste recorte. |
| Gestor de Updates | `supa#68` | Complementar, horizonte condicional; Realtime futuro. | expansão | não incorporado — justificado | preservar como oportunidade estratégica condicional | N/A | Não há requisito nem medição que torne Realtime indispensável; consulta completa sob demanda permanece suficiente. |
| Gestor de Updates | `supa#54` | Incompatível, horizonte futuro; similaridade vetorial. | preservação | incorporado | não aplicável ao recorte | Seção 4.2, linha 260 | A trava preserva classificação determinística e proíbe embeddings como autoridade de `R → C`. |
| Gestor de Updates | `vercel#20` | Sobreposto, horizonte condicional; targeting ou rollout segmentado. | preservação | incorporado | não aplicável ao recorte | Seção 4.2, linha 261 | A trava preserva versão global única e impede selecionar `C` por usuário ou taxon. |
| Gestor de Updates | `GU-GITHUB-N/A` | Nenhum item GitHub preliminarmente elegível. | preservação | não incorporado — justificado | não aplicável ao recorte | N/A | O parecer integral não encontrou relação objetiva com lifecycle, comparador ou superfície administrativa. |
| Gestor de Automações | `GA-N/A` | Nenhuma fase marcada exatamente como `Automação: sim`. | preservação | não incorporado — justificado | N/A | Seção 3.1, linha 224 | O plano registra `Automação: não` e proíbe agente, IA decisória, job, fila e rotina recorrente. |

## Correções da Passagem 1

| ID | Correção obrigatória | Tratamento | Evidência |
|---|---|---|---|
| `P1-E20.2.8-01` | Eliminar a residência indefinida da autoridade publicada. | incorporado | Seção 2.1 fixa registry/boundary repo-only e deixa somente o draft condicionado. |
| `P1-E20.2.8-02` | Tornar as categorias de compatibilidade mutuamente exclusivas. | incorporado | Seção 1.6 classifica mudança apenas editorial como `sem mudança material` e remove essa hipótese de `evolução compatível`. |
| `P1-E20.2.8-03` | Definir sequência observável de publicação sem alegar transação entre sistemas. | incorporado | Seção 5.7 define congelamento, materialização, CI/Preview, revisão/merge humanos, deploy, transição observável e reconciliação administrativa. |
| `P1-E20.2.8-04` | Remover oportunidades adiáveis do plano-alvo. | incorporado | `supa#29`, `supa#53`, `supa#63` e `supa#68` permanecem somente nesta matriz como oportunidades condicionais não incorporadas. |
