10/08/2026 — Rascunho vivo — E19.4 — Geração e materialização da landing page em `draft`

## 1. Estado do debate

### 1.1. Estado

- Status: rascunho vivo; ainda não consolidado como plano-base v1.
- Recorte: `E19.4 — Geração e materialização da landing page em draft`.
- Plano conceitual: `docs/lp-planejamento.md`.
- Predecessor material: E19.3 concluída e integrada à `main`; sua API pública v1 é a entrada canônica para este debate.
- O roadmap define a E19.4 como o recorte sucessor responsável por geração por IA, validação pós-IA, materialização e visualização mínimas necessárias à primeira LP real em `draft`.
- Este rascunho registra somente base confirmada e questões abertas; hipóteses discutidas não são decisões fixas até aprovação humana explícita.

### 1.2. Objetivo já confirmado

- Consumir a saída real e validada da E19.3 para gerar conteúdo estruturado candidato da primeira LP real.
- Validar deterministicamente a resposta antes de qualquer materialização.
- Materializar a LP no `draft` já existente, preservando snapshot suficiente das fontes e decisões efetivamente usadas.
- Tornar a primeira LP real avaliável por visualização mínima, sem antecipar publicação, tracking, analytics ou editor visual.
- Usar o mesmo fluxo oficial para conta piloto e clientes; não criar LP teste, geração administrativa paralela ou autorização especial por conta.

### 1.3. Fontes obrigatórias do debate

- `README.md`.
- `docs/lp-planejamento.md`.
- `docs/roadmap.md`.
- `docs/template-roadmap.md`.
- `docs/base-tecnica.md`.
- `docs/schema.md`.
- `docs/prompt-estrategista.md`.
- `docs/lousa-plano-base-e19-3.md`.
- Contrato público vigente de `lib/lp-builder/`, especialmente `generationContextContracts.ts` e a API E19.3 integrada à `main`.
- Repositório `AlcinoAfonso/LP-Factory-10`.

## 2. Base confirmada para o contrato da E19.4

### 2.1. Entrada canônica

- A E19.4 não recompõe E10.8, E18.4, E18.5, E20.2 ou E20.3.
- A entrada funcional deve partir do sucesso completo da E19.3: Parte A determinística + Parte B de matéria-prima autorizada.
- Parte A já contém identidade da LP, plano, taxon, proveniência do perfil, versões, root, seleção estrutural e módulos efetivos.
- Parte B já contém pesquisa autorizada, fatos autorizados, suporte de capabilities, `generationGuidance` quando presente e contexto por módulo.
- Falha da E19.3 não autoriza chamada à IA nem materialização parcial.

### 2.2. Independência da LP após materialização

- As fontes canônicas governam a geração e futuras edições assistidas pela LP Factory.
- Depois de materializada, a LP possui estado próprio.
- Edição manual futura pode divergir das recomendações de geração sem alterar fontes canônicas ou outras LPs.
- Versões futuras das fontes canônicas não passam a reger silenciosamente a LP já materializada; adoção exige ação explícita.
- Somente restrições classificadas pelo contrato responsável como permanentes continuam obrigatórias após a materialização.

### 2.3. Limites já confirmados

- Não reabrir E18.4, E18.5, E20.2, E20.3 ou E19.2 sem bloqueio real demonstrado pela primeira geração.
- Não criar fluxo especial para a conta piloto.
- Não antecipar publicação pública, domínio customizado, tracking, analytics/dashboard, CRM, A/B test ou Google Ads.
- Não antecipar editor visual completo, regeneração ampla, edição assistida por IA, agente, memória, job, fila ou automação recorrente.
- Não criar abstração geral de geração multicanal; o consumidor atual é `landing_page`.

## 3. Fluxo lógico em construção

### 3.1. Gatilho

- Questão aberta: definir a ação humana explícita que inicia a geração no espaço operacional da LP `draft`, sem inventar rota ou superfície antes de confirmar o desenho mínimo do recorte.

### 3.2. Entrada

