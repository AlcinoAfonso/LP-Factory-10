# Gestor de Automações — LP Factory 10

## 1. Objetivo

Este documento governa propostas, pesquisas, avaliações, testes e decisões sobre automações e agentes antes da aprovação formal e antes da entrada no catálogo operacional em `docs/automations.md`.

O objetivo é manter um registro enxuto de oportunidades em análise, hipóteses, provas de conceito, riscos, custos, limites e decisões. Este documento não é o catálogo de automações operacionais nem substitui a documentação técnica ou de produto do LP Factory 10.

## 2. Responsabilidade do Gestor de Automações

O Gestor de Automações deve:

* identificar oportunidades reais de automação;
* avaliar a utilidade prática para o projeto;
* comparar alternativas determinísticas, agentes, integrações e processo manual;
* evitar overengineering e adoção de agentes sem necessidade concreta;
* analisar custo, risco e manutenção esperada;
* definir quando há necessidade de aprovação humana;
* validar se existe observabilidade suficiente para operar e diagnosticar o fluxo;
* recomendar adoção, teste, rejeição ou encaminhamento para outro documento ou responsável.

## 3. Fronteiras documentais

A fronteira entre documentos deve ser mantida antes de registrar qualquer item.

* `docs/gestor-codex.md`: recursos que melhoram o ambiente ou o trabalho direto do Codex, como plugins, configurações, skills e capacidades do Codex App.
* `docs/gestor-automations.md`: propostas, pesquisas, avaliações, testes e decisões sobre automações ou agentes ainda não formalizados como operação.
* `docs/automations.md`: automações ou agentes aprovados, em implementação formal ou já operacionais, com catálogo, status, dependências e instruções operacionais.
* Gestor de produto ou roadmap: funcionalidades visíveis ao cliente, mudanças de produto, UX, escopo funcional ou evolução de casos do roadmap.

Se um item misturar mais de uma fronteira, cada parte deve ser registrada no documento adequado, com referência cruzada e sem duplicação integral.

## 4. Tipos de item governado

* Automação determinística: fluxo previsível, com entradas, saídas e regras fixas, adequado quando não há necessidade de raciocínio adaptativo.
* Agente: componente com capacidade de decidir passos intermediários, consultar ferramentas ou adaptar a execução dentro de limites definidos.
* Workflow híbrido: combinação de etapas determinísticas, revisão humana e possível uso de agente em pontos específicos.
* Integração: conexão entre sistemas como GitHub, Supabase, Vercel, OpenAI ou outros serviços relevantes ao projeto.
* Job agendado: execução recorrente em horário, intervalo ou gatilho temporal ainda em avaliação.
* GitHub Action: workflow do GitHub Actions ainda em proposta, validação ou prova de conceito.
* Prova de conceito: teste limitado para validar viabilidade, custo, risco ou benefício antes de aprovar implementação formal.
* Recurso externo em monitoramento: lançamento, ferramenta ou capacidade de plataforma acompanhada por possível impacto futuro no LP Factory 10.

## 5. Ciclo de avaliação

Fluxo principal:

```txt
identificada → em avaliação → em teste → aprovada → encaminhada
```

Fluxos alternativos permitidos:

```txt
rejeitada → suspensa → arquivada
```

Regras do ciclo:

* itens nos estados `identificada`, `em avaliação`, `em teste` e `aprovada` permanecem neste documento;
* itens aprovados para implementação formal devem ser registrados em `docs/automations.md` quando forem encaminhados ao catálogo operacional;
* aprovação não significa implementação concluída;
* itens rejeitados, suspensos ou arquivados devem manter justificativa suficiente para evitar reavaliação sem fato novo;
* itens encaminhados para produto, roadmap ou Gestor Codex devem indicar o destino correto.

## 6. Critérios de avaliação

Cada proposta deve ser avaliada com critérios objetivos:

