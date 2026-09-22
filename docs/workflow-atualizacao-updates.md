22/07/2026 — Workflow de Atualização dos Catálogos de Updates
Atualizado em 22/09/2026

Fontes: chat, repositório e documentos indicados nos itens 2 e 3

Referência de estrutura: `docs/template-prompts.md`, com abordagem outcome-first

## 1. Resultado esperado e papel

### 1.1. Resultado esperado

Ao final de uma única execução:

- os quatro catálogos foram analisados na ordem do item 2 e a cobertura OpenAI foi concluída na quinta etapa, sem criar novo catálogo;
- cada alvo foi concluído da leitura ao relatório e ao draft PR ou à justificativa antes do início da análise do seguinte, sem processamento em lote ou paralelo;
- a execução usa um único identificador `updates-AAAA-MM-DD-rNN`, presente nas branches e nos títulos dos draft PRs da rodada, sempre acompanhado pelo alvo que distingue cada PR;
- cada draft PR da rodada mantém no corpo o marcador durável `<!-- updates-round:v1 id=<identificador> state=<open|completed> base=<sha-inicial> -->`; somente `state=open` identifica rodada interrompida e retomável, enquanto `state=completed` impede sua reutilização mesmo que os drafts permaneçam abertos;
- quando a rodada completa não produzir nenhum draft PR, seu identificador é reservado por um tag anotado remoto `<identificador>-completed`, apontado para o SHA inicial e contendo estado, base, escopo, horário UTC e referência do relatório final, sem criar diff artificial;
- drafts abertos de rodadas anteriores e do mesmo identificador foram detectados antes de qualquer publicação, e nenhum segundo draft foi criado para o mesmo alvo e rodada;
- cada ajuste real está em branch própria criada do mesmo SHA inicial de `main`, alterando somente o documento-alvo e sem mudança artificial quando não houver delta;
- todos os IDs publicados continuam localizáveis no catálogo, sem renumeração, reutilização ou desaparecimento físico;
- todo transversal ativo informa estado, ação pendente, prioridade, motivo da permanência, gatilho e critério de encerramento;
- itens integralmente implementados e validados deixam a parte ativa e permanecem somente no histórico compacto; itens parciais permanecem ativos apenas pelo saldo;
- nenhuma recomendação transversal ultrapassa zero custo incremental nos planos vigentes; gratuidade não comprovada, upgrade ou cobrança adicional mantêm o recurso no radar;
- ausências de ajuste, bloqueios e exceções foram registradas;
- existe um relatório final curto que consolida o que foi feito, orienta a prioridade dos updates, reapresenta os recursos transversais ainda ativos e, quando houver ação transversal recomendada para o momento atual, pede autorização direta para criar o próximo Debate em `LP Factory/Debates`;
- nenhum PR foi mergeado nem a catalogação transformada em implementação.

### 1.2. Papel

- Manter os catálogos de updates atuais, úteis, rastreáveis e baseados em fontes oficiais, sem aprovação humana intermediária entre eles.

## 2. Alvos e ordem

1. `docs/supa-up.md`
2. `docs/vercel-up.md`
3. `docs/github-up.md`
4. `docs/prod-up.md`
5. `docs/openai-model-snapshot.md`

Os quatro primeiros alvos são os catálogos obrigatórios. O quinto é a fotografia técnica OpenAI existente e não constitui catálogo novo. Os demais catálogos podem ser consultados para detectar duplicações, absorções e referências cruzadas. Isso não inicia sua análise completa.

## 3. Fontes

Consultar, para o catálogo em execução:

- o `README.md`, como política geral de avaliação tecnológica e fonte dos pilares e canais estratégicos;
- o documento-alvo no SHA inicial;
- `docs/roadmap.md`, Base Técnica, schema, configurações de plataforma, matrizes e lousas relacionadas;
- código, migrations, testes, workflows, dependências e histórico de PRs ou commits quando necessários para confirmar implementação;
- os relatórios e diffs dos catálogos anteriores já concluídos nesta execução;
- fontes oficiais externas correspondentes.

