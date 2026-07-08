01/07/2026 — Lousa debate landing pages
Fontes: chat, docs/roadmap.md, docs/schema.md, docs/prompt-nicho-itens-estruturados.md, Supabase real, GitHub

1. Objetivo

Registrar apenas as decisões úteis sobre formação de landing pages no LP Factory 10.

Esta lousa não substitui o roadmap, não implementa nada e não autoriza nova infra.

2. Decisões fixas

2.1. Template

* Template não é landing page pronta.
* Template define base técnica: família, renderer, contratos, módulos compatíveis, validações, responsividade e versionamento.
* Template não decide sozinho quantidade, ordem, obrigatoriedade, copy ou removibilidade das seções por nicho.

2.2. Família `landing_page`

* `landing_page` é família própria e não deve herdar automaticamente o modelo rígido de `commercial_activation`.
* `commercial_activation` pode continuar determinístico.
* Landing pages reais precisam de composição flexível por nicho.
* Não criar template novo para cada nicho por padrão.

2.3. Módulos, variantes e composição

* Módulo = peça reutilizável disponível no sistema.
* Seção = uso concreto de um módulo em uma página.
* Variante = forma estrutural de um módulo.
* Composição = módulos + ordem + obrigatoriedade + variante + contexto/nicho.
* A composição é a camada correta para definir o que entra em cada landing page.

2.4. Itens estruturais

Os itens estruturados já possuem papel arquitetural.

Blocos atuais relevantes:

* `strategic_core`: dores, desejos, objeções, provas, crenças, linguagem e oportunidades.
* `lp_overview`: arco narrativo, tom visual, densidade, prioridade mobile e direção geral da página.
* `lp_sections`: seções prováveis, ordem, papel de conversão, prioridade e adequação por LP curta, média ou longa.
* `seo`: intenções, palavras comerciais, termos de apoio e perguntas.

Decisão atual:

* manter `lp_overview` e `lp_sections` nos itens estruturados por enquanto;
* não mover essa responsabilidade para o Blueprint sem decisão humana posterior;
* usar o Blueprint para auditar, comparar e acelerar parametrização, não para duplicar a estruturação já existente.

2.5. Parametrização técnica e editorial

* Parametrização técnica valida formato, campos, limites, CTA seguro, variante, compatibilidade e renderização.
* Parametrização editorial orienta fonte estratégica, tom, promessa, prova, objeção, foco e qualidade da copy.
* Zod, registry, resolver e renderer resolvem segurança técnica, não estratégia.
* Parametrização crítica deve começar no repo.
* Admin editável para contratos complexos fica fora do MVP atual.

3. Estado atual após E18.4

3.1. O que já foi feito

E18.4 consolidou uma base técnica repo-only para `landing_page`.

Foi feito:

* contratos TypeScript próprios;
* schemas Zod por seção;
* registry fechado próprio;
* render model próprio;
* renderer mínimo;
* fixture sintética;
* casos executáveis de validação;
* validador de composição;
* validação dedicada por `npm run validate:landing-page`.

3.2. Catálogo técnico inicial

Catálogo mínimo registrado para primeiro uso técnico:

* `hero.lead_capture`;
* `benefits.cards`;
* `offer.summary`;
* `social_proof.simple`;
* `how_it_works.steps`;
* `faq.accordion`;
* `final_cta.simple`.

Esse catálogo é disponibilidade técnica, não composição obrigatória para todos os nichos.

3.3. Limites preservados

E18.4 não criou:

* registros-base de banco para `landing_page`;
* Admin de curadoria;
* LP Builder;
* LP teste;
* rota pública;
* publicação;
* automação;
* job;
* agente.

3.4. `config_json`

* `config_json` ficou restrito a override controlado por seção.
* Chaves aceitas no recorte: `anchor_id` e `spacing`.
* Chaves livres como renderer, schema, style, HTML, script ou props arbitrárias são rejeitadas.

4. Papel do Blueprint

4.1. Função

O Blueprint não é o criador primário da arquitetura da LP.

Função correta no fluxo atual:

* ler taxon, pesquisa bruta, itens estruturados e catálogo técnico disponível;
* comparar `lp_sections` com a necessidade percebida pelo próprio Blueprint;
* apontar convergências, divergências e lacunas;
* acelerar parametrização de módulos e variantes;
* gerar proposta de evolução do catálogo, não implementação automática.

4.2. Entregas do Blueprint

O Blueprint pode entregar:

* auditoria de `lp_sections` e `lp_overview`;
* comparação entre seções sugeridas pelos itens estruturados e seções sugeridas pelo Blueprint;
* diagnóstico de cobertura do catálogo: disponível, parcial, faltante ou inválido;
* proposta de novo módulo ou variante quando houver lacuna real;
* proposta de ajuste controlado quando o módulo existir parcialmente;
* parametrização editorial, visual e de conversão para módulos faltantes ou frágeis;
* justificativa de ROI antes de qualquer evolução do catálogo.

