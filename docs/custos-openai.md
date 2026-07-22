# Custos OpenAI — LP Factory 10

## 0. Cabeçalho

### 0.1. Identificação

- Documento: registro de custos e aprendizados de uso da OpenAI.
- Escopo: ChatGPT/Codex App e OpenAI API.
- Atualização inicial: 20/07/2026.
- Última atualização: 20/07/2026.

## 1. Objetivo

### 1.1. Uso do documento

- Registrar separadamente os custos de assinatura e uso do ChatGPT/Codex App e os custos da OpenAI API.
- Medir consumo real antes de decisões de plano, créditos, modelos ou limites de gasto.
- Separar fatos observados de estimativas.
- Evitar misturar produtos com cobranças, franquias e controles distintos.

## 2. Divisão dos custos

### 2.1. ChatGPT e Codex App

- Inclui assinatura do ChatGPT, franquia de uso do Codex App e créditos avulsos para excedente.
- É o custo relacionado ao uso humano das interfaces ChatGPT e Codex App.

### 2.2. OpenAI API

- Inclui consumo programático realizado pelo produto, automações, serviços ou testes por meio da API.
- A cobrança da API é separada da assinatura do ChatGPT e dos créditos avulsos do Codex App.
- Limites e controles da API devem ser registrados sem serem confundidos com os limites do plano ChatGPT.

## 3. Fontes oficiais

### 3.1. ChatGPT e Codex App

- Codex rate card: https://help.openai.com/en/articles/20001106-codex-rate-card
- Créditos para uso flexível: https://help.openai.com/en/articles/12642688-using-credits-for-flexible-usage-in-chatgpt-freegopluspro

### 3.2. OpenAI API

- OpenAI Platform: https://platform.openai.com/
- E-mail da OpenAI recebido em 26/06/2026 com o assunto `API spend limits`, informando a disponibilidade de limite mensal rígido de gastos na API Platform.

### 3.3. Regra de atualização

- Confirmar preços, validade, modelos, franquias e regras nas fontes oficiais antes de novas decisões.
- Registrar a data da consulta quando uma decisão depender de valores vigentes.

## 4. ChatGPT e Codex App

### 4.1. Plano atual

- Plano atual: ChatGPT Pro.
- Valor informado no upgrade: US$ 100 por mês.
- Data do upgrade: 20/07/2026.
- Vigência atual: até 19/08/2026.
- Plano anterior: ChatGPT Plus, US$ 20 por mês.
- Finalidade principal no projeto: uso do Codex App para análise, documentação, implementação e validação.

### 4.2. Compra de créditos avulsos

- Data: 20/07/2026.
- Valor: US$ 20.
- Quantidade: 500 créditos.
- Validade informada na compra: 12 meses.
- Saldo inicial após a compra: 500 créditos.
- Motivo: continuar o trabalho após esgotar o limite semanal incluído e medir o consumo real antes de considerar upgrade.
- Resultado no mesmo dia: saldo integral consumido sem concluir duas tarefas de implementação.

### 4.3. Como o consumo é medido

#### 4.3.1. Unidade principal

- Usar créditos consumidos por tarefa ou trecho de tarefa como métrica principal.
- Tokens podem ajudar na análise, mas não substituem o custo real em créditos.
- O custo varia conforme modelo, entrada nova, entrada em cache e saída.

#### 4.3.2. Procedimento por tarefa

- Registrar o saldo imediatamente antes da execução.
- Executar uma única tarefa relevante, evitando outras execuções simultâneas.
- Registrar o saldo depois da conclusão ou interrupção.
- Calcular: créditos consumidos = saldo anterior − saldo posterior.
- Anotar modelo, nível de raciocínio, escopo e resultado da tarefa.

#### 4.3.3. Registro de medições

| Data | Tarefa | Modelo e nível | Saldo antes | Saldo depois | Créditos usados | Resultado |
|---|---|---|---:|---:|---:|---|
| 20/07/2026 | Primeira execução parcial de implementação da E18.5 | GPT-5.6 Sol, médio | 500 | 345 | 155 | Parte da tarefa executada; consumo de 31% do pacote |
| 20/07/2026 | Continuação/segunda execução de implementação da E18.5 | GPT-5.6 Sol, médio | 345 | 0 | 345 | Créditos esgotados antes da conclusão da tarefa |
| **Total** | **Duas execuções sem conclusão integral das duas tarefas** | **GPT-5.6 Sol, médio** | **500** | **0** | **500** | **US$ 20 consumidos no mesmo dia** |

### 4.4. Comparação econômica observada

#### 4.4.1. Créditos avulsos

- Os 500 créditos custaram o mesmo valor nominal do plano Plus mensal: US$ 20.
- O pacote foi consumido em duas execuções de implementação, sem permitir concluir integralmente as duas tarefas.
- A primeira execução parcial consumiu 155 créditos, equivalentes a US$ 6,20.
- A segunda execução consumiu os 345 créditos restantes, equivalentes a US$ 13,80, antes da conclusão.