Para Supabase, usar documentação, changelog e blog oficiais; `supa#60` confirma a consulta manual dessas fontes e não autoriza consumidor RSS ou Markdown. Para Vercel, usar fontes oficiais da Vercel, Next.js e React. Para GitHub e produto, seguir as fontes prioritárias definidas nos próprios catálogos.

Para OpenAI, usar a documentação oficial atual e as fontes oficiais já rastreadas no snapshot. Pesquisar modelos, reasoning efforts, limites técnicos, APIs, tools, recursos agentic, aplicabilidade e maturidade. Não registrar preços, fórmulas, gráfico, protocolo financeiro ou laboratório de custo no snapshot. A descoberta oficial ampla pertence a este workflow; o Gestor de Automações recebe as capacidades identificadas e faz somente a validação factual focal necessária ao caso concreto.

Para cada pilar ou canal declarado estratégico no `README.md`, pesquisar explicitamente as fontes oficiais aplicáveis e registrar também quando não houver novidade relevante. O WhatsApp deve ser coberto por fontes oficiais da WhatsApp Business Platform ou Meta Business Messaging.

Fontes secundárias podem apoiar, mas não substituir a fonte oficial.

## 4. Execução

1. Preparar a rodada:
   - congelar o SHA inicial de `main` e confirmar o `README.md` e os cinco alvos;
   - definir o prefixo `updates-AAAA-MM-DD` com a data da execução, listar em todos os estados os PRs e as referências remotas que contenham esse prefixo e extrair os números de rodada já usados;
   - antes de alocar novo número, ler o marcador durável no corpo de todos os PRs encontrados e identificar se existe exatamente uma rodada com `state=open` compatível com o mesmo SHA inicial e escopo; quando existir, reutilizar seu identificador e continuar seus drafts; `state=completed` nunca é retomável, e marcador ausente, malformado ou divergente entre PRs da mesma rodada constitui conflito a registrar sem criar nova rodada;
   - somente quando não houver rodada aberta compatível, definir `updates-AAAA-MM-DD-rNN` com o primeiro `NN` de dois dígitos ainda não usado naquela data, incluindo rodadas fechadas, mergeadas ou reservadas por tag `<identificador>-completed`;
   - listar draft PRs abertos cujas branches ou títulos contenham um identificador `updates-AAAA-MM-DD-rNN`, registrar os pertencentes a rodadas anteriores e detectar os do identificador atual;
   - para o mesmo alvo e identificador, continuar o draft existente quando ele corresponder ao mesmo SHA inicial e escopo e seu marcador estiver em `state=open`; diante de divergência de base, escopo, autoria ou estado, registrar o conflito e não criar duplicata.
2. Para cada um dos quatro catálogos, na ordem do item 2, concluir todo o ciclo antes de iniciar a análise do seguinte:
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
   - para todo item transversal ativo, registrar estado atual, ação pendente, prioridade, motivo da permanência, gatilho e critério de encerramento;
   - antes de recomendar implementação transversal, confirmar que ela tem zero custo incremental nos planos vigentes; se exigir upgrade ou cobrança adicional, ou se a gratuidade não estiver validada, manter o recurso atualizado no radar e não recomendar implementação;
   - nunca apagar um ID publicado; quando o item sair do catálogo ativo, manter registro histórico compacto com título original, estado final, evidências, recortes e eventual substituto;
   - manter item parcialmente implementado no catálogo ativo, com os recortes aplicados e o escopo ainda não implementado;
   - retirar item do catálogo ativo somente após implementação integral e validação, rejeição formal ou superação comprovada, preservando o ID em registro histórico compacto com a evidência e as referências competentes;
   - manter item com uso real sem registro no documento técnico competente como lacuna documental;
   - adicionar somente recurso compatível com o `README.md`, com fonte oficial, valor concreto e horizonte plausível; recurso futuro ou condicional pode entrar sem autorizar implementação;
   - não rejeitar nem arquivar um recurso somente por estar fora do Starter ou do MVP atual;
   - arquivar como incompatível, duplicado, absorvido, deprecado, superado, sem valor concreto ou com custo ou risco desproporcional somente com evidência e preservação do registro;
   - classificar como não validado quando faltar fonte oficial ou evidência suficiente;
   - produzir o relatório obrigatório;
   - quando houver ajuste, usar branch `docs/<identificador>-<alvo>` criada do SHA inicial, alterar somente o documento-alvo, validar o diff e abrir draft PR cujo título comece por `[<identificador>][<alvo>]` e cujo corpo contenha o marcador durável da rodada em `state=open`;
   - quando não houver ajuste, registrar a justificativa sem criar alteração artificial;
   - confirmar documento, IDs, referências, resultado do diff e URL do PR ou justificativa antes de seguir.