4.3. Limite

* Blueprint não cria módulo diretamente em produção.
* Blueprint não grava composição sozinho.
* Blueprint não altera contratos, schemas, registry ou renderer.
* Blueprint gera proposta para aprovação humana e implementação controlada no repo.

5. Fluxo recomendado atualizado

5.1. Entrada

* Taxon definido.
* Pesquisa bruta aprovada.
* Itens estruturados carregados para `end_customer` e `business_buyer` quando aplicável.
* Blocos úteis: `strategic_core`, `lp_overview`, `lp_sections` e `seo`.

5.2. Composition draft

A primeira proposta de composition deve nascer principalmente de `lp_sections`.

O sistema compara `lp_sections` com o catálogo técnico `landing_page`.

Resultado esperado:

* seções disponíveis;
* seções disponíveis parcialmente;
* seções faltantes;
* seções inválidas ou fora do catálogo;
* ordem sugerida;
* obrigatoriedade sugerida;
* variante provável.

5.3. Blueprint

O Blueprint entra depois da leitura inicial da composition.

Ele serve para:

* validar se `lp_sections` faz sentido;
* sugerir seções ausentes;
* questionar ordem ou prioridade quando houver motivo;
* parametrizar módulos faltantes ou parciais;
* propor evolução do catálogo.

5.4. Decisão humana

Humano decide:

* aceitar composition sugerida;
* ajustar ordem ou módulos;
* adiar seção faltante;
* parametrizar módulo existente;
* criar novo módulo/variante;
* rejeitar sugestão por baixo ROI.

5.5. Implementação e validação

Quando houver novo módulo ou variante:

* implementar no repo;
* criar schema;
* registrar no registry;
* criar renderer ou ajuste visual;
* criar fixture;
* criar caso de validação;
* rodar validação.

5.6. LP teste e liberação

* Composition aprovada vira default oficial do nicho.
* LP teste é gerada em conta teste.
* Validar técnica, responsividade, velocidade, visual, copy e conversão.
* Nicho só é liberado após validação mínima.

6. Uso da mesma LP em canais

6.1. Google Ads

* A mesma LP pode ser usada como página de destino em campanhas.
* Para Google Ads, relevância e utilidade da landing page importam para diagnóstico de qualidade.
* A LP precisa estar alinhada à intenção, anúncio, palavra-chave, velocidade, mobile e clareza de conversão.

6.2. Instagram

* A mesma LP pode ser usada como destino de tráfego vindo do Instagram.
* Não precisa criar outra LP por padrão.
* Pode exigir adaptação de headline, prova, imagem, CTA ou ângulo quando o tráfego social tiver intenção diferente do tráfego de busca.

6.3. Regra prática

* LP base do nicho pode ser comum.
* Variações por canal devem ser tratadas depois, quando houver evidência.
* No MVP, registrar origem por UTM/tracking e validar desempenho por canal antes de criar variações.

7. Pendências essenciais

7.1. Parametrização editorial

Primeiro foco recomendado:

* Hero title;
* Hero subtitle;
* CTA principal;
* prova curta;
* FAQ;
* CTA final.

7.2. Catálogo insuficiente para alguns nichos

Avaliar, com caso real, se faltam módulos como:

* problema;
* autoridade;
* segurança;
* localização;
* formulário;
* antes/depois;
* serviços;
* procedimentos;
* planos.

7.3. `hero.lead_capture`

Antes de consumo real, verificar se `hero.lead_capture` cobre captura completa ou apenas uma variação técnica inicial.

Checar especialmente:

* formulário;
* nota de privacidade;
* submit label;
* CTA alternativo;
* validação de campos.

8. Separação dos planos-base

* Plano-base 1 — Base de composição `landing_page`: E18; já teve avanço técnico em E18.4.
* Plano-base 2 — Curadoria de composition e Blueprint no Admin: E12; próximo recorte natural.
* Plano-base 3 — LP teste e liberação do nicho: E19; depende de E18 e E12.

9. Regra de cuidado

A base técnica repo-only de `landing_page` não deve ser tratada como produto final liberado para clientes.

A próxima evolução deve preservar:

* `lp_sections` já sugere arquitetura inicial;
* Blueprint audita e parametriza, não substitui tudo;
* catálogo técnico não é composição fixa;
* IA não grava composition sozinha;
* banco não cria componente visual automaticamente;
* Admin não edita contratos livres;
* LP Builder não entra na E18;
* liberação de nicho depende de validação humana e LP teste.