#### 4.4.2. Uso incluído no Plus

- O plano Plus não informa equivalência pública entre sua franquia semanal e créditos avulsos.
- Pela experiência operacional do projeto, a franquia incluída permite dezenas de tarefas ou etapas ao longo do mês, embora a quantidade varie por modelo e complexidade.
- A percepção inicial é de que o custo por trabalho realizado com créditos avulsos é muitas vezes superior ao custo efetivo do uso incluído no Plus.
- Ainda não há base oficial para definir uma proporção exata.

#### 4.4.3. Upgrade para o Pro

- O upgrade aumenta o custo recorrente mensal de US$ 20 para US$ 100.
- A diferença mensal em relação ao Plus é de US$ 80.
- A vigência atual do Pro vai de 20/07/2026 até 19/08/2026.
- A decisão foi tomada após os 500 créditos avulsos serem consumidos sem concluir duas tarefas de implementação.
- O plano Pro será avaliado pelo volume real de trabalho permitido, pela redução de interrupções e pela previsibilidade operacional.

### 4.5. Aprendizados

#### 4.5.1. Resultado do primeiro experimento

- A hipótese de que 500 créditos ofereceriam uma extensão razoável para várias tarefas substanciais não se confirmou.
- Créditos avulsos mostraram-se inadequados para o fluxo normal de implementação do LP Factory 10 com GPT-5.6 Sol em nível médio.
- O tamanho visual de uma resposta ou diff não representa todo o processamento cobrado durante a tarefa.
- Implementação com leitura de repositório, execução de comandos, testes, correções e contexto acumulado pode consumir o pacote rapidamente.
- Trocar o Sol por modelos mais econômicos pode reduzir custo, mas também pode reduzir assertividade em implementações críticas.

#### 4.5.2. Limites da conclusão

- O experimento contém apenas um pacote de 500 créditos e duas execuções relacionadas.
- Não foi possível separar com precisão tokens de entrada, cache e saída por tarefa na interface observada.
- O resultado é suficiente para rejeitar créditos avulsos como solução econômica padrão neste fluxo, mas não para calcular equivalência oficial com a franquia do Plus.

### 4.6. Decisão operacional atual

- Não ativar recarga automática de créditos avulsos.
- Não comprar novo pacote para continuar implementações normais no GPT-5.6 Sol.
- Usar a franquia do plano Pro para implementações críticas.
- Medir duração da franquia e quantidade de tarefas concluídas no Pro.
- Reavaliar a permanência no Pro antes de 19/08/2026.

## 5. OpenAI API

### 5.1. Natureza do custo

- A API possui cobrança própria, separada do ChatGPT Pro e dos créditos do Codex App.
- O consumo deve ser acompanhado por projeto, modelo, tokens e valor faturado na OpenAI Platform.
- A assinatura do ChatGPT não deve ser tratada como saldo de API.

### 5.2. Controle de gastos

- Em 26/06/2026, a OpenAI informou por e-mail que passou a permitir um limite mensal rígido de gastos na API Platform.
- Ao atingir o limite configurado, o tráfego da API é interrompido até o aumento do limite ou o início do próximo ciclo mensal.
- O limite rígido deve ser usado como proteção contra consumo inesperado.

### 5.3. Situação atual a registrar

- Valor mensal efetivamente gasto: ainda não registrado neste documento.
- Limite mensal rígido configurado: ainda não registrado neste documento.
- Projetos ou serviços consumidores: registrar quando houver confirmação operacional.
- Próximo passo documental: incluir valores reais e limites somente após consulta à OpenAI Platform.

### 5.4. Registro de consumo

| Período | Projeto ou serviço | Modelo | Tokens ou unidade | Valor | Limite configurado | Observações |
|---|---|---|---:|---:|---:|---|
| — | — | — | — | — | — | A iniciar |

## 6. Histórico de decisões

### 6.1. 20/07/2026 — créditos do Codex

- Decisão: manter o ChatGPT Plus e comprar 500 créditos por US$ 20.
- Resultado: os créditos foram consumidos no mesmo dia sem conclusão integral de duas tarefas.
- Decisão posterior: rejeitar créditos avulsos como solução econômica padrão para implementações com GPT-5.6 Sol médio.

### 6.2. 20/07/2026 — upgrade do ChatGPT

- Decisão: realizar upgrade do ChatGPT Plus para o ChatGPT Pro de US$ 100 por mês.
- Vigência atual: de 20/07/2026 até 19/08/2026.
- Hipótese a validar: a franquia ampliada do Pro oferece melhor custo por trabalho concluído e maior previsibilidade.

### 6.3. 20/07/2026 — separação dos custos

- Decisão: dividir o documento entre ChatGPT/Codex App e OpenAI API.
- Motivo: são produtos com cobranças, franquias, unidades de consumo e controles distintos.
- Regra: não somar ou comparar diretamente os dois custos sem indicar claramente a origem e a finalidade.