01/07/2026 — Lousa debate landing pages
Fontes: chat, docs/roadmap.md, docs/schema.md, Supabase real

1. Objetivo da lousa

Registrar o entendimento gradual sobre como landing pages devem ser formadas no LP Factory 10.

A lousa serve para separar conceitos antes de decidir implementação:

* template
* família de template
* módulos/seções
* composição
* itens estruturais
* regras por seção
* design
* artefato final
* futura edição pelo cliente/admin

Esta lousa não implementa nada e não altera o roadmap.

2. Premissa inicial

A landing page é o core do produto.

A estrutura precisa permitir variação real entre nichos, sem criar um template novo para cada nicho.

Exemplo:

* alguns nichos podem precisar de 8 seções
* outros nichos podem precisar de 10 ou mais seções
* alguns nichos podem exigir seções específicas
* outros nichos podem dispensar essas seções

Portanto, não é correto tratar o template de landing page como uma página fixa com quantidade e ordem imutável de seções.

3. Papel do template

Template não é a landing page pronta.

Template também não deve ser reduzido apenas a espaçamento, largura ou tracking.

O papel do template é definir a base técnica e estrutural permitida para um tipo de entrega.

O template pode definir:

* família/canal atendido
* renderer ou motor visual compatível
* contrato técnico da página
* módulos compatíveis
* limites visuais e responsivos
* versionamento da estrutura
* validações mínimas de publicação
* rastreabilidade da estrutura usada

O template não deve decidir sozinho:

* quantas seções cada nicho terá
* qual ordem final das seções
* quais seções serão obrigatórias em cada nicho
* qual copy será usada em cada seção
* quais seções o cliente poderá remover ou adicionar

4. Famílias de template

Família de template agrupa templates do mesmo tipo de entrega ou canal.

Famílias atuais/possíveis:

* commercial_activation
* landing_page
* email
* whatsapp
* instagram
* tiktok

Para o MVP, pode existir uma base inicial por família.

A arquitetura conceitual não deve afirmar que cada família terá para sempre apenas um template.

Uma família pode evoluir para vários templates quando houver necessidade real.

Exemplo futuro em landing_page:

* landing_page_default
* landing_page_bofu
* landing_page_lead_capture
* landing_page_service
* landing_page_product
* landing_page_event

5. Situação atual do banco

No banco atual, content_templates guarda tanto templates de página quanto módulos/seções.

content_templates usa:

* template_family
* template_scope
* template_key
* version
* status
* is_active
* payload_json

No estado atual, há registros da família commercial_activation:

* 1 template de página
* 8 módulos/seções

Os módulos/seções atuais de commercial_activation são:

* hero
* benefits
* services
* plans
* differentials
* how_it_works
* faq
* final_cta

A família landing_page ainda não deve ser considerada resolvida por esse recorte.

6. Módulos e seções

Para entendimento estratégico, módulo e seção podem ser tratados como conceitos próximos.

A distinção útil é:

* módulo = peça reutilizável disponível no sistema
* seção = uso concreto desse módulo dentro de uma página

Exemplo:

* hero é um módulo disponível
* a Hero da LP de harmonização facial é uma seção concreta

Módulos/seções são as peças usadas para montar landing pages.

Exemplos possíveis:

* Hero
* Problema
* Benefícios
* Procedimentos
* Serviços
* Oferta
* Planos
* Prova social
* Antes e depois
* Autoridade
* Segurança
* Processo
* FAQ
* CTA final
* Localização
* Formulário

7. Composição

Composição é a camada que organiza a página concreta.

Ela deve definir:

* quais módulos entram
* em qual ordem
* quais são obrigatórios
* quais são opcionais
* qual variante de cada módulo será usada
* qual contexto ou nicho está sendo atendido

No banco atual, isso corresponde principalmente a:

* content_template_compositions
* content_template_composition_items

A composição é o lugar mais adequado para responder perguntas como:

* quais seções entram na LP de harmonização facial?
* em que ordem elas aparecem?
* quais seções são obrigatórias?
* quais seções podem ser removidas?
* qual variante de Hero será usada?
* qual variante de prova social será usada?

8. Exemplo conceitual de composição por nicho

Harmonização facial poderia ter uma composição inicial com:

* Hero
* Problema/desejo
* Benefícios
* Procedimentos
* Antes e depois
* Segurança
* Prova social
* FAQ
* CTA WhatsApp

Advogado trabalhista poderia ter outra composição inicial com:

* Hero
* Situações atendidas
* Direitos do trabalhador
* Como funciona
* Autoridade
* FAQ
* CTA

Isso mostra que o template não deve impor a mesma sequência para todos os nichos.

O template permite possibilidades controladas.

A composição escolhe a montagem concreta.

9. Itens estruturais

Itens estruturais são a base estratégica usada para definir copy, argumento, seção e possivelmente design.

Exemplos de itens estruturais:

* dores
* desejos
* desejos ocultos
* objeções
* riscos percebidos
* mecanismos de solução
* provas disponíveis
* diferenciais
* critérios de decisão
* urgências
* perguntas frequentes
* barreiras de conversão
* linguagem do público
* nível de consciência
* sofisticação do mercado

Esses itens devem alimentar a geração e revisão das seções.

10. Regras por seção

Cada seção deve ter regras próprias sobre quais itens estruturais pode ou deve usar.

Exemplo conceitual:

Hero title pode usar:

* dor principal
* desejo principal
* desejo oculto
* transformação central

Hero subtitle pode usar:

* título
* público
* mecanismo
* objeção principal
* contexto de decisão

FAQ pode usar:

* objeções
* riscos percebidos
* dúvidas práticas
* barreiras de compra

Prova social pode usar:

* provas disponíveis
* autoridade
* diferenciais verificáveis
* redução de risco

