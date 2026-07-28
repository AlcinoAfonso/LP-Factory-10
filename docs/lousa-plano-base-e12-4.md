# Plano-base — E12.4 — Gestão do perfil de orientação

- Data: 28/07/2026.
- Versão: v1.
- Status: plano-base v1 para avaliação única dos especialistas.
- Recorte previsto para o roadmap: `12.4 — Gestão do perfil de orientação`.
- Recorte executável inicial: `12.4.3 — Proposta, revisão, aprovação e ativação do perfil`.
- Path canônico: `docs/lousa-plano-base-e12-4.md`.
- Plano conceitual: `docs/lp-planejamento.md`.

## 1. Estado e decisões fixas

### 1.1. Problema e resultado esperado

- A E20.3 já fornece o contrato versionado, a persistência mínima e a resolução server-side, read-only e fail-closed do perfil `active` próprio ou herdado.
- Ainda não existe operação oficial para o `platform_admin` criar, revisar, ativar ou arquivar versões do perfil.
- A E12.4.3 deve entregar no Admin Dashboard:
  - fluxo manual completo;
  - assistência opcional por IA para propor uma nova versão;
  - lifecycle humano e controlado entre `draft`, `active` e `archived`;
  - primeiro cadastro e primeira ativação oficiais do perfil.
- O resultado é uma nova versão do perfil orientativo. Não é uma composição final, uma LP ou uma autorização de geração.

### 1.2. Fontes usadas

- `README.md`.
- `docs/prompt-estrategista.md` v25.
- `docs/template-roadmap.md`.
- `docs/gestor-automations.md`.
- `docs/lp-planejamento.md`, especialmente 1.6, 1.7, 1.8 e 4.2.
- `docs/roadmap.md`.
- `docs/base-tecnica.md`.
- `docs/schema.md`.
- `docs/lousa-plano-base-e20-3.md`.
- PR #644 e implementação vigente da E20.3:
  - `lib/conversion-content/landing-page/generation-profile/`;
  - `lib/conversion-content/adapters/landingPageGenerationProfileAdapter.ts`;
  - migration `20260726144651_e20_3_generation_profile.sql`.
- Parecer do Gestor de Automações e decisão humana de 28/07/2026:
  - automação opcional;
  - categoria `Automação com IA em fluxo controlado`;
  - ambiente `Runtime do LP Factory`;
  - OpenAI condicional;
  - acionamento exclusivo pelo `platform_admin`;
  - validação determinística, revisão e ativação humanas e fallback manual completo.

### 1.3. Decisões funcionais fixas

- Perfil próprio é permitido somente para segmento e nicho no MVP.
- Ultranicho usa o perfil `active` do ancestral elegível mais próximo.
- Os estados persistidos permanecem somente `draft`, `active` e `archived`.
- Uma versão `active` é imutável.
- Mudança de orientação exige nova versão em `draft`.
- Existe no máximo uma versão `active` por taxon proprietário.
- A versão é única por taxon proprietário.
- O mesmo `platform_admin` pode revisar e executar `Aprovar e ativar`.
- A aprovação é decisão humana e evento auditado dentro de `Aprovar e ativar`; não é status persistido nem resultado estável separado.
- A IA apenas propõe conteúdo para o editor. Não salva, aprova, ativa, arquiva nem gera LP.
- A operação manual permanece completa quando a IA não for usada, falhar ou estiver indisponível.
- A LP materializada permanece independente e não muda quando o perfil evolui.
- A E12.4.4 e as subseções posteriores permanecem fora desta v1.

### 1.4. Fronteiras de responsabilidade

- E10.8 fornece a pesquisa estruturada resolvida e versionada usada pela proposta por IA.
- E18.4 e E18.5 mantêm seus contratos vigentes; a E12.4.3 não os redefine.
- E20.3 continua responsável pelo contrato, validação, persistência e resolução do perfil.
- E12.4.3 opera criação, edição, revisão, ativação e arquivamento por `platform_admin`.
- E12.4.4 tratará autorização e revogação por conta, taxon e plano.
- E19.4 e planos posteriores tratarão geração e materialização da LP.

## 2. Contrato do caso

### 2.1. Fluxo operacional

- Gatilho:
  - `platform_admin` acessa a gestão de perfis no Admin Dashboard;
  - seleciona um segmento ou nicho;
  - inicia manualmente uma nova versão ou solicita a proposta opcional por IA.
