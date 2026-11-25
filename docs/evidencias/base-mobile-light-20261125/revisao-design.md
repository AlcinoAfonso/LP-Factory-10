25/11/2026 15:05

**Modo:** `revisao_resultado`. **Caso:** correção visual pós-PR #1187, restrita ao fundo claro, cabeçalho responsivo e apresentação inicial recolhida da conversa de nicho.

**Referência técnica:** branch `codex-app/base-mobile-light-20261125`, runtime/HEAD `eb4241438aba1e0a474c3197536c5f1195597f07`, base `10b144d056d258716d5240f8082ff601c04db599`.

**Conclusão:** **aderente ao contrato visual nas evidências disponíveis, sem achados materiais neste recorte.** Isso permite avançar para o teste humano no aparelho original; não equivale à homologação desse aparelho ou de modos externos de escurecimento.

### Fontes e critérios aplicados

Consultei `docs/design-system.md`, os três arquivos de UI alterados, `QA.md`, `qa-runtime.json` e todas as capturas indicadas. Visualizei a referência humana, a baseline Corretor e os resultados juntos no mesmo input.

Apliquei os padrões vigentes de cabeçalho operacional compacto, preservação de identidade e tipografia, densidade útil, ajuda progressiva, reflow e alvos de interação acessíveis. Não identifiquei necessidade de alterar o Design System, os componentes globais ou a estrutura das categorias.

### Aderência observada

- **Cabeçalho:** em 390×844 e 1366×768, título, ajuda e retorno aparecem na mesma faixa, sem sobreposição. Em 320×568, “Base de Comunicação” ocupa duas linhas, com “Comunicação” inteira; o retorno acomoda duas linhas à direita. No stress 280×568, o título continua inteiro e o retorno acomoda três linhas. O tamanho registrado do título permanece **20 px**, sem redução para forçar encaixe.
- **Ação de nicho:** “Redefinir nicho” aparece imediatamente abaixo do título e alinhado à mesma margem esquerda. As medidas registradas mantêm o alvo de 44 px. A acomodação do retorno não criou uma faixa extra entre título e ação.
- **Apresentação inicial:** a captura da conta correta, **Corretor Alfa QA2**, mostra a conversa ativa recolhida na entrada. A coleção principal passa a aparecer diretamente, eliminando a competição visual do formulário aberto observada na referência humana.
- **Abertura da conversa:** a captura `mobile320-conversa-aberta.jpg` e o registro de execução mostram a mensagem anterior reapresentada, campo vazio e foco no textarea. A revisão não encontrou alteração nos callbacks, transporte ou mecanismo de histórico. O estado inicial e o rótulo foram ajustados somente na Base; a condição da Home permanece preservada.
- **Esquema claro:** as capturas disponíveis mostram header, página, formulário e introdução em claro. O registro confirma meta `only light`, superfície com `light only` e fundos brancos em body/main/dialog. A implementação reutiliza `surface.base` e restringe a declaração à página/superfície da Base.
- **Escopo:** o delta de runtime contém somente os três arquivos de apresentação, com 14 inserções e 6 remoções. Não há alteração neste delta de prompts, ações de servidor, persistência, permissões ou Design System.

O ganho em relação à baseline é perceptível: a identidade e as seções ficam acessíveis na entrada; a próxima ação de nicho é explícita; o título permanece reconhecível e as ações deixam de disputar espaço a ponto de partir palavras.

### Limites da evidência

- A referência humana tem 591×1280 e a baseline anterior tem JPEG 456×656 sem viewport CSS registrada. A comparação foi qualitativa, não pixel a pixel.
- O atalho de zoom não alterou as métricas. **Não houve teste válido de fonte ampliada.**
- Não houve emulação de Force Dark, preferência escura do sistema ou Samsung/Android real. O opt-out utilizado é documentado pelo [Chrome](https://developer.chrome.com/blog/auto-dark-theme), mas esta revisão não comprova seu resultado no aparelho que originou o print.
- Os estados sem conversa, encerrado e bloqueado por produto não foram exercitados ao vivo nesta conta. O delta preserva seus mecanismos, mas não há alegação de QA completo desses estados.
- `npm ci` e `npm run check` constam como aprovados no relatório do Executor; não os reexecutei. A validação renderizada foi feita no Preview configurado, com a limitação local de configuração Supabase explicitamente registrada.

### Estado do agente e próximo passo

Agente `/root/design_mobile_light`, papel `gestor-design`, atuação somente leitura. HEAD permaneceu `eb424143`; o estado Git rastreado observado antes e depois contém somente a remoção/renomeação da baseline já informada pelo Executor. Não escrevi arquivos, alterei configuração, executei fluxos de IA nem criei agentes. Modelo/effort efetivos não foram verificados.

**Próximo passo mínimo:** entregar o Preview para repetir a verificação no aparelho original, especialmente fundo claro e fonte/tamanho utilizados pelo usuário. Manter o PR em rascunho e sem merge até essa confirmação humana. Não há indicação de novo redesign ou de ampliação do escopo.
