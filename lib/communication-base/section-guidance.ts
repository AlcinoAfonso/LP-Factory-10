// Initial literals approved in Debate 14D, Rodada 3. Lookup uses stable section identity,
// independently of catalog labels/order and customer content. No client data is written.
const sectionGuidance: Readonly<Record<string, Readonly<{ description: string; help: string }>>> = {
  "business_name": {
    "description": "Identifique seu negócio para fins fiscais e de correspondência.",
    "help": "Preencha o nome pelo qual seu negócio é conhecido, os dados de identificação fiscal e o endereço. Utilize o nome completo ou a razão social, conforme seu tipo de negócio. Informe apenas os dados disponíveis e acrescente outras informações se necessário."
  },
  "business_context": {
    "description": "Informe as localidades ou regiões abrangidas pelo seu negócio.",
    "help": "Exemplo: Rio de Janeiro e municípios vizinhos."
  },
  "offers": {
    "description": "Descreva os produtos e serviços oferecidos pelo seu negócio, incluindo preços e condições comerciais, quando definidos.",
    "help": "Exemplo 1: Consultoria financeira individual — R$ 300 por sessão, com pagamento via Pix.\n\nExemplo 2: Camisetas, calças e vestidos.\n\nCaso possua catálogos ou tabelas extensas de preços, descreva aqui apenas as principais ofertas. Consulte a Categoria 2 — Materiais de comunicação para verificar os recursos disponíveis para inclusão desses materiais."
  },
  "service": {
    "description": "Informe as modalidades de atendimento, endereços de atendimento presencial, dias e horários, telefones, WhatsApp, e-mails e formas de agendamento, quando aplicável.",
    "help": "Exemplo 1: Atendimento odontológico presencial na Rua das Flores, 120, sala 305, Centro, Rio de Janeiro/RJ, de segunda a sexta-feira, das 9h às 18h. Agendamento pelo WhatsApp (99) 99999-9999.\n\nExemplo 2: Atendimento 24 horas por dia, todos os dias, por meio de um agente conversacional de inteligência artificial no WhatsApp (99) 99999-9999.\n\nCaso existam particularidades no atendimento, como procedimentos, orientações, condições especiais ou encaminhamentos, descreva-as também nesta seção."
  },
  "proof": {
    "description": "Informe experiências, qualificações, certificações, registros profissionais, premiações e resultados comprovados que demonstrem a credibilidade do seu negócio.",
    "help": "Exemplo 1: Profissional com 15 anos de experiência e registro ativo no conselho profissional (nº XXXXX).\n\nExemplo 2: Redução do tempo médio de resposta aos clientes de duas horas para três minutos após a implantação de atendimento com inteligência artificial.\n\nUtilize informações verdadeiras e verificáveis. Depoimentos e avaliações de clientes devem ser organizados na Categoria 2 — Materiais de comunicação."
  },
  "materials": {
    "description": "Informe links para o site, redes sociais, portfólio, apresentações e outros materiais institucionais que ajudem a conhecer melhor seu negócio.",
    "help": "Adicione os endereços do seu site, perfis nas redes sociais, portfólio, apresentações e outras páginas institucionais. Identifique brevemente o conteúdo de cada link. Logotipos, fotos e vídeos devem ser organizados na categoria Materiais de comunicação."
  },
  "preferences": {
    "description": "Informe suas preferências de comunicação e o que deve ser evitado, como palavras, temas, abordagens, promessas ou outras restrições do seu negócio.",
    "help": "Explique como deseja que sua marca se comunique: termos preferidos, tom, assuntos sensíveis e abordagens que não devem ser utilizadas. Informe restrições profissionais, legais ou comerciais e promessas que não podem ser feitas."
  },
  "visual_identity": {
    "description": "Reúna os elementos que identificam visualmente sua marca para orientar a criação dos materiais de comunicação.",
    "help": "Compartilhe logotipos, cores, fontes, referências visuais e orientações de uso da marca, por arquivos ou links quando disponíveis. Se ainda não tiver identidade visual definida, preencha apenas o que souber."
  },
  "media_library": {
    "description": "Compartilhe fotos, vídeos e áudios do seu negócio que possam ser utilizados na criação dos materiais de comunicação.",
    "help": "Inclua imagens do negócio, produtos, serviços, espaços e equipe. Para vídeos e áudios, forneça links e uma breve descrição. Informe o contexto e se você tem autorização para utilizar esses materiais na comunicação."
  },
  "testimonials": {
    "description": "Reúna depoimentos, avaliações e outras evidências de satisfação dos clientes que reforcem a confiança no seu negócio.",
    "help": "Inclua depoimentos reais, avaliações públicas, recomendações ou relatos de experiências positivas. Informe a origem e utilize nomes, imagens ou falas de clientes somente quando houver autorização apropriada. Não invente avaliações."
  },
  "about": {
    "description": "Apresente a história, a missão e os valores do seu negócio, mostrando o que inspira sua atuação.",
    "help": "Conte como o negócio surgiu, sua trajetória, missão, visão e valores. Você também pode apresentar os fundadores, a equipe e o propósito que orienta o trabalho."
  },
  "audience": {
    "description": "Descreva quem são seus clientes, suas características e as situações em que procuram seus produtos ou serviços.",
    "help": "Descreva perfis de clientes, regiões, necessidades e momentos em que procuram sua solução. Considere o que valorizam, como decidem comprar e, quando houver, as diferenças entre públicos atendidos."
  },
  "market_insights": {
    "description": "Identifique os problemas, desejos, preocupações e dúvidas que influenciam a decisão de compra dos seus clientes.",
    "help": "Pense nos problemas que levam o cliente a procurar ajuda, nos resultados que deseja alcançar e nos receios que dificultam a decisão. Inclua crenças, dúvidas frequentes, objeções e motivações emocionais que você conhece."
  },
  "value_proposition": {
    "description": "Explique o principal valor que seu negócio entrega e por que sua solução é relevante para o cliente.",
    "help": "Explique qual problema principal sua oferta resolve, para quem ela é mais relevante e que transformação pode proporcionar. Se houver uma característica realmente distintiva, apresente sua Proposta Única de Valor (PUV). Evite promessas exageradas ou sem fundamento."
  },
  "benefits": {
    "description": "Apresente os benefícios que seus produtos ou serviços proporcionam aos clientes, destacando os resultados e melhorias que podem alcançar.",
    "help": "Descreva os ganhos concretos para o cliente, como praticidade, economia de tempo, conforto, segurança ou outros resultados pertinentes. Diferencie o que o produto possui da melhoria que isso proporciona. Inclua benefícios emocionais ou financeiros apenas quando justificáveis."
  },
  "differentiators": {
    "description": "Apresente as características que distinguem seu negócio das alternativas disponíveis no mercado.",
    "help": "Informe aspectos que tornam sua atuação distinta, como especialização, experiência, método, tecnologia, qualidade, conveniência ou atendimento. Priorize diferenças reais e verificáveis; não afirme ser o melhor ou o único sem comprovação. Diferenciais são características do negócio; benefícios são ganhos para o cliente."
  },
  "faq": {
    "description": "Esclareça as principais dúvidas dos clientes sobre seus produtos, serviços e condições de atendimento.",
    "help": "Cadastre perguntas reais e suas respostas, como preços, formas de pagamento, contratação, prazos, disponibilidade, área atendida e etapas do serviço. Adicione, edite ou remova pares de pergunta e resposta conforme necessário. Use somente informações confirmadas."
  }
};

export function getSectionGuidance(key: string) {
  return sectionGuidance[key] ?? null;
}