3. Seguir automaticamente ao próximo catálogo, sem aguardar aprovação ou merge.
4. Concluir a cobertura OpenAI depois dos quatro catálogos:
   - ler o snapshot vigente no SHA inicial e as fontes oficiais aplicáveis;
   - confrontar capacidades identificadas com o repositório e as decisões vigentes somente quando isso for necessário para classificar aplicabilidade e maturidade;
   - manter registros itemizados e rastreáveis de modelos, reasoning efforts, limites técnicos, APIs, tools, recursos agentic, aplicabilidade, maturidade, fontes e data da fotografia;
   - não registrar conteúdo financeiro nem converter disponibilidade, novidade ou capacidade em autorização de adoção;
   - quando houver mudança técnica material, usar branch `docs/<identificador>-openai`, alterar somente `docs/openai-model-snapshot.md`, validar o diff e abrir draft PR cujo título comece por `[<identificador>][openai]` e cujo corpo contenha o marcador durável da rodada em `state=open`;
   - quando não houver mudança material, registrar a justificativa sem atualizar data, regravar o snapshot ou criar PR artificial.
5. Ao final, conferir a sequência executada, o identificador, a base comum, os arquivos alterados, a cobertura dos canais estratégicos e OpenAI, os IDs, os drafts anteriores detectados e o estado dos PRs. Depois da auditoria e da produção do relatório final:
   - quando houver draft PR, substituir o marcador de todos os drafts da rodada por `state=completed`, preservando identificador, base e restante do corpo, acrescentar a mesma referência de conclusão e o mesmo horário UTC em todos eles e reler os corpos publicados;
   - quando nenhum draft PR tiver sido criado, confirmar que `<identificador>-completed` ainda não existe, criar um tag anotado com esse nome apontado exatamente para o SHA inicial, registrar na mensagem `updates-round:v1`, `id`, `state=completed`, `base`, `scope`, `completed_at` em UTC e `report`, publicar somente esse tag e relê-lo no remoto;
   - se qualquer PR permanecer em `state=open`, tiver marcador ausente ou divergir dos demais, ou se o tag esperado estiver ausente ou apontar para outro SHA, informar o conflito e não declarar execução integralmente aderente.

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
   - confirmar o gate de zero custo incremental para cada recomendação transversal.
11. Fechamento consolidado da execução:
   - informar o identificador da rodada e o SHA inicial comum;
   - informar o estado final persistido da rodada, o horário UTC e a referência de conclusão gravados nos corpos de todos os draft PRs ou, quando nenhum draft existir, no tag anotado remoto `<identificador>-completed`;
   - listar drafts anteriores detectados e confirmar que não foi criado segundo draft para o mesmo alvo e rodada;
   - entregar um resumo curto do que foi feito, com catálogos analisados, alterações, draft PRs ou justificativas, bloqueios, lacunas e conclusão geral;
   - resumir a cobertura OpenAI, as fontes oficiais consultadas, as capacidades técnicas alteradas ou a justificativa de ausência de delta no snapshot;
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
- Não criar catálogo OpenAI, consumidor de RSS/Markdown, controle paralelo, documento financeiro substituto ou segunda varredura ampla pelo Gestor de Automações.
- Não recomendar implementação transversal com custo incremental, gratuidade não validada, upgrade ou cobrança adicional; manter esses recursos somente no radar competente.
- Não realizar merge dos PRs.
- Quando faltar fonte obrigatória, houver conflito material ou faltar permissão, informar exatamente o bloqueio e parar.