- Entrada comum:
  - taxon proprietário e cadeia ativa;
  - perfil `active` atual, quando existir;
  - identidades públicas vigentes da E18.4 e E18.5.
- Entrada adicional da IA:
  - resultado completo e resolvido da E10.8, com versões e proveniência;
  - última versão anteriormente ativa do perfil, quando houver;
  - orientação textual opcional do `platform_admin`.
- Processamento manual:
  - iniciar a próxima versão no editor;
  - preencher orientação geral e recomendações;
  - persistir somente após `Salvar rascunho`;
  - permitir alteração somente enquanto a versão estiver em `draft`.
- Processamento com IA:
  - exigir ação explícita do `platform_admin`;
  - verificar a resolução completa da E10.8 antes da chamada;
  - fornecer somente as entradas autorizadas;
  - receber proposta limitada aos campos do perfil;
  - validar a saída deterministicamente;
  - preencher o editor sem persistência automática.
- Validação:
  - validar taxon, agregado, identidades e versões antes de salvar, ativar ou arquivar;
  - rejeitar saída ou mutação incompatível sem alterar o `draft` nem o `active`.
- Persistência:
  - reutilizar `landing_page_generation_profiles` e `landing_page_generation_profile_items`;
  - criar um boundary de mutação controlado exclusivamente para `platform_admin`;
  - manter `public`, `anon`, `authenticated`, cliente e `ai_readonly` sem escrita direta;
  - usar uma única ação visual `Salvar rascunho`;
  - executar `Aprovar e ativar` atomicamente, arquivando a versão `active` anterior quando existir;
  - reservar para a v2 a escolha entre RPC, Server Action, rota ou outro mecanismo já compatível com a arquitetura.
- Consumo:
  - Admin Dashboard apresenta versões e o perfil resolvido atual;
  - o boundary vigente da E20.3 continua entregando somente o perfil `active` próprio ou herdado;
  - somente gerações futuras poderão consumir a nova versão ativa.
- Fallback:
  - manter o editor manual disponível sem IA;
  - preservar o `active` atual em qualquer falha de proposta, salvamento ou ativação;
  - não repetir chamada à IA automaticamente;
  - não converter falha técnica ou saída inválida em ausência de informação.

### 2.2. Contrato do perfil e validações

- O taxon proprietário deve ser segmento ou nicho ativo.
- `generation_guidance` deve ser texto não vazio.
- Cada recomendação deve conter:
  - módulo e versão existentes;
  - `variant_key` e `variant_version` ambas presentes ou ambas ausentes;
  - variante existente e pertencente ao módulo, quando informada;
  - prioridade `P1`, `P2` ou `P3`;
  - ordem recomendada inteira positiva;
  - orientação específica não vazia, quando presente.
- No mesmo perfil:
  - módulo não pode se repetir;
  - ordem recomendada não pode se repetir;
  - a versão não pode se repetir para o mesmo taxon proprietário.
- Prioridade e ordem permanecem orientativas.
- Nenhum campo pode transformar módulo em obrigatório.
- Identidade ausente ou incompatível falha fechado e não é criada ou corrigida automaticamente.

### 2.3. Lifecycle, atomicidade e auditoria

- Criar nova versão:
  - calcular a próxima versão sem sobrescrever histórico;
  - persistir como `draft` somente após confirmação humana.
- Salvar:
  - permitir apenas sobre `draft`;
  - usar `Salvar rascunho` tanto após proposta da IA quanto após edição humana.
- Aprovar e ativar:
  - revalidar o agregado;
  - registrar a decisão humana;
  - arquivar o `active` anterior, quando existir;
  - ativar o novo `draft`;
  - concluir toda a troca atomicamente.
- Arquivar:
  - arquivar `draft` não altera o perfil resolvido;
  - arquivar isoladamente o `active` resolve o ancestral elegível mais próximo ou ausência tipada;
  - arquivar o `active` anterior dentro de `Aprovar e ativar` não cria fallback intermediário.
- Auditoria:
  - reutilizar o mecanismo vigente, sem nova tabela;
  - registrar somente mutações confirmadas;
  - distinguir criação ou salvamento de `draft` com origem manual ou IA;
  - registrar `Aprovar e ativar` como uma operação;
  - registrar arquivamento explícito;
  - reservar para a v2 a compatibilidade técnica e a forma exata de integração.

### 2.4. Contrato da assistência por IA

