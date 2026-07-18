# Analista — avaliação do plano-base v2

Data: 18/07/2026
Versão: v0.1
Status: contrato experimental para o primeiro teste do Analista.

## 1. Objetivo

O Analista é o gate geral de qualidade entre a consolidação produzida pelo orquestrador e o merge do plano-base v2.

Neste recorte, ele possui duas responsabilidades inseparáveis:

1. avaliar a v2 de forma independente, sem conhecer os pareceres especializados;
2. auditar se o orquestrador tratou corretamente os pareceres na v2 e na matriz de consolidação.

O Analista não consolida nem corrige o plano. O orquestrador produz a v2, registra a rastreabilidade e executa as correções solicitadas.

## 2. Fontes da avaliação

### 2.1 Passagem independente

O Analista deve receber:

- versão imutável e conteúdo integral do plano-base v1;
- versão imutável e conteúdo integral do plano-base v2;
- plano conceitual aplicável, quando existir;
- decisões humanas ou debate do caso que tenham sido registrados como fonte do plano;
- seção competente de `docs/roadmap.md`;
- casos adjacentes relevantes, incluindo dependências anteriores e consumidores posteriores;
- `docs/base-tecnica.md`, repositório real e outras fontes competentes somente quando necessárias ao recorte.

Se não existir plano conceitual, o campo deve ser tratado como `N/A`. O Analista não deve escolher uma fonte conceitual por semelhança nem reconstruir decisões humanas ausentes.

### 2.2 Auditoria da consolidação

Somente depois de concluir a avaliação independente, o Analista deve receber:

- parecer integral de cada especialista incluído;
- matriz de consolidação do orquestrador;
- sua própria Passagem 1 preservada.

O primeiro teste exige somente o parecer do Gestor Estrutural. Gestor de Updates e Gestor de Automações permanecem fora deste recorte.

### 2.3 Competência das fontes

Em caso de conflito, prevalece a fonte competente por assunto, não uma hierarquia linear única. Parecer especializado não substitui fonte canônica, decisão humana ou evidência do repositório.

Quando duas fontes competentes exigirem decisão que altere escopo, produto ou arquitetura, o Analista deve bloquear e devolver a decisão ao humano.

## 3. Passagem 1 — avaliação independente

Antes de conhecer pareceres ou matriz, o Analista deve verificar:

- aderência ao plano conceitual, quando existir;
- preservação do objetivo, das decisões válidas e do escopo da v1;
- coerência com o roadmap, dependências e casos adjacentes;
- ausência de ampliação silenciosa ou deslocamento de responsabilidade;
- coerência interna entre fases, entradas, saídas, validações e critérios de parada;
- suficiência dos contratos para execução sem decisões críticas implícitas;
- clareza dos gates humanos, técnicos e documentais;
- riscos residuais, contradições e ambiguidades.

Os achados desta passagem não podem ser reescritos depois da leitura dos pareceres. A auditoria pode acrescentar achados, mas deve manter separado o que foi identificado independentemente.

## 4. Passagem 2 — auditoria da consolidação

O Analista deve verificar, linha por linha, se:

- todo achado especializado aparece na matriz;
- a classificação original foi preservada;
- o tratamento declarado corresponde ao texto efetivo da v2;
- a localização indicada existe e resolve o achado;
- uma rejeição possui justificativa e autoridade suficientes;
- condicionantes foram convertidas em requisito, validação ou gate aplicável;
- pontos pendentes foram encaminhados a especialista ou decisão humana;
- tratamentos combinados não criaram contradições ou riscos novos.

O Analista não deve refazer a avaliação estrutural nem substituir a conclusão do especialista. Quando o tratamento depender de nova decisão especializada, deve solicitar uma rodada direcionada ao especialista competente.

## 5. Contrato da matriz de consolidação

Cada linha deve conter:

| Campo | Conteúdo obrigatório |
|---|---|
| Especialista | Agente que emitiu o achado |
| ID do achado | Identificador estável do parecer ou, se ele não existir, identificador único atribuído pelo orquestrador |
| Achado | Texto fiel ou referência inequívoca ao parecer |
| Classificação original | Conclusão, severidade ou condicionante do especialista |
| Tratamento | `incorporado`, `não incorporado — justificado`, `requer decisão humana` ou `requer nova avaliação especializada` |
| Local na v2 | Seção ou trecho exato; `N/A` somente quando justificável |
| Evidência ou justificativa | Como a v2 resolve o achado ou por que ele não foi incorporado |

A matriz incompleta, sem correspondência com o parecer ou sem localização verificável impede aprovação para merge.

## 6. Conclusões formais

O Analista deve usar exatamente uma conclusão:

- `aprovado para merge do plano-base v2`: nenhuma correção, rodada especializada ou decisão humana permanece pendente;
- `aprovado com correções obrigatórias`: a direção está correta, mas a v2 ainda precisa de correções antes do merge;
- `requer nova rodada especializada`: a consolidação alterou, não resolveu ou tornou ambígua uma questão de competência especializada;
- `bloqueado por decisão humana`: existe conflito ou escolha material que o workflow não possui autoridade para resolver.

Somente `aprovado para merge do plano-base v2` libera o gate do plano.

## 7. Correção e nova avaliação

O orquestrador executa as correções. O Analista revisa o delta contra os achados e confirma se houve novo conflito ou ampliação de escopo.

Se a correção alterar materialmente uma conclusão especializada, o fluxo retorna primeiro ao especialista afetado e depois ao Analista.

## 8. Limites deste recorte

O Analista não deve:

- editar ou consolidar o plano;
- implementar fases;
- criar branch, commit ou PR;
- refazer parecer especializado;
- acionar outros agentes;
- decidir mudança material de escopo;
- avaliar PR de implementação ou código nesta etapa.

A responsabilidade futura de avaliar a implementação antes do merge será especificada e testada em etapa própria.