* problema resolvido: qual dor operacional concreta o item resolve;
* benefício esperado: ganho de tempo, redução de erro, melhoria de controle ou aumento de previsibilidade;
* frequência de uso: recorrência real ou estimada do problema;
* impacto operacional: efeito em desenvolvimento, validação, publicação, suporte ou manutenção;
* complexidade: esforço de implementação, operação, entendimento e diagnóstico;
* custo: consumo de plataforma, execução, modelo, storage, manutenção e tempo humano;
* dependências: sistemas, credenciais, APIs, permissões, serviços e artefatos necessários;
* risco: chance de falha, impacto de falha, efeito em dados, publicação, segurança ou reputação;
* segurança: acesso a dados, segredos, permissões, escopo de leitura/escrita e exposição de informações;
* necessidade de aprovação humana: pontos que exigem revisão antes de publicar, excluir, alterar dados, gerar custo ou acionar terceiros;
* observabilidade: logs, summaries, artifacts, métricas, alertas ou evidências mínimas para auditoria e troubleshooting;
* capacidade de rollback: forma de interromper, desfazer, reverter ou neutralizar efeitos;
* manutenção: responsável, frequência de revisão, dependência de APIs instáveis e custo de atualização;
* adequação ao MVP: alinhamento com necessidades atuais, evitando automação prematura ou solução maior que o problema.

## 7. Gate de aprovação

Uma automação ou agente só pode ser encaminhado para `docs/automations.md` quando houver:

* caso de uso definido;
* responsável definido;
* entrada e saída definidas;
* dependências identificadas;
* riscos avaliados;
* custo minimamente estimado;
* aprovação humana definida;
* observabilidade mínima definida;
* critério de sucesso definido;
* decisão formal registrada.

Sem esses elementos, o item deve permanecer em avaliação, ser suspenso, ser rejeitado ou ser encaminhado ao documento correto.

## 8. Casos híbridos com Codex

Casos que envolvem Codex e automação devem respeitar a separação documental:

* o recurso técnico que melhora o ambiente ou trabalho direto do Codex permanece documentado em `docs/gestor-codex.md`;
* o processo automatizado, hipótese de automação, agente ou prova de conceito é governado em `docs/gestor-automations.md`;
* após aprovação formal, a implementação operacional entra em `docs/automations.md`;
* referências cruzadas devem ser usadas para conectar os documentos, evitando duplicação integral de conteúdo.

Exemplo de fronteira: uma capacidade do Codex App pode ser registrada no Gestor Codex, enquanto a proposta de transformar um procedimento recorrente do projeto em automação deve ser avaliada neste documento.

## 9. Registro de oportunidades

Usar o modelo compacto abaixo para futuras oportunidades. Não registrar oportunidades fictícias.

```md
### OP-AAAA-MM-DD-001 — Nome da oportunidade

* Identificação: OP-AAAA-MM-DD-001
* Nome:
* Problema:
* Proposta:
* Tipo:
* Sistemas envolvidos:
* Benefício esperado:
* Frequência:
* Risco:
* Custo:
* Aprovação humana:
* Observabilidade:
* Status:
* Decisão:
* Próximo passo:
* Documentos relacionados:
```

## 10. Registro de decisões

Usar o modelo abaixo para decisões formais sobre itens avaliados.

```md
### DEC-AAAA-MM-DD-001 — Item avaliado

* Data:
* Item:
* Decisão:
* Justificativa:
* Responsável:
* Impacto:
* Destino:
* Condição para revisão:
```

## 11. Itens atuais

Estado inicial conhecido:

* não há automação ou agente novo aprovado por este documento;
* Agents SDK permanece pendente de avaliação por caso concreto;
* Workspace Agents permanece pendente de avaliação por caso concreto;
* novos casos devem ser registrados quando houver problema real e proposta concreta.

Este registro não inventa testes, custos, decisões ou implementações.

## 12. Próximos passos

Próximos passos para iniciar o uso deste documento:

* selecionar um procedimento recorrente real do projeto;
* documentar o problema e a frequência;
* avaliar se automação é necessária;
* comparar solução determinística, agente e processo manual;
* executar prova de conceito apenas se houver benefício justificável;
* encaminhar para aprovação formal antes da implementação operacional.
