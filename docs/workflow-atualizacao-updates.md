22/07/2026 — Workflow de Atualização dos Catálogos de Updates
Atualizado em 05/09/2026

Fontes: chat, repositório e documentos indicados nos itens 2 e 3

Referência de estrutura: `docs/template-prompts.md`, com abordagem outcome-first

## 1. Resultado esperado e papel

### 1.1. Resultado esperado

Ao final de uma única execução:

- os quatro catálogos foram analisados na ordem do item 2;
- cada catálogo foi concluído da leitura ao relatório e ao draft PR ou à justificativa antes do início da análise do seguinte, sem processamento em lote ou paralelo;
- cada ajuste real está em branch própria criada do mesmo SHA inicial de `main`, alterando somente o documento-alvo;
- todos os IDs publicados continuam localizáveis no catálogo, sem renumeração, reutilização ou desaparecimento físico;
- itens implementados, parcialmente implementados, absorvidos, superados ou rejeitados preservam registro histórico e referências;
- ausências de ajuste, bloqueios e exceções foram registradas;
- existe um relatório final curto que consolida o que foi feito, orienta a prioridade dos updates, reapresenta os recursos transversais ainda ativos e, quando houver ação transversal recomendada para o momento atual, pede autorização direta para criar o próximo Debate em `LP Factory/Debates`;
- nenhum PR foi mergeado nem a catalogação transformada em implementação.

### 1.2. Papel

- Manter os catálogos de updates atuais, úteis, rastreáveis e baseados em fontes oficiais, sem aprovação humana intermediária entre eles.

## 2. Documentos-alvo e ordem

1. `docs/supa-up.md`
2. `docs/vercel-up.md`
3. `docs/github-up.md`
4. `docs/prod-up.md`

Os demais catálogos podem ser consultados para detectar duplicações, absorções e referências cruzadas. Isso não inicia sua análise completa.

## 3. Fontes

Consultar, para o catálogo em execução:

- o `README.md`, como política geral de avaliação tecnológica e fonte dos pilares e canais estratégicos;
- o documento-alvo no SHA inicial;
- `docs/roadmap.md`, Base Técnica, schema, configurações de plataforma, matrizes e lousas relacionadas;
- código, migrations, testes, workflows, dependências e histórico de PRs ou commits quando necessários para confirmar implementação;
- os relatórios e diffs dos catálogos anteriores já concluídos nesta execução;
- fontes oficiais externas correspondentes.

Para Supabase, usar documentação, changelog e blog oficiais. Para Vercel, usar fontes oficiais da Vercel, Next.js e React. Para GitHub e produto, seguir as fontes prioritárias definidas nos próprios catálogos.

Para cada pilar ou canal declarado estratégico no `README.md`, pesquisar explicitamente as fontes oficiais aplicáveis e registrar também quando não houver novidade relevante. O WhatsApp deve ser coberto por fontes oficiais da WhatsApp Business Platform ou Meta Business Messaging.

Fontes secundárias podem apoiar, mas não substituir a fonte oficial.

## 4. Execução

