01/07/2026 — Lousa debate landing pages
Fontes: chat, docs/roadmap.md, docs/schema.md, Supabase real, GitHub

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

2.4. Itens estruturais e copy

* Itens estruturais alimentam copy, argumento, seção e possivelmente design.
* Exemplos: dores, desejos, desejos ocultos, objeções, riscos, provas, diferenciais, critérios de decisão, FAQ e linguagem do público.
* A copy não deve nascer de prompt genérico nem de todos os dados disponíveis ao mesmo tempo.
* Cada campo relevante deve ter regra editorial própria.

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

4. Pendências essenciais

4.1. Composição por nicho

Ainda falta definir como o sistema vai transformar itens estruturais em composição por nicho.

Pontos abertos:

* IA sugere seções, ordem, variantes, obrigatoriedade e lacunas;
* sistema classifica sugestão como disponível, faltante ou inválida;
* humano aprova, ajusta, adia ou decide implementar módulo faltante;
* somente composição aprovada vira default oficial do nicho.

4.2. Parametrização editorial

Ainda falta mapear regras por seção/campo.

Primeiro foco recomendado:

* Hero title;
* Hero subtitle;
* CTA principal;
* prova curta;
* FAQ;
* CTA final.

4.3. Catálogo insuficiente para alguns nichos

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

4.4. `hero.lead_capture`

Antes de consumo real, verificar se `hero.lead_capture` cobre captura completa ou apenas uma variação técnica inicial.

Checar especialmente:

* formulário;
* nota de privacidade;
* submit label;
* CTA alternativo;
* validação de campos.

5. Direção aprovada

5.1. Fluxo desejado

* Taxon definido.
* Itens estruturais completos.
* Admin aciona IA para sugerir composição.
* Sistema confronta com catálogo, schemas, variantes e renderers existentes.
* Humano aprova ou ajusta.
* Composição aprovada vira default oficial do nicho.
* LP teste é gerada em conta teste.
* Nicho só é liberado após validação mínima.

5.2. Separação dos planos-base

* Plano-base 1 — Base de composição `landing_page`: E18; já teve avanço técnico em E18.4.
* Plano-base 2 — Curadoria de composição no Admin: E12; próximo recorte natural.
* Plano-base 3 — LP teste e liberação do nicho: E19; depende de E18 e E12.

6. Regra de cuidado

A base técnica repo-only de `landing_page` não deve ser tratada como produto final liberado para clientes.

A próxima evolução deve preservar:

* catálogo técnico não é composição fixa;
* IA não grava composição sozinha;
* banco não cria componente visual automaticamente;
* Admin não edita contratos livres;
* LP Builder não entra na E18;
* liberação de nicho depende de validação humana e LP teste.
