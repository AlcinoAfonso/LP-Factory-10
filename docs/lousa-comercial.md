0. Introdução

0.1. Cabeçalho

- Documento: Lousa Comercial — LP Factory 10
- Versão: v1.2
- Data: 12/08/2026
- Status: em construção; fluxo de publicação assistida validado parcialmente
- Escopo: registrar definições, configurações, implementações, aprendizados e tendências futuras da frente comercial e editorial do LP Factory 10.

0.2. Função do documento

Esta lousa é o registro evolutivo da frente comercial do LP Factory 10. Ela reúne o posicionamento inicial, a operação editorial, as configurações do Metricool, as validações realizadas e as oportunidades futuras relacionadas à aquisição, comunicação e conversão.

Ela não substitui os documentos técnicos do projeto. Quando uma decisão comercial gerar uma alteração técnica ou operacional no produto, a referência correspondente também deverá ser atualizada, especialmente `docs/automations.md`, `docs/services.md`, `docs/platform-config.md` ou `docs/roadmap.md`.

0.3. Fontes deste marco

- `README.md` — visão geral, proposta de valor, canais do produto e princípios do MVP.
- `docs/automations.md` — referência de automações e integrações operacionais.
- Discussões deste chat sobre autoridade, conteúdo, Instagram, Metricool e automação editorial.
- Telas de configuração e autorização enviadas em 11/08/2026.
- Resultado do teste controlado de mídia e agendamento realizado em 12/08/2026.

1. Plugin e conector Metricool

1.1. Identificação e estado confirmado

- Aplicativo conectado ao ChatGPT: `Metricool for Social Media`.
- Data da conexão com o ChatGPT: 11/08/2026.
- Marca Metricool identificada: `6708365`.
- Fuso horário observado na marca: `America/Sao_Paulo`.
- Instagram conectado: `a2afonso`.
- Tipo do Instagram: conta profissional.
- Escopo atual: somente o Instagram `a2afonso` foi conectado para o experimento inicial.
- Teste controlado de agendamento realizado em 12/08/2026, com uma imagem e legenda, para o Instagram `a2afonso`.
- O conector retornou a marca `a2afonso`, o `blog_id` `6708365` e o fuso `America/Sao_Paulo`.
- A criação do agendamento foi confirmada; a publicação efetiva no Instagram permanece pendente de verificação após o horário programado.

1.2. Capacidades expostas ou documentadas para o conector

- `Get analytics`: consultar métricas disponíveis para uma rede social.
- `Get analytics data by metrics`: consultar dados analíticos por métricas e intervalo de datas.
- `Get best time to post by network`: consultar melhores horários para publicação por rede.
- `Get brand settings`: consultar as configurações das marcas da conta Metricool.
- `Get scheduled posts`: consultar publicações planejadas em determinado intervalo.
- `Create scheduled post`: criar uma publicação agendada em uma ou mais redes por meio do Metricool.
- `Update scheduled post`: atualizar uma publicação já agendada.

1.3. Limites do que está confirmado

- A conexão do aplicativo com o ChatGPT e a vinculação do Instagram ao Metricool foram confirmadas pelas telas apresentadas.
- A criação de um agendamento com uma imagem foi confirmada em teste controlado, mediante aprovação explícita.
- A publicação efetiva no Instagram ainda não foi confirmada; o teste validou o agendamento e o recebimento da mídia pelo Metricool.
- O suporte efetivo a carrosséis pelo fluxo conectado ao ChatGPT ainda depende de teste.
- A leitura ou resposta de mensagens diretas, a moderação de comentários e a operação da Inbox do Instagram não devem ser tratadas como disponíveis no ChatGPT sem confirmação específica do conector.
- A autorização técnica do aplicativo não equivale à autorização comercial para publicar conteúdo.

1.4. Fluxo comercial pretendido