1. Congelar o SHA inicial de `main` e confirmar o `README.md` e os quatro documentos-alvo.
2. Para cada catálogo, na ordem do item 2, concluir todo o ciclo antes de iniciar a análise do seguinte:
   - ler as fontes aplicáveis e as regras do catálogo;
   - identificar o maior ID histórico, preservar todos os IDs publicados e atribuir novo ID somente acima do maior já utilizado;
   - executar gate de rastreabilidade antes de reclassificar qualquer item:
     - buscar o ID exato em todo o repositório;
     - buscar semanticamente o título, a capacidade e os artefatos associados, mesmo quando o ID não estiver citado;
     - identificar casos E*, documentos, código, migrations, testes, configurações, PRs e decisões que aplicaram ou rejeitaram o item;
     - classificar o uso como não implementado, futuro aprovado, implementado parcialmente, implementado integralmente, referência, trava, absorvido, superado ou rejeitado;
   - verificar no repositório o estado real dos itens, duplicações, uso global e registro nos documentos competentes;
   - pesquisar recursos novos, alterados, deprecados ou superados, cobrindo os pilares e canais estratégicos do `README.md`;
   - avaliar função, natureza de uso, relação com a stack, caso de uso, valor, maturidade das fontes, custo, complexidade, segurança, manutenção, dependências, riscos e horizonte;
   - registrar horizonte como Starter, Lite, Pro, Ultra ou indefinido quando houver evidência suficiente, sem transformar a classificação em decisão final de plano;
   - classificar a forma de aplicação como dependente de recorte ou transversal ao projeto:
     - dependente de recorte quando a utilidade e a aplicação precisarem ser decididas em cada plano-base, fase ou recorte;
     - transversal quando o recurso afetar stack, segurança, operação ou governança do projeto como um todo e exigir avaliação técnica ou operacional própria antes de eventual implementação;
   - exigir hipótese de superioridade e gatilho objetivo para recurso sobreposto ou substituto;
   - classificar itens existentes como manter, ajustar ou arquivar/absorver, e recursos pesquisados como adicionar, não adicionar ou não validado;
   - nunca apagar um ID publicado; quando o item sair do catálogo ativo, manter registro histórico compacto com título original, estado final, evidências, recortes e eventual substituto;
   - manter item parcialmente implementado no catálogo ativo, com os recortes aplicados e o escopo ainda não implementado;
   - retirar item do catálogo ativo somente após implementação integral e validação, rejeição formal ou superação comprovada, preservando o ID em registro histórico compacto com a evidência e as referências competentes;
   - manter item com uso real sem registro no documento técnico competente como lacuna documental;
   - adicionar somente recurso compatível com o `README.md`, com fonte oficial, valor concreto e horizonte plausível; recurso futuro ou condicional pode entrar sem autorizar implementação;
   - não rejeitar nem arquivar um recurso somente por estar fora do Starter ou do MVP atual;
   - arquivar como incompatível, duplicado, absorvido, deprecado, superado, sem valor concreto ou com custo ou risco desproporcional somente com evidência e preservação do registro;
   - classificar como não validado quando faltar fonte oficial ou evidência suficiente;
   - produzir o relatório obrigatório;
   - quando houver ajuste, criar branch do SHA inicial, alterar somente o documento-alvo, validar o diff e abrir draft PR com o relatório;
   - quando não houver ajuste, registrar a justificativa sem criar alteração artificial;
   - confirmar documento, IDs, referências, resultado do diff e URL do PR ou justificativa antes de seguir.
3. Seguir automaticamente ao próximo catálogo, sem aguardar aprovação ou merge.
4. Ao final, conferir a sequência executada, a base comum, os arquivos alterados, a cobertura dos canais estratégicos, os IDs e o estado dos PRs. Se houver divergência, informá-la e não declarar execução integralmente aderente.

## 5. Relatório obrigatório

Os itens 1 a 10 compõem o relatório de cada catálogo. O item 11 é produzido uma única vez, após a conclusão e a auditoria dos quatro ciclos, no mesmo fechamento entregue ao usuário.

1. Veredito.
2. Fontes consultadas.
3. Cobertura estratégica:
   - pilares e canais pesquisados;
   - fontes oficiais;
   - novidades encontradas ou confirmação de ausência de novidade relevante.
4. Itens mantidos:
   - IDs;
   - estado e horizonte.
5. Itens ajustados:
   - ID;
   - ajuste;
   - motivo;
   - fonte;
   - referências e recortes.
6. Itens arquivados, absorvidos ou superados:
   - ID e título original;
   - estado final;
   - motivo e evidência;
   - referências e recortes preservados;
   - ID substituto, quando houver.
7. Itens adicionados:
   - ID;
   - título;
   - natureza de uso;
   - relação com a stack e a arquitetura;
   - horizonte;
   - valor para o projeto;
   - gatilho, quando aplicável;
   - fonte;
   - dependências, riscos e limite;
   - confirmação de que o registro não autoriza implementação.
