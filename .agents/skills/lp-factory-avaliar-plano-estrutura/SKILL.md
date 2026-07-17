---
name: lp-factory-avaliar-plano-estrutura
description: Avaliar estruturalmente um plano-base do LP Factory 10 por meio do custom agent gestor-estrutural. Usar quando o humano informar um PR ou o path de um plano-base e pedir avaliação estrutural, revisão pelo Gestor Estrutural ou um teste de delegação desse especialista.
---

# Avaliar estruturalmente um plano-base

Executar um teste read-only de delegação para o custom agent `gestor-estrutural` e devolver o parecer completo ao task principal.

## Entrada

Obter:

- número ou URL do PR que contém o plano-base; ou
- path local do plano-base, quando o teste não usar PR;
- objetivo explícito de avaliação estrutural.

Se nenhuma fonte do plano for informada, parar e pedir exatamente a informação faltante. Não escolher outro plano ou PR por semelhança.

## Workflow

1. Confirmar o repositório, a worktree, a branch e o estado Git atual.
2. Quando a entrada for um PR:
   - usar a integração read-only do GitHub para consultar o PR informado;
   - confirmar repositório, número, URL, base, head, head SHA e estado;
   - listar os arquivos alterados e identificar paths compatíveis com `docs/lousa-plano-base-*.md`;
   - selecionar automaticamente o path somente quando houver exatamente um plano-base;
   - pedir o path exato quando nenhum plano ou mais de um plano for identificado;
   - obter o conteúdo integral do plano usando o head SHA do PR, nunca a versão da `main`;
   - confirmar o caso ou recorte declarado no próprio plano.
3. Quando a entrada for um path local:
   - confirmar que o arquivo existe na worktree atual;
   - confirmar que o caso ou recorte está inequívoco no path e no conteúdo;
   - pedir confirmação quando houver divergência ou ambiguidade.
4. Registrar o estado Git anterior à delegação sem alterar arquivos.
5. Iniciar exatamente um subagent usando o custom agent `gestor-estrutural`.
6. Informar ao subagent:
   - raiz da worktree;
   - branch atual;
   - repositório, PR, URL, base, head e head SHA, quando aplicáveis;
   - path e conteúdo integral do plano-base;
   - caso ou recorte confirmado;
   - pedido de avaliação do plano completo;
   - proibição de editar arquivos ou ampliar o escopo.
7. Exigir que o subagent leia integralmente `docs/gestor-estrutural.md` antes da avaliação.
8. Aguardar a conclusão do subagent. Não realizar uma avaliação estrutural paralela no task principal.
9. Conferir novamente o estado Git e distinguir alterações preexistentes de qualquer mudança ocorrida durante a delegação.
10. Apresentar no task principal o parecer completo do Gestor Estrutural, sem ocultar achados ou reescrever sua conclusão.
11. Acrescentar somente um resumo operacional com:
    - custom agent acionado;
    - plano avaliado;
    - conclusão recebida;
    - confirmação de que o repositório permaneceu inalterado;
    - lacunas observadas no handoff para aprimorar o teste.

## Contrato do parecer

Aceitar como conclusão somente uma classificação prevista em `docs/gestor-estrutural.md`:

- `aprovado`;
- `aprovado com condicionantes`;
- `requer investigação`;
- `requer patch estrutural`;
- `rejeitado por conflito com fonte competente`.

Exigir que o parecer identifique:

- plano e caso avaliados;
- fontes consultadas;
- conclusão;
- achados objetivos;
- condicionantes ou investigações;
- patches estruturais recomendados, sem implementação;
- riscos ou conflitos;
- próximo passo mínimo e seguro.

Se a conclusão ou o conteúdo obrigatório estiver ausente, apresentar o resultado recebido e classificar o handoff como incompleto. Não completar o parecer em nome do especialista.

## Limites

- Não editar o plano-base.
- Não alterar o PR avaliado.
- Não criar commit, branch ou PR.
- Não acionar outro especialista.
- Não consolidar plano-base v2.
- Não executar fases do plano.
- Não transformar recomendação estrutural em implementação.
