# Custos OpenAI — LP Factory 10

## 0. Cabeçalho

### 0.1. Identificação

- Documento: registro de custos e aprendizados de uso da OpenAI.
- Escopo: gastos recorrentes, créditos avulsos e consumo observado em tarefas do Codex.
- Atualização inicial: 20/07/2026.
- Última atualização: 20/07/2026.

## 1. Objetivo

### 1.1. Uso do documento

- Registrar custos reais relacionados ao desenvolvimento do LP Factory 10.
- Medir o consumo do Codex por tarefa antes de decidir por upgrade de plano.
- Separar fatos observados de estimativas.
- Evitar decisões baseadas apenas em limites genéricos ou percepção de uso.

## 2. Fontes oficiais

### 2.1. Referências

- Codex rate card: https://help.openai.com/en/articles/20001106-codex-rate-card
- Créditos para uso flexível: https://help.openai.com/en/articles/12642688-using-credits-for-flexible-usage-in-chatgpt-freegopluspro

### 2.2. Regra de atualização

- Confirmar preços, validade, modelos e regras nas fontes oficiais antes de novas decisões.
- Registrar a data da consulta quando uma decisão depender de valores vigentes.

## 3. Situação atual

### 3.1. Plano

- Plano atual: ChatGPT Plus.
- Finalidade principal no projeto: uso do Codex App para análise, documentação, implementação e validação.

### 3.2. Compra de créditos

- Data: 20/07/2026.
- Valor: US$ 20.
- Quantidade: 500 créditos.
- Validade informada na compra: 12 meses.
- Saldo inicial após a compra: 500 créditos.
- Motivo: continuar o trabalho após esgotar o limite semanal incluído e medir o consumo real antes de considerar upgrade.
- Resultado no mesmo dia: saldo integral consumido sem concluir duas tarefas de implementação.

## 4. Como o consumo é medido

### 4.1. Unidade principal

- Usar créditos consumidos por tarefa ou trecho de tarefa como métrica principal.
- Tokens podem ajudar na análise, mas não substituem o custo real em créditos.
- O custo varia conforme modelo, entrada nova, entrada em cache e saída.

### 4.2. Procedimento por tarefa

- Registrar o saldo imediatamente antes da execução.
- Executar uma única tarefa relevante, evitando outras execuções simultâneas.
- Registrar o saldo depois da conclusão ou interrupção.
- Calcular: créditos consumidos = saldo anterior − saldo posterior.
- Anotar modelo, nível de raciocínio, escopo e resultado da tarefa.

### 4.3. Registro de medições

| Data | Tarefa | Modelo e nível | Saldo antes | Saldo depois | Créditos usados | Resultado |
|---|---|---|---:|---:|---:|---|
| 20/07/2026 | Primeira execução parcial de implementação da E18.5 | GPT-5.6 Sol, médio | 500 | 345 | 155 | Parte da tarefa executada; consumo de 31% do pacote |
| 20/07/2026 | Continuação/segunda execução de implementação da E18.5 | GPT-5.6 Sol, médio | 345 | 0 | 345 | Créditos esgotados antes da conclusão da tarefa |
| **Total** | **Duas execuções sem conclusão integral das duas tarefas** | **GPT-5.6 Sol, médio** | **500** | **0** | **500** | **US$ 20 consumidos no mesmo dia** |

## 5. Comparação econômica observada

### 5.1. Créditos avulsos

- Os 500 créditos custaram o mesmo valor nominal do plano Plus mensal: US$ 20.
- O pacote foi consumido em duas execuções de implementação, sem permitir concluir integralmente as duas tarefas.
- A primeira execução parcial consumiu 155 créditos, equivalentes a US$ 6,20.
- A segunda execução consumiu os 345 créditos restantes, equivalentes a US$ 13,80, antes da conclusão.

### 5.2. Uso incluído no Plus

- O plano Plus não informa equivalência pública entre sua franquia semanal e créditos avulsos.
- Pela experiência operacional do projeto, a franquia incluída permite dezenas de tarefas ou etapas ao longo do mês, embora a quantidade varie por modelo e complexidade.
- A percepção inicial é de que o custo por trabalho realizado com créditos avulsos é muitas vezes superior ao custo efetivo do uso incluído no Plus.
- Ainda não há base oficial para definir uma proporção exata.

## 6. Aprendizados

### 6.1. Resultado do primeiro experimento

- A hipótese de que 500 créditos ofereceriam uma extensão razoável para várias tarefas substanciais não se confirmou.
- Créditos avulsos mostraram-se inadequados para o fluxo normal de implementação do LP Factory 10 com GPT-5.6 Sol em nível médio.
- O tamanho visual de uma resposta ou diff não representa todo o processamento cobrado durante a tarefa.
- Implementação com leitura de repositório, execução de comandos, testes, correções e contexto acumulado pode consumir o pacote rapidamente.
- Trocar o Sol por modelos mais econômicos pode reduzir custo, mas também pode reduzir assertividade em implementações críticas.

### 6.2. Limites da conclusão

- O experimento contém apenas um pacote de 500 créditos e duas execuções relacionadas.
- Não foi possível separar com precisão tokens de entrada, cache e saída por tarefa na interface observada.
- O resultado é suficiente para rejeitar créditos avulsos como solução econômica padrão neste fluxo, mas não para calcular equivalência oficial com a franquia do Plus.

## 7. Decisão operacional atual

### 7.1. Uso de créditos

- Não ativar recarga automática.
- Não comprar novo pacote para continuar implementações normais no GPT-5.6 Sol.
- Tratar créditos avulsos apenas como recurso emergencial e controlado, caso haja necessidade concreta.

### 7.2. Uso do Codex

- Priorizar o GPT-5.6 Sol para implementações críticas dentro da franquia do plano.
- Quando a franquia terminar, preferir aguardar a redefinição antes de reduzir o modelo sem avaliação do risco.
- Avaliar upgrade de plano com base no volume real de trabalho incluído, e não por equivalência nominal entre US$ 20 de plano e US$ 20 de créditos.

## 8. Histórico de decisões

### 8.1. 20/07/2026 — compra

- Decisão: manter o ChatGPT Plus e comprar 500 créditos por US$ 20.
- Hipótese: créditos avulsos poderiam oferecer melhor controle de custo que um upgrade imediato.

### 8.2. 20/07/2026 — resultado

- Resultado: os 500 créditos foram consumidos no mesmo dia em duas execuções de implementação, sem conclusão integral das duas tarefas.
- Decisão: hipótese inicial rejeitada para o fluxo normal de implementação com GPT-5.6 Sol médio.
- Próxima análise: comparar a franquia real do Plus com os planos superiores antes de qualquer nova compra ou upgrade.