8. Itens avaliados e não adicionados:
   - recurso;
   - motivo objetivo;
   - confirmação de que não foi rejeitado somente por estar fora do MVP ou do Starter.
9. Pontos não validados ou lacunas documentais:
   - item;
   - evidência faltante;
   - forma de validação.
10. Validação:
   - confirmar que o catálogo foi concluído antes do início da análise do seguinte;
   - informar branch e draft PR ou justificar a ausência de alteração;
   - confirmar que nenhum ID desapareceu, foi renumerado ou reutilizado;
   - confirmar a busca por referências explícitas e implementação semântica antes de cada arquivamento;
   - confirmar aderência ao `README.md`;
   - confirmar que novidade, modernidade ou distância do MVP não determinaram isoladamente a decisão.
11. Fechamento consolidado da execução:
   - entregar um resumo curto do que foi feito, com catálogos analisados, alterações, draft PRs ou justificativas, bloqueios, lacunas e conclusão geral;
   - separar os updates novos ou materialmente ajustados entre dependentes de recorte e transversais ao projeto, indicando prioridade atual, relação com o caminho crítico, momento ou gatilho recomendado e fluxo competente para avaliação;
   - reapresentar todos os recursos transversais ainda ativos nos catálogos resultantes, mesmo quando não forem novos nem tiverem mudado na rodada, deixando de reapresentá-los somente depois que saírem do catálogo ativo conforme a regra do item 4.2;
   - informar, para cada pendência transversal, ID e título, estado atual, ação pendente, prioridade, motivo da permanência, momento ou gatilho recomendado, mudança desde a rodada anterior — registrando `permanece pendente, sem mudança de prioridade` quando nada tiver mudado — e critério de encerramento;
   - deixar explícito que a orientação de prioridade não autoriza implementação;
   - concluir explicitamente se existe implementação, configuração ou revisão operacional transversal recomendada para o momento atual, separando ação imediata ou temporal de capacidade ainda condicional;
- quando existir ação transversal recomendada agora, encerrar o relatório com um pedido direto e destacado de autorização para criar o próximo Debate na pasta `LP Factory/Debates` do Google Drive; não substituir esse pedido por convite genérico ao debate;
- informar no pedido o título proposto, o escopo, as prioridades, as dependências, a ordem sugerida, os critérios de conclusão, os riscos, os limites e os itens que não devem ser implementados;
- após autorização humana explícita, criar o Debate com a proposta e o plano das implementações, configurações ou revisões necessárias, podendo fazê-lo na mesma interação em que a autorização for concedida, e entregar o link para análise;
- quando nenhuma ação transversal for recomendada para o momento atual, declarar objetivamente que não há motivo para criar novo Debate;
- deixar explícito que a criação ou aprovação do Debate não autoriza implementação, alteração de plataforma, merge ou ampliação de escopo;
- encerrar também com até três melhorias observadas durante a própria execução.

## 6. Limites e parada

- Não alterar código, roadmap, Base Técnica, schema, configuração ou outro catálogo.
- Não transformar catalogação em implementação, mudança de stack, nova infraestrutura ou novo escopo do MVP.
- Não decidir aplicação final em plano-base, fase ou recorte; o Gestor de Updates recomenda horizonte e o Estrategista consolida no fluxo competente.
- Não criar catálogo, seção permanente ou controle paralelo de pendências transversais; os catálogos permanecem como fonte.
- Criar um Debate pontual sobre ações transversais somente após autorização humana explícita, conforme o item 5.11, sem tratá-lo como nova fonte do catálogo nem como autorização de implementação.
- Não adicionar item sem fonte oficial, valor concreto e compatibilidade com o `README.md`.
- Não realizar merge dos PRs.
- Quando faltar fonte obrigatória, houver conflito material ou faltar permissão, informar exatamente o bloqueio e parar.
