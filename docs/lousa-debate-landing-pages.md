01/07/2026 — Lousa debate landing pages
Fontes: chat, docs/roadmap.md, docs/schema.md, docs/prompt-nicho-itens-estruturados.md, Supabase real, GitHub

1. Objetivo

Registrar decisões úteis sobre formação de landing pages no LP Factory 10.

Esta lousa não substitui o roadmap, não implementa nada e não autoriza nova infra.

2. Decisões fixas

2.1. Template

* Template não é landing page pronta.
* Template define base técnica: família, renderer, contratos, módulos compatíveis, validações, responsividade e versionamento.
* Template não decide sozinho quantidade, ordem, obrigatoriedade, copy ou removibilidade das seções por nicho.

2.2. Família `landing_page`

* `landing_page` é família própria.
* `landing_page` não deve herdar automaticamente o modelo rígido de `commercial_activation`.
* `commercial_activation` pode continuar determinístico.
* Landing pages reais precisam de composition flexível por nicho.
* Não criar template novo para cada nicho por padrão.

2.3. Módulos, variantes e composition

* Módulo = peça reutilizável disponível no sistema.
* Seção = uso concreto de um módulo em uma página.
* Variante = forma estrutural de um módulo.
* Composition = módulos + ordem + obrigatoriedade + variante + contexto/nicho.
* Composition é a camada correta para definir o que entra em cada landing page.

2.4. Itens estruturais

Blocos atuais relevantes:

* `strategic_core`: dores, desejos, objeções, provas, crenças, linguagem e oportunidades.
* `lp_overview`: arco narrativo, tom visual, densidade, prioridade mobile e direção geral da página.
* `lp_sections`: seções prováveis, ordem, papel de conversão, prioridade e adequação por LP curta, média ou longa.
* `seo`: intenções, palavras comerciais, termos de apoio e perguntas.

Decisão atual:

* manter `lp_overview` e `lp_sections` nos itens estruturados por enquanto;
* não mover essa responsabilidade para o Blueprint sem decisão humana posterior;
* usar o Blueprint para parametrizar, auditar e comparar, não para duplicar a estruturação já existente.

2.5. Parametrização técnica e editorial

* Parametrização técnica valida formato, campos, limites, CTA seguro, variante, compatibilidade e renderização.
* Parametrização editorial orienta fonte estratégica, tom, promessa, prova, objeção, foco e qualidade da copy.
* Zod, registry, resolver e renderer resolvem segurança técnica, não estratégia.
* Parametrização crítica deve começar no repo.
* Admin editável para contratos complexos fica fora do MVP atual.

3. Estado atual após E18.4

3.1. Base técnica criada

E18.4 consolidou uma base técnica repo-only para `landing_page`:

* contratos TypeScript próprios;
* schemas Zod por seção;
* registry fechado próprio;
* render model próprio;
* renderer mínimo;
* fixture sintética;
* casos executáveis de validação;
* validador de composition;
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

Esse catálogo é disponibilidade técnica, não composition obrigatória para todos os nichos.

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

4. Papel do Blueprint

4.1. Função principal

O Blueprint deve acelerar a evolução do catálogo de módulos e variantes de `landing_page` a partir de nichos reais.

Função principal:

* ler taxon, pesquisa bruta, itens estruturados e catálogo técnico disponível;
* identificar exigências editoriais, visuais e de conversão;
* parametrizar módulos e variantes existentes;
* propor novo módulo ou variante quando houver lacuna real;
* justificar ROI antes de qualquer evolução do catálogo;
* gerar proposta, não implementação automática.

4.2. Dois momentos do Blueprint

O Blueprint atua em dois momentos:

* antes da composition draft: parametriza e propõe evolução do catálogo;
* depois da composition draft: audita lacunas, conflitos, ordem e adequação.

Essa separação evita tratar o Blueprint apenas como auditor da composition.

4.3. Entregas possíveis

* parametrização editorial, visual e de conversão por módulo/variante;
* mapeamento de campos para `strategic_core`, `lp_overview`, `lp_sections` e `seo`;
* critérios para criar nova variante ou novo módulo;
* diagnóstico de cobertura do catálogo: disponível, parcial, faltante ou inválido;
* auditoria de `lp_sections` e `lp_overview`;
* comparação entre seções sugeridas pelos itens estruturados e seções sugeridas pelo Blueprint;
* proposta de ajuste controlado quando o módulo existir parcialmente.

4.4. Exemplos iniciais de parametrização

* `hero.title`: dor principal, desejo principal, transformação, linguagem do público e limite de promessa.
* `hero.subtitle`: mecanismo, contexto de decisão, objeção principal e clareza do próximo passo.
* `primary_cta`: intenção do usuário, ação esperada e canal de conversão.
* `proof_line`: prova disponível, autoridade, redução de risco e verificação mínima.
* `faq.accordion`: objeções, riscos percebidos, dúvidas práticas e barreiras de compra.

