# Matriz de avaliação — primeira LP real da E19.4

Estado: aberta para convergência entre Executor, Estrategista, Analista e humano.

## 1. Objetivo e limite

Esta matriz registra a avaliação pós-merge da primeira landing page real materializada pela E19.4 e organiza propostas independentes antes de qualquer novo recorte ou correção.

Ela não reabre o plano-base v2, os pareceres especializados, a revisão da implementação ou o merge do PR #720. Também não autoriza implementação. Seu resultado deve distinguir:

- `defeito contratual da E19.4`: viola decisão fixa ou critério de aceite vigente e pode bloquear o fechamento do recorte;
- `lacuna de evidência`: ainda falta prova exigida para concluir a avaliação humana;
- `evolução editorial, persuasiva ou visual`: aprendizado para recorte posterior, sem ampliar automaticamente a E19.4;
- `decisão humana`: escolha material que as fontes e evidências não resolvem.

O Analista permanece read-only. Estrategista e Analista entregam seus pareceres no PR; o Executor transcreve fielmente cada contribuição nas colunas correspondentes. A coluna de convergência só é preenchida depois dos três retornos e da decisão humana quando necessária.

## 2. Fontes e evidências comuns

- `docs/lousa-plano-base-e19-4.md`, especialmente Gates D–E, critérios visuais, E19.4.5 e critério de conclusão.
- `docs/roadmap.md`, E19.4 e E19.4.5.
- `docs/matriz-consolidacao-e19-4.md`, apenas como histórico do contrato v2 já encerrado.
- Visualização privada hospedada da primeira LP materializada, inspecionada em 11/08/2026.
- DOM e estilos computados da LP renderizada:
  - 9 seções e 25 headings;
  - nenhum `header`, `nav` ou `footer` próprio da LP;
  - nenhuma imagem, vídeo, SVG ou ícone;
  - dois links de conversão, ambos para WhatsApp;
  - variáveis materializadas `--lp-primary: #087443`, `--lp-secondary: #344054`, `--lp-accent: #a15c00`, `--lp-background: #ffffff` e `--lp-text: #101828`;
  - CTAs com background computado transparente, texto `rgb(16, 24, 40)` e borda efetiva ausente;
  - elementos observados usando somente texto escuro, transparência e borda neutra, sem aplicação visual efetiva de primary, secondary ou accent.

## 3. Matriz de propostas

| ID | Eixo e erro/risco candidato | Evidência comum | Classificação candidata do Executor | Proposta do Executor | Proposta do Estrategista | Avaliação do Analista | Convergência |
|---|---|---|---|---|---|---|---|
| LP-EVAL-01 | Paleta materializada e CTAs não aparecem visualmente | Variáveis existem, mas os dois CTAs calculam fundo transparente, texto escuro e borda ausente; primary, secondary e accent não aparecem nos papéis visuais observados | defeito contratual da E19.4 | Restaurar a aplicação efetiva e determinística da paleta e dos estados dos CTAs, com caso executável e prova hospedada dos estilos computados, sem iniciar redesign | Pendente de parecer | Pendente de parecer read-only | Pendente |
| LP-EVAL-02 | A LP não possui cabeçalho nem rodapé próprios | DOM da LP contém zero `header`, `nav` e `footer`; a barra LP Factory pertence apenas à moldura administrativa | evolução editorial, persuasiva ou visual | Definir em recorte posterior o shell comercial mínimo da LP, incluindo identidade, contato, credenciais e fechamento legal somente com dados autorizados | Pendente de parecer | Pendente de parecer read-only | Pendente |
| LP-EVAL-03 | Hero tem baixa força de campanha e nenhuma âncora visual | Hero é composto apenas por texto e CTA sem destaque; não há imagem, ícone, marca ou mídia | evolução editorial, persuasiva ou visual | Estruturar recorte posterior para hero com identidade, proposta específica, prova curta, ativo visual autorizado e CTA dominante | Pendente de parecer | Pendente de parecer read-only | Pendente |
| LP-EVAL-04 | Uma única mensagem tenta converter compra, venda, locação e avaliação | Hero e fechamento reúnem as quatro jornadas no mesmo argumento e no mesmo CTA | decisão humana | O Estrategista deve propor uma intenção principal ou segmentação explícita, preservando as demais jornadas apenas se houver hierarquia comercial clara | Pendente de parecer | Pendente de parecer read-only | Pendente |
| LP-EVAL-05 | Provas de confiança são genéricas e podem não demonstrar fidelidade factual suficiente | A página exibe “CRECI verificável”, “identificação profissional clara” e “processo organizado”, mas a tela não mostra número, referência ou prova verificável | lacuna de evidência | Conferir cada afirmação contra as fontes autorizadas da candidata; manter apenas fatos sustentados e encaminhar prova comercial adicional para recorte posterior | Pendente de parecer | Pendente de parecer read-only | Pendente |
| LP-EVAL-06 | Ritmo visual é uniforme e a página se comporta como documento longo | Nove seções repetem título, parágrafo e card branco com borda neutra; não há alternância de mídia, cor ou composição | evolução editorial, persuasiva ou visual | Consolidar seções repetitivas e definir variação de composição em recorte posterior, sem transformar preferência estética em defeito contratual retroativo | Pendente de parecer | Pendente de parecer read-only | Pendente |
| LP-EVAL-07 | A moldura privada ocupa a primeira dobra antes da LP | O preview mostra estado `draft`, não publicação e retorno à conta antes do conteúdo materializado | não é defeito candidato; comportamento permitido pelo contrato atual | Preservar a moldura na prova privada; avaliar separadamente a experiência de chegada apenas quando existir superfície publicada ou novo recorte competente | Pendente de parecer | Pendente de parecer read-only | Pendente |
| LP-EVAL-08 | As evidências obrigatórias de fechamento ainda precisam ser consolidadas | O plano exige 360, 768 e 1280 px, teclado/foco, overflow, contraste, legibilidade, interações, copy, fidelidade factual, estado `draft` e próximo passo | lacuna de evidência potencialmente bloqueante | Montar uma única matriz de prova hospedada para os critérios já contratados, sem chamada OpenAI, nova materialização ou capacidade de publicação | Pendente de parecer | Pendente de parecer read-only | Pendente |

## 4. Formato dos retornos

Cada papel deve responder por ID, sem editar o contrato encerrado da E19.4:

1. `Concorda | discorda | reclassifica`.
2. Evidência adicional verificável.
3. Solução mínima proposta.
4. Destino: `E19.4`, `recorte posterior`, `N/A` ou `decisão humana`.
5. Risco residual e validação necessária.

O Estrategista avalia posicionamento, hierarquia de conversão, prioridade e menor recorte comercial suficiente. O Analista avalia coerência, rastreabilidade, suficiência das evidências, classificação e risco de ampliar retroativamente a E19.4. O Executor mantém a matriz, investiga evidências técnicas e transforma somente a convergência aprovada em briefing ou implementação posterior.

## 5. Critério de fechamento desta matriz

A matriz pode ser encerrada quando:

- todas as linhas contiverem parecer do Estrategista e avaliação do Analista;
- cada finding tiver destino e classificação final explícitos;
- defeitos contratuais estiverem separados de evolução comercial;
- decisões humanas estiverem identificadas sem solução presumida;
- houver uma próxima ação mínima e única, sem implementar nada neste PR documental.