CTA final pode usar:

* desejo principal
* urgência legítima
* próximo passo claro
* canal de conversão

Essa camada ainda precisa ser melhor definida antes de virar implementação.

11. Qualidade da copy

A qualidade da copy não deve depender apenas de um prompt genérico.

O sistema precisa saber:

* qual seção está sendo escrita
* qual campo está sendo escrito
* quais itens estruturais alimentam esse campo
* quais limites editoriais aplicar
* quais exageros evitar
* quais critérios tornam a copy publicável

Exemplo:

O título da Hero não deve nascer de todos os dados disponíveis.

Ele deve nascer de um subconjunto estratégico adequado ao campo.

12. Limites editoriais

Limites editoriais devem ser avaliados antes de virar regra definitiva.

Hipótese inicial:

* Hero title: curto, direto e assertivo
* Hero subtitle: complementar ao título
* títulos de seção: objetivos e escaneáveis
* cards: título curto e descrição clara
* FAQ: pergunta direta e resposta curta

Não definir ainda limites universais fechados.

Possíveis parâmetros futuros:

* mínimo e máximo de caracteres
* quantidade máxima de linhas
* tom permitido
* nível de promessa
* palavras proibidas
* exigência de prova
* clareza do CTA
* aderência ao público

Esses parâmetros podem precisar ser configuráveis no Admin Dashboard.

13. Design da landing page

O design não deve ser definido apenas pelo template.

O design deve nascer da combinação de:

* design system global
* template de página
* variante do módulo
* composição
* características do nicho
* itens estruturais
* configuração visual permitida

Exemplo:

Harmonização facial pode exigir uma apresentação mais visual, leve, estética e premium.

Advogado trabalhista pode exigir uma apresentação mais sóbria, direta e baseada em confiança.

Isso não obriga um template novo por nicho.

Pode ser:

* mesmo template-base
* composição diferente
* variantes diferentes
* configuração visual diferente
* conteúdo diferente

14. Cliente/admin alterando a página

A ideia futura é que o sistema gere uma composição default por nicho/contexto.

Depois, cliente ou admin poderia ajustar dentro de limites seguros:

* remover seção
* adicionar seção compatível
* alterar ordem
* trocar variante
* editar copy
* ajustar configuração visual permitida

Isso se aproxima do LP Builder e não deve ser antecipado dentro da E18 sem recorte próprio.

15. Artefato final

Artefato final é a landing page gerada, revisada ou publicada.

Ele deve preservar:

* template usado
* composição usada
* taxon/nicho
* conteúdo final
* versão do template
* versão da composição
* versão da pesquisa
* fontes estruturais usadas
* status do conteúdo

No banco atual, essa camada corresponde principalmente a:

* content_artifacts
* content_artifact_research_sources

16. Lógica resumida

Template = base técnica e possibilidades controladas.

Módulos/seções = peças disponíveis.

Composição = montagem concreta por nicho/contexto.

Itens estruturais = inteligência estratégica que alimenta copy, argumentos e design.

Regras por seção = contrato que diz como cada seção deve usar os itens estruturais.

Artefato final = landing page pronta/publicada com conteúdo, versões e fontes.

17. Ponto ainda não resolvido

Ainda falta definir uma camada clara para governança editorial e estratégica por seção.

Perguntas abertas:

* onde ficam as regras por seção?
* essas regras pertencem ao template, à composição, a uma tabela própria ou a configuração administrativa?
* como mapear itens estruturais para cada campo?
* como validar copy antes de publicar?
* quais parâmetros o Admin Dashboard poderá alterar?
* como evitar que isso vire overengineering?
* em que momento isso se conecta ao LP Builder?

18. Direção provisória

Não transformar E18 em arquitetura multicanal completa.

Não puxar LP Builder para dentro da E18.

Não decidir schema novo ainda.

Usar esta lousa para consolidar entendimento antes de criar plano-base.

A próxima etapa deve ser continuar debatendo a formação das landing pages e só depois transformar em plano técnico.

19. Módulos, variantes e seções

Entendimento aprovado nesta etapa:

A solução recomendada para variações como Hero com imagem, Hero com formulário ou Hero centralizada é usar módulo semântico + variante + slots/configuração.

Não criar uma família para cada módulo neste momento.

Não tratar variações como herança rígida pai/filho.

O módulo define a função semântica da seção.

Exemplos:

* hero
* benefits
* faq
* final_cta

A variante define a forma estrutural do módulo.

Exemplos:

* hero.with_image
* hero.with_form
* hero.centered
* hero.with_video

Slots/configuração completam a seção.

Exemplo conceitual de hero.with_image:

* title
* subtitle
* proof_line
* primary_cta
* secondary_cta
* image

Exemplo conceitual de hero.with_form:

* title
* subtitle
* proof_line
* form
* privacy_note
* submit_label

A composição escolhe qual variante será usada em cada nicho ou contexto.

Exemplo:

* harmonização facial pode usar hero.with_image
* captação direta de orçamento pode usar hero.with_form
* página institucional simples pode usar hero.centered

Essa lógica já é compatível com a estrutura atual do projeto, porque content_template_composition_items já possui:

* module_template_id
* variant_key
* sort_order
* is_required
* config_json

Leitura prática:

* module_template_id identifica o módulo usado
* variant_key identifica a variante escolhida
* sort_order define a posição da seção
* is_required define obrigatoriedade
* config_json permite ajustes controlados

Portanto, para landing pages, a direção provisória é:

módulo base → variante → slots/configuração → composição → seção final

Essa decisão não exige criar schema novo agora.

A próxima dúvida a resolver é onde ficam os contratos de slots, regras editoriais e critérios de compatibilidade entre nicho, módulo e variante.
