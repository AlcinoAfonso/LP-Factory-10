0. Introdução
0.1. Cabeçalho
• Documento: README — LP Factory 10 (MVP)
• Versão: 13 — 26/11/2026
• Data: 26/11/2026
• Escopo: visão geral do produto + documentos de referência + pendências estratégicas

1. Visão geral do produto
1.1. Classificação do negócio
• Segmento: Marketing digital.
• Nicho: serviços de comunicação comercial com IA, orientados a resultados.
• Ultranicho: não usar agora.

1.2. Descrição
• LP Factory 10 é um hub de serviços de comunicação comercial com IA, orientado a entregar resultados sem exigir que o cliente domine ferramentas, APIs, integrações ou IA.
• A Base de Comunicação pertence à conta, é editável e evolutiva; os serviços consultam seu conteúdo pertinente sem governá-la nem exigir sincronização permanente.
• Os serviços podem incluir landing pages, WhatsApp, Instagram, TikTok, Google Meu Negócio e e-mail, conforme validação comercial e operacional.
• A LP Factory pode configurar e operar a tecnologia necessária para cada serviço; o software apoia essa entrega e não é, por si só, o produto vendido.

1.3. Proposta de valor
• Transformar informações essenciais do negócio em uma Base de Comunicação reutilizável e consistente.
• Entregar serviços de comunicação com IA sem transferir ao cliente a complexidade técnica necessária para operá-los.
• Reutilizar a mesma base entre canais e serviços, reduzindo repetição, divergência e esforço operacional.
• Evoluir o catálogo a partir de demanda real, resultado observado e capacidade de entrega simples e sustentável.

1.4. Produto
1.4.1. Prático
• A Base aproveita informações confirmadas e permite ao cliente organizar e aperfeiçoar o conhecimento do negócio progressivamente, com assistência de IA quando útil.
• Serviços productizados: personalizar comunicação e conteúdo sem reinventar a solução técnica para cada cliente.

1.4.2. Inteligente
• IA é meio de entrega e deve ser usada quando trouxer benefício concreto em qualidade, velocidade, custo ou resultado.
• Automação deve surgir principalmente sobre operações já validadas e repetidas, não para antecipar necessidades futuras.

1.4.3. Dashboard
• Suporte somente à operação, acompanhamento e controles necessários para entregar e evoluir os serviços.

1.4.4. Princípios de implementação
• O MVP prioriza simplicidade, não fragilidade.
• A menor solução segura capaz de entregar o resultado atual deve prevalecer sobre arquitetura mais sofisticada.
• Não criar banco, rota, job, agente, automação, engine, service ou nova infraestrutura para uma necessidade futura, hipotética ou ainda não validada.
• Nova camada técnica exige necessidade atual comprovada, benefício proporcional e ausência de alternativa mais simples já disponível.
• Implementação que se torne desproporcional ao valor esperado pode ser interrompida, simplificada ou removida em vez de receber novas camadas para preservá-la.
• Complexidade existente não ganha direito de permanência pelo esforço já investido; capacidades funcionais só são reduzidas ou removidas por decisão humana explícita.
• O fluxo preferencial é: vender ou validar o serviço → executar da forma mais simples segura → automatizar o que se repetir → productizar o que demonstrar valor.
• Enquanto não houver clientes comerciais, as contas atuais e seus dados de negócio são testes descartáveis: não exigir backfill nem compatibilidade retroativa apenas para preservá-los; quando necessário ao recorte aprovado, podem ser reiniciados ou recriados. Migrations obrigatórias, segurança e preservação funcional permanecem vigentes; reavaliar antes da primeira conta comercial.
• Runtime não pode depender de objetos ou comportamentos de banco ainda não aplicados e validados no ambiente alvo.
• A stack base do MVP permanece Next.js, Supabase e TypeScript.
• Regras verificáveis, segurança, fatos, estado e contratos permanecem determinísticos quando possível; IA preserva flexibilidade controlada onde a natureza do resultado for semântica, criativa ou persuasiva.
• Avaliação, radar tecnológico, catalogação ou possibilidade de comercialização independente de agentes não autorizam implementação, mudança de stack, nova infraestrutura nem ampliação de escopo.

1.5. Modelo de oferta e cobrança
• A LP Factory vende serviços de comunicação comercial; agentes e software são meios de produção, não o produto principal.
• O MVP cobra uma mensalidade recorrente por conta com saldo comum de créditos para os serviços e ações de valor disponibilizados, sem divisão por Starter, Lite, Pro ou Ultra.
• Créditos representam ações de valor, não tokens, chamadas, retries, workloads ou custo do provedor; sua calibração considera valor, custo total da entrega, frequência e evidência real.
• Cada serviço mantém escopo, entrega e limites claros; o saldo transversal evita planos ou regras próprias por serviço sem necessidade comprovada.
• Starter, Lite, Pro e Ultra tornam-se modelo comercial legado. Sua retirada exige recorte próprio e preservação ou substituição comprovada das capacidades necessárias de contratação, autorização, acesso e histórico.
• Outcome-as-a-Service permanece evolução possível somente com resultado mensurável e atribuição confiável.

2. Documentos de referência
• docs/base-tecnica.md — regras técnicas de runtime, implementação segura, arquitetura, adapters, imports, SSR, observability e anti-regressão.
• docs/platform-config.md — configurações operacionais de plataformas, variáveis, secrets por nome, endpoints, URLs, redirects, SMTP, DNS e regras de redeploy.
• docs/schema.md — contrato de banco: tabelas, colunas, constraints, views, RPCs/functions, triggers, RLS, policies e grants.
• docs/roadmap.md — estado final dos casos E*, status, escopo, dependências, artefatos e pendências do produto.
• docs/design-system.md — padrões visuais, componentes UI, tokens, superfícies visuais e regras de uso do design system.
• docs/services.md — catálogo humano dos services implantáveis, MCPs, endpoints e infraestrutura reutilizável com identidade própria.
• docs/automations.md — camada de automações operacionais, integrações, componentes consumidores, credenciais por nome e aprendizados operacionais sem expor segredos.

3. Pendências estratégicas (em aberto)
3.1. Definições do MVP
• Serviços iniciais • Limites da operação gerenciada • Calibração de créditos, preço e margem

3.2. Padrões de entrega
• Definir entregável e critério de aceite dos serviços prioritários.