- Gate:
  - E10.8 completa é obrigatória antes da chamada;
  - pesquisa parcial retorna `missing_information` e não aciona a IA.
- Entradas permitidas:
  - taxon proprietário e cadeia ativa;
  - resultado resolvido da E10.8, com versões e proveniência;
  - contrato público da E18.4;
  - catálogo e validação pública da E18.5;
  - última versão anteriormente ativa do perfil, quando houver;
  - orientação textual opcional do `platform_admin`.
- Saída permitida:
  - orientação geral;
  - módulos e variantes existentes;
  - prioridade;
  - ordem recomendada;
  - orientação específica por recomendação.
- Resultados de falha:
  - `missing_information` para E10.8 incompleta antes da chamada;
  - `invalid_data` para saída incompatível;
  - `technical_failure` para indisponibilidade ou falha técnica.
- Controles:
  - saída estruturada e validada antes de preencher o editor;
  - nenhuma ferramenta externa, autonomia ou comportamento agentic;
  - nenhuma persistência ou ativação automática;
  - provedor, modelo, parâmetros, contrato técnico e limite de custo definidos somente na v2 após avaliação formal do Gestor de Automações.

### 2.5. Critérios visuais

- Área protegida do Admin Dashboard, sem contexto de conta.
- Seleção somente de segmento e nicho.
- Exibição clara do perfil atual como próprio, herdado ou ausente.
- Versão e status sempre visíveis.
- Editor único para orientação geral e recomendações.
- Ações visuais:
  - criar nova versão;
  - solicitar proposta por IA;
  - `Salvar rascunho`;
  - `Aprovar e ativar`;
  - arquivar.
- O botão de IA informa indisponibilidade quando faltar E10.8.
- Ativação e arquivamento exigem confirmação explícita.
- `missing_information`, `invalid_data` e `technical_failure` são estados distintos.
- Responsividade mínima em desktop e mobile.

### 2.6. Segurança e observabilidade

- Toda leitura e mutação operacional permanece server-side.
- Toda mutação exige `platform_admin` confirmado pelo guard vigente.
- A IA não recebe dados de conta, oferta, campanha, LP, copy produzida, tabelas brutas de pesquisa ou registry interno da E18.5.
- Registrar o mínimo necessário para diagnóstico e auditoria:
  - `platform_admin` solicitante;
  - taxon e versões das fontes utilizadas;
  - origem manual ou IA;
  - sucesso, `missing_information`, `invalid_data` ou `technical_failure`;
  - latência, consumo e custo da chamada quando houver;
  - resultado da revisão humana.
- Logs não devem expor segredo, credencial ou conteúdo não autorizado.

## 3. Fases e próxima ação

### 3.1. E12.4.3 — Proposta, revisão, aprovação e ativação do perfil

- Automação: sim.
- Categoria: Automação com IA em fluxo controlado.
- Ambiente: Runtime do LP Factory.
- OpenAI: condicional.
- Objetivo:
  - entregar a operação manual completa do perfil e a proposta opcional por IA, com validação determinística, revisão humana e fallback manual.
- Limites da automação:
  - acionamento exclusivo pelo `platform_admin`;
  - E10.8 completa como gate;
  - entrada e saída fechadas;
  - proposta limitada ao editor;
  - sem agente, ferramentas, repetição automática, persistência, ativação ou geração de LP pela IA.
- Entregas:
  - superfície administrativa protegida para listar, criar, editar, ativar e arquivar versões;
  - boundary de mutação controlado e exclusivo para `platform_admin`;
  - fluxo manual com uma única ação `Salvar rascunho`;
  - fluxo opcional de proposta por IA no mesmo editor;
  - validação determinística do agregado e das identidades públicas da E18.5;
  - `Aprovar e ativar` atômico;
  - arquivamento com efeitos distintos para `draft` e `active`;
  - auditoria e observabilidade mínimas, reutilizando mecanismos vigentes;
  - casos executáveis e evidências visuais;
  - atualização dos documentos canônicos materialmente afetados e de `docs/roadmap.md` pelo Prompt ABC.
