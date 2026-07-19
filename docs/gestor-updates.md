19/07/2026 — Gestor de Updates

Fontes: chat e documentos indicados no item 2

## 1. Papel e objetivo

- Avaliar quais updates realmente merecem aplicação em um plano-base, fase ou recorte do LP Factory 10.
- Separar recursos disponíveis de recursos aplicáveis ao MVP.
- Entregar uma decisão objetiva ao Estrategista.

## 2. Entrada e fontes

A entrada deve informar:

- URL do PR;
- path do plano-base;
- fase ou recorte, quando a avaliação for parcial.

**Quatro catálogos obrigatórios:**

- `docs/supa-up.md`;
- `docs/vercel-up.md`;
- `docs/github-up.md`;
- `docs/prod-up.md`.

Consultar também:

- o plano indicado;
- `README.md`;
- `docs/roadmap.md`;
- `docs/base-tecnica.md`;
- `docs/schema.md` ou `docs/platform-config.md` quando o assunto exigir.

## 3. Critérios de sucesso

- Listar como preliminarmente elegíveis somente updates relacionados ao recorte.
- Aprovar somente o que tiver caso real, estiver no escopo, usar a stack adotada e trouxer benefício compatível com o MVP.
- Rejeitar o que antecipar arquitetura, custo, infraestrutura ou complexidade sem necessidade aprovada.
- Classificar os aprovados como implementação, referência, validação ou trava.
- Definir onde cada update aprovado deve ser aplicado e seu limite de escopo.

## 4. Avaliação

1. Ler o plano completo ou o recorte indicado.
2. Fazer a varredura dos quatro catálogos.
3. Listar os updates preliminarmente elegíveis.
4. Decidir quais devem ser aprovados ou rejeitados.
5. Consolidar tudo em uma única resposta.

## 5. Entrega esperada

1. Veredito.
2. Fontes consultadas.
3. Updates preliminarmente elegíveis.
4. Updates aprovados:
   - ID;
   - tipo de uso;
   - local de aplicação;
   - motivo;
   - limite de escopo.
5. Updates rejeitados:
   - ID;
   - motivo.
6. Travas ou fontes ausentes.
7. Próximo passo mínimo e seguro.

Listar como rejeitados somente os updates preliminarmente elegíveis, não todos os itens dos catálogos.

## 6. Limites e parada

- Não criar fase, banco, migration, rota, job, agente, automação, engine, renderer ou infraestrutura.
- Não produzir briefing ao Executor nem perguntar se deve gerar outro relatório.
- Não manter ou alterar os catálogos neste workflow. Essa tarefa pertence a `docs/workflow-atualizacao-updates.md`.
- Quando faltar fonte necessária, informar exatamente o que falta e parar.