- Criar o conteúdo no ChatGPT.
- Revisar texto, imagens, ordem dos cards, legenda, perfil, data e horário.
- Garantir que cada mídia esteja disponível em uma URL HTTPS pública antes de solicitar o agendamento.
- Solicitar explicitamente a criação ou atualização do agendamento no Metricool.
- Validar o conteúdo agendado antes da publicação.
- Deixar o Metricool executar a publicação agendada, quando o fluxo estiver confirmado e aprovado.
- Consultar os resultados e usar os dados para melhorar os conteúdos seguintes.

1.5. Regra de aprovação

- Nenhum conteúdo deve ser criado ou editado no Metricool, agendado ou publicado sem aprovação explícita do responsável.
- A aprovação deve identificar, no mínimo, perfil, conteúdo, formato, data e horário.
- Para a primeira publicação, a aprovação deve ser específica para o teste e não autoriza conteúdos futuros.
- A configuração de permissões de baixo risco do ChatGPT não substitui essa regra humana.


1.6. Aprendizado operacional confirmado — teste de 12/08/2026

- A imagem criada no ChatGPT foi colocada na branch pública `social-media-assets`, usando o path `media/comercial/lp-factory/instagram/2026/08/2026-08-12-teste-integracao-metricool/v01/teste-integracao-lp-factory-metricool.jpg`.
- O PNG original foi convertido para JPEG de alta qualidade para reduzir o tamanho da transferência, preservando a mesma arte visual.
- A URL foi fixada no SHA do commit, respondeu com HTTP 200 e entregou `content-type: image/jpeg`.
- O Metricool aceitou a URL pública, baixou a mídia e retornou uma cópia hospedada em seu próprio domínio de mídia.
- A primeira chamada sem legenda falhou porque o conector exigiu o campo `text`, mesmo para uma publicação com uma única imagem.
- A segunda chamada, com a legenda `Teste de integração LP Factory 10 × Metricool.`, foi aceita.
- Uma tentativa com horário já passado falhou; o agendamento só foi aceito quando a data e o horário estavam no futuro, no fuso `America/Sao_Paulo`.
- Resultado confirmado: publicação ID `361407986`, Instagram `a2afonso`, horário `12/08/2026 17:30`, status `Pending`, `autoPublish: true` e uma mídia anexada.
- Conclusão: o fluxo ChatGPT Work → URL pública do asset → Metricool → agendamento funciona para uma publicação simples com uma imagem.
- A publicação efetiva no Instagram e o suporte a carrossel ainda precisam de confirmação separada.
- A branch pública do GitHub deve ser tratada como ponte para assets públicos do próprio LP Factory, não como armazenamento definitivo de imagens privadas ou multi-tenant de clientes.

2. Configurações

2.1. Permissão do aplicativo no ChatGPT

- Configuração observada em 11/08/2026: `Permitir ações de baixo risco`, marcada como padrão.
- Ações classificadas como de baixo risco podem ser aprovadas automaticamente; outras ações podem exigir confirmação.
- Para testes de escrita ou operação em produção, considerar `Perguntar sempre` como configuração mais segura, caso o volume de confirmações seja aceitável.
- A regra comercial de aprovação explícita permanece válida independentemente da configuração automática de permissões.

2.2. Escopo da autorização

- A autorização do Metricool foi concedida ao ChatGPT em 11/08/2026.
- A autorização deve ser considerada ampla no nível da conta Metricool, conforme a tela apresentada durante a conexão.
- O Metricool deve manter conectados somente os perfis, marcas e redes necessários ao experimento comercial atual.
- Outras marcas, redes, contas de anúncios, Google Business Profile, Canva ou Google Drive não devem ser conectados sem necessidade definida.

2.3. Configuração do Instagram

- Perfil utilizado: `a2afonso`.
- Tipo: conta profissional.
- Permissões iniciais pretendidas: visualizar perfil e mídia, publicar conteúdo e acessar insights.
- Comentários e mensagens diretas não fazem parte do escopo inicial da operação.
- Facebook, TikTok, X, YouTube e outras redes não fazem parte do escopo inicial confirmado.
- O plano atual do Metricool e seus limites operacionais ainda devem ser confirmados na conta.

2.4. Checklist operacional inicial