4.5. Limite

* Blueprint não cria módulo diretamente em produção.
* Blueprint não grava composition sozinho.
* Blueprint não altera contratos, schemas, registry ou renderer.
* Blueprint gera proposta para aprovação humana e implementação controlada no repo.

5. Fluxo recomendado

5.1. Entrada

* Taxon definido.
* Pesquisa bruta aprovada.
* Itens estruturados carregados para `end_customer` e `business_buyer` quando aplicável.
* Blocos úteis: `strategic_core`, `lp_overview`, `lp_sections` e `seo`.

5.2. Blueprint de Parametrização do Catálogo

Antes da composition draft, o Blueprint compara necessidades do nicho com o catálogo técnico existente.

Resultado esperado:

* módulos e variantes suficientes;
* módulos e variantes parciais;
* módulos e variantes faltantes;
* regras editoriais por campo;
* regras visuais e responsivas relevantes;
* critérios de conversão por módulo;
* proposta de evolução do catálogo.

Se houver lacuna real, o Blueprint não implementa. Ele gera proposta para decisão humana.

5.3. Decisão humana sobre catálogo

Humano decide:

* usar o catálogo atual;
* parametrizar módulo existente;
* criar nova variante;
* criar novo módulo;
* adiar lacuna;
* rejeitar sugestão por baixo ROI.

Quando aprovado, a implementação segue no repo com schema, registry, renderer, fixture e validação.

5.4. Composition draft

A primeira proposta de composition deve nascer principalmente de `lp_sections`, já considerando o catálogo parametrizado aprovado.

O sistema compara `lp_sections` com o catálogo técnico `landing_page`.

Resultado esperado:

* seções disponíveis;
* seções parcialmente disponíveis;
* seções faltantes;
* seções inválidas ou fora do catálogo;
* ordem sugerida;
* obrigatoriedade sugerida;
* variante provável.

5.5. Auditoria Blueprint da composition

Depois da composition draft, o Blueprint audita a montagem proposta.

Ele serve para:

* validar se `lp_sections` faz sentido;
* sugerir seções ausentes;
* questionar ordem ou prioridade quando houver motivo;
* apontar uso forçado de módulo inadequado;
* apontar lacuna moderna, visual, editorial ou de conversão.

5.6. Decisão humana sobre composition

Humano decide:

* aceitar composition sugerida;
* ajustar ordem ou módulos;
* adiar seção faltante;
* revisar parametrização;
* rejeitar sugestão por baixo ROI.

5.7. LP teste e liberação

* Composition aprovada vira default oficial do nicho.
* LP teste é gerada em conta teste.
* Validar técnica, responsividade, velocidade, visual, copy e conversão.
* Nicho só é liberado após validação mínima.

6. Canal, origem de tráfego e distribuição

6.1. Canal

No contexto de templates e artefatos, canal é o tipo de entrega.

Exemplos:

* `landing_page`;
* `instagram`;
* `email`;
* `whatsapp`.

Decisão:

* uma LP é sempre canal `landing_page`;
* Reel, post ou carrossel são canal `instagram`;
* mensagem ou sequência é canal `whatsapp`;
* e-mail é canal `email`.

6.2. Origem de tráfego ou distribuição

Google Ads, Instagram Ads, link na bio, grupos de WhatsApp, tráfego orgânico ou QR Code não são o canal da LP.

Eles são origens de tráfego, distribuição ou contexto de uso da mesma landing page.

A mesma LP do canal `landing_page` pode ser usada em:

* Google Ads;
* Instagram Ads;
* link na bio;
* grupos de WhatsApp;
* tráfego orgânico;
* QR Code.

6.3. Regra prática

* Não criar família de template diferente porque a LP será divulgada no Google Ads ou Instagram.
* A LP base do nicho pode ser comum para várias origens de tráfego.
* Variações por origem só devem ser criadas com evidência real.
* No MVP, usar UTM/tracking para medir origem antes de criar variações.
* Se a origem exigir ajuste, tratar como variação da LP, não como outro canal.

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

* Plano-base 1 — Base de composition `landing_page`: E18; já teve avanço técnico em E18.4.
* Plano-base 2 — Curadoria de Blueprint, catálogo e composition no Admin: E12; próximo recorte natural.
* Plano-base 3 — LP teste e liberação do nicho: E19; depende de E18 e E12.

9. Regra de cuidado

A base técnica repo-only de `landing_page` não deve ser tratada como produto final liberado para clientes.

A próxima evolução deve preservar:

* Blueprint parametriza catálogo antes de auditar composition;
* `lp_sections` já sugere arquitetura inicial;
* catálogo técnico não é composition fixa;
* origem de tráfego não muda o canal da LP;
* IA não grava composition sozinha;
* banco não cria componente visual automaticamente;
* Admin não edita contratos livres;
* LP Builder não entra na E18;
* liberação de nicho depende de validação humana e LP teste.