- Critérios de aceite:
  - operação manual completa sem dependência da IA;
  - nenhuma chamada à IA sem ação humana e E10.8 completa;
  - proposta válida preenche o editor sem salvar automaticamente;
  - saída inválida ou falha técnica preserva o `draft` e o `active`;
  - apenas segmento e nicho aceitam perfil próprio;
  - `active` não pode ser editado;
  - exatamente três estados persistidos;
  - invariantes do banco e da E18.5 aplicados em toda mutação;
  - troca de versão ativa comprovadamente atômica;
  - nenhuma escrita direta concedida a `public`, `anon`, `authenticated`, cliente ou `ai_readonly`;
  - mutações confirmadas auditadas sem nova tabela;
  - nenhuma LP materializada alterada;
  - fluxo validado em desktop e mobile;
  - validações do repositório e evidências do ambiente alvo definidas na v2 e aprovadas antes da execução.

### 3.2. Próxima ação

- Submeter esta v1 em avaliação única a:
  - Analista;
  - Gestor Estrutural;
  - Gestor de Updates;
  - Gestor de Automações.
- O Gestor de Automações deve detalhar na v2 a solução dentro da categoria aprovada, incluindo decisão atual de OpenAI, contrato técnico, custo, segurança, observabilidade e fallback.
- Consolidar os pareceres na v2 sem mudar a categoria de automação ou ampliar o recorte sem nova decisão humana.
- Não iniciar implementação a partir desta v1.

## 4. Escopo negativo e critérios de parada

### 4.1. Escopo negativo

- E12.4.4, autorização ou revogação por conta, taxon e plano.
- E12.4.5, E12.4.6, E19.4, geração, materialização, preview, publicação ou alteração de LP.
- Perfil próprio de ultranicho.
- Gaps persistidos, prontidão, aprendizado automático ou evolução automática do catálogo.
- Criação ou alteração de módulo, variante, E18.4 ou E18.5.
- Dados de conta, oferta, campanha, LP ou copy produzida.
- Acesso a tabelas brutas de pesquisa ou ao registry interno da E18.5.
- Dados externos ainda não aprovados.
- Quarto status, estado `approved`, terceira tabela de domínio ou tabela própria de auditoria.
- Escrita direta por `public`, `anon`, `authenticated`, cliente ou `ai_readonly`.
- Ativação, salvamento, repetição ou correção automática pela IA.
- Agente, comportamento agentic, job, fila, cron, webhook, workflow ou nova infraestrutura.
- Escolha antecipada de RPC, Server Action, rota, modelo, parâmetros ou configuração operacional.
- Implementação além do menor delta necessário para cumprir as entregas e os critérios de aceite da E12.4.3.
- Refatoração, limpeza ou reorganização de áreas não indispensáveis à E12.4.3.
- Abstração genérica criada para necessidade futura ou reutilização ainda não comprovada neste recorte.
- Componente, ação administrativa ou funcionalidade não prevista explicitamente nas entregas e nos critérios de aceite.

### 4.2. Critérios de parada imediata

- Parar e devolver ao Estrategista se:
  - o fluxo exigir ampliar a E12.4.3 ou alcançar a E12.4.4;
  - surgir necessidade de perfil próprio de ultranicho;
  - a mutação segura e atômica exigir nova tabela, nova infraestrutura ou mudança material de arquitetura;
  - a categoria aprovada não atender ao requisito;
  - houver necessidade de agente, ferramenta autônoma ou fonte externa não aprovada;
  - a auditoria vigente não puder ser reutilizada sem ampliar o escopo;
  - uma entrega exigir refatoração lateral, abstração genérica ou funcionalidade não prevista neste plano;
  - houver conflito com o contrato ou a implementação vigente da E20.3;
  - o repositório ou o ambiente alvo divergir das fontes do plano.

### 4.3. Validação deste trabalho documental

- Confirmar:
  - somente `docs/lousa-plano-base-e12-4.md` criado;
  - quatro seções principais preservadas;
  - uma única fase executável, `E12.4.3`;
  - `Automação: sim` com categoria, ambiente, objetivo e limites;
  - E12.4.4 e subseções posteriores fora do recorte;
  - ausência de implementação e de decisão técnica reservada à v2;
  - ausência de alteração em `docs/roadmap.md` nesta v1.
- Executar verificação de whitespace e estrutura Markdown.
- Registrar como N/A nesta entrega documental:
  - `npm ci`;
  - `npm run check`;
  - validação material;
  - teste humano;
  - smoke visual.

### 4.4. Critérios de encerramento do plano

- O plano será encerrado somente após:
  - v2 aprovada;
  - implementação da E12.4.3;
  - validações técnicas e visuais aprovadas;
  - reconciliação documental pelo Prompt ABC;
  - merge humano;
  - confirmação do estado final no ambiente alvo.