- Executar no ChatGPT um comando somente de leitura para listar marcas e perfis conectados.
- Confirmar que o Instagram `a2afonso` aparece no retorno do conector.
- Confirmar que não há outros perfis dentro do escopo do teste.
- Preparar um conteúdo simples para teste de criação de agendamento.
- Solicitar aprovação explícita antes de criar o agendamento.
- Validar o conteúdo agendado e, depois, a publicação efetiva no Instagram.
- Registrar qualquer erro, limitação ou capacidade adicional descoberta.

3. Operação comercial e editorial

3.1. Objetivo inicial

- Construir autoridade antes de fazer uma oferta comercial direta.
- Validar mensagens, temas e formatos com uma audiência inicial pequena.
- Usar o próprio perfil como laboratório público de aprendizado.
- Evitar campanha agressiva ou promessa de funcionalidades ainda não implementadas.

3.2. Posicionamento inicial

- Tema de autoridade: IA aplicada à comunicação comercial de pequenos negócios.
- Temas associados: comunicação, clareza de oferta, WhatsApp e conversão.
- Apresentação progressiva do LP Factory 10 como uma solução em construção.
- Introdução gradual de landing pages por expressões como `páginas de conversão`, mantendo `landing pages` como termo conhecido quando necessário.
- Mensagem de referência: ajudar pequenos negócios a transformar atenção em conversas e conversas em vendas, usando comunicação mais clara, WhatsApp e IA.

3.3. Pilares de conteúdo

- Comunicação comercial, oferta e conversão: aproximadamente 50%.
- WhatsApp e relacionamento comercial: aproximadamente 25%.
- IA aplicada de forma prática: aproximadamente 15%.
- Bastidores da construção e validação do LP Factory 10: aproximadamente 10%.

3.4. Formatos iniciais

- Dois carrosséis por semana como formato principal de educação e análise.
- Um Reel simples por semana desde o início, sem exigir produção sofisticada.
- Um post estático a cada 10 ou 15 dias para apresentação, opinião, bastidor ou marco.
- Stories para bastidores, perguntas, testes de interesse e comentários sobre assuntos relevantes.

3.5. Funil inicial

- Conteúdo útil.
- Conversa no Direct ou no WhatsApp.
- Validação da necessidade.
- Piloto ou experimento.
- Primeira evidência ou case.
- Oferta clara somente quando houver base suficiente.

4. Tendências e oportunidades futuras

4.1. Automação editorial

- Evoluir para o fluxo: ideia → conteúdo → revisão humana → aprovação → agendamento → publicação → métricas → aprendizado.
- Usar os melhores horários e os dados de desempenho como apoio à decisão, sem substituir a revisão humana.
- Avaliar uma rotina editorial recorrente somente depois de validar o fluxo assistido.

4.2. Expansão de perfis e marcas

- Avaliar futuramente a operação de mais de uma marca no Metricool.
- Possíveis marcas futuras: LP Factory 10, perfil pessoal do responsável, parceria imobiliária ou clientes-piloto.
- Cada nova marca deve ter objetivo, autorização, escopo de acesso e regra de aprovação próprios.

4.3. Evolução da comunicação do produto

- Introduzir progressivamente a categoria de comunicação comercial inteligente por nicho.
- Demonstrar páginas de conversão quando houver exemplos reais e avaliáveis.
- Conectar Instagram, WhatsApp e páginas de conversão como partes de um mesmo percurso comercial.
- Apresentar o LP Factory 10 como consequência prática dos problemas estudados e testados, não como promessa genérica de tecnologia.

4.4. Condicionais e pendências

- [Concluído] Confirmar o retorno do Instagram no teste de leitura do conector.
- [Concluído] Confirmar criação de agendamento sem publicação imediata.
- Confirmar publicação efetiva no Instagram por meio do Metricool.
- Confirmar suporte a carrosséis no fluxo conectado ao ChatGPT.
- Confirmar se publicação imediata, comentários, mensagens diretas e Inbox estão expostos pelo conector.
- Definir calendário editorial após o primeiro teste de conteúdo.
- Definir métricas mínimas de autoridade, conversa e conversão.
- Registrar nesta lousa novas decisões, implementações e tendências discutidas nesta frente.