- LP `draft` legítima e vinculada à configuração concluída.
- Resultado de sucesso da API pública E19.3 para essa LP.
- Configuração OpenAI server-side vigente e autorizada pelo projeto no momento da implementação.

### 3.3. Processamento

- Questão aberta: definir a unidade de geração e o contrato de resposta da IA.
- A IA deve produzir somente conteúdo permitido pelo contrato da E19.3 e pelos fields efetivos de cada módulo.
- A IA não escolhe novos módulos, variantes, ordem, capabilities, fontes ou fatos fora do pacote autorizado.

### 3.4. Validação

- A resposta da IA deve ser validada server-side antes da materialização.
- Questão aberta: fechar o conjunto mínimo de validações pós-IA e separar falha total, correção determinística possível e conteúdo que deve ser rejeitado.

### 3.5. Persistência

- O estado atual de `account_landing_pages` guarda apenas identidade mínima e status `draft`; não existe hoje conteúdo materializado da LP nesse contrato.
- A E19.4 precisa preservar conteúdo estruturado e snapshot suficiente, mas o formato físico e a residência ainda são questões abertas deste debate.
- Nenhuma tabela, coluna ou nova entidade está autorizada por este rascunho.

### 3.6. Consumo

- A primeira LP materializada precisa ser visualmente avaliável no fluxo oficial da conta.
- Questão aberta: definir a menor visualização capaz de validar a LP real sem antecipar publicação ou editor visual.

### 3.7. Fallback

- Falha da compilação E19.3 bloqueia a geração.
- Questão aberta: definir atomicidade da geração/materialização e comportamento diante de falha da OpenAI ou resposta inválida, preservando o `draft` anterior sem aparentar conclusão parcial.

## 4. Gates do debate ainda abertos

### 4.1. Gate A — unidade de geração e contrato da IA

- Decidir se a primeira geração ocorre em uma resposta estruturada para a LP completa ou em múltiplas gerações coordenadas por módulo.
- Definir o menor contrato estruturado que represente somente os fields já determinados pela E19.3.
- Definir limites de retry/correção sem introduzir agente, conversa persistente ou orquestração desnecessária.

### 4.2. Gate B — validação pós-IA

- Definir quais regras são puramente estruturais e determinísticas.
- Definir como validar cardinalidade, fields obrigatórios, tipos, claims factuais, suporte/evidência, tratamentos proibidos e destinos operacionais.
- Definir se qualquer invalidez rejeita a geração inteira ou se existe correção/omissão segura contratualmente autorizada.

### 4.3. Gate C — materialização e snapshot

- Definir o estado materializado mínimo da LP.
- Separar conteúdo atual da LP do snapshot das fontes/contratos usados na geração.
- Definir proveniência e versionamento suficientes para futuras edição, regeneração e adoção explícita de novas fontes, sem antecipar esses fluxos.
- Decidir a residência física somente depois de confirmar o contrato lógico necessário.

### 4.4. Gate D — visualização mínima da primeira LP

- Definir o menor renderer/preview necessário para avaliação humana da LP materializada.
- Preservar responsividade, acessibilidade e guardrails visuais vigentes sem transformar a E19.4 em editor visual ou publicação pública.
- Definir evidências esperadas para desktop, mobile e teclado quando houver frontend.

### 4.5. Gate E — fronteira da primeira entrega

- Confirmar se a E19.4 termina em `gerar → validar → materializar → visualizar` ou se algum passo adicional é indispensável para considerar a primeira LP real avaliável.
- Revisão editorial, correção manual, regeneração, edição assistida e publicação permanecem fora até demonstração de necessidade indispensável neste debate.

## 5. Próxima decisão do debate

- Iniciar pelo Gate A, porque a unidade de geração define o contrato de resposta, a validação pós-IA e o tamanho mínimo da materialização.
- Após fechar o Gate A, atualizar este mesmo rascunho vivo e seguir aos Gates B, C, D e E.
- Não consolidar plano-base v1 enquanto permanecer questão indispensável aberta para executar a E19.4 com segurança e sem inventar contrato.
