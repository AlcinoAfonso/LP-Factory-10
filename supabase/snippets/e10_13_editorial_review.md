# E10.13 — conferência editorial do acervo

Correção do PB-A aprovado no Debate 21, após o PR #1048. Não inicia PB-B.
O SQL de correção preserva os 243 registros anteriores completos em `before_items`,
por ID, antes de alterar apenas `item_text` e `notes` de 183 itens.
A carga inicial, o inventário, taxons, aliases e contratos permanecem históricos e intactos.

## Critério e resultado da revisão

As 60 pesquisas foram confrontadas com suas linhas e conclusões nos PDFs originais.
Todas perderam informação comercial relevante em ao menos um campo; os três campos
de conteúdo foram enriquecidos porque o panorama omitia a economia/modelo,
a maturidade omitia canais ou prontidão e a oportunidade não traduzia essas diferenças
em hipóteses específicas. Não se aplicou meta de tamanho.
Foram preservados sem alteração os 60 itens `evidence_limitations`, adequados ao recorte:
aferição atual e particularidades do cliente continuam pendentes, sem impedir aproveitar
conhecimento histórico. Nenhuma pesquisa inteira ficou sem correção; as 24 pesquisas e
379 itens anteriores ao PB-A ficam integralmente preservados.

Cada texto corrigido identifica PDF/página/data e ausência de validação independente.
O período do dado é mantido quando informado; ausência de período é declarada, sem
transformar data do PDF em ano da medida. Projeções, casos isolados, rankings e avaliações
qualitativas permanecem atribuídos ao autor. Hipóteses de comunicação não são fatos de cliente.
Não houve pesquisa nova de mercado, alteração de taxonomia ou validação externa de estatísticas.

O confronto binário confirmou os 11 PDFs do ZIP, da pasta e do inventário por SHA-256;
a extração textual foi conferida contra todos os PDFs. As cinco páginas auditadas também
foram inspecionadas visualmente para conferir células e unidades das tabelas.

## Fontes

| PDF | Data do quadro | Páginas | SHA-256 |
| --- | --- | --- | --- |
| Alimentação e Gastronomia.pdf | 2025-06-26 | 1 | `aee99dbe347f7111f2cd54ca5cc1c85f61fdd0128ac43a3e92e9d9096f195c7a` |
| Educação.pdf | 2025-06-25 | 1 | `fb9403295b3428205f0fd128ce0c7cf4f4fb83e2437faade03e1ebfcd05d1291` |
| Fitnes e Esportes.pdf | 2025-06-26 | 2 | `ebb01aadcce657ad78bfe4d38e37e002a33d308c007081c3d841bc79cf5867d9` |
| Hotelaria e Turismo.pdf | 2025-06-26 | 1 | `25a0041b2f0ce6848cbcd950f26a94025c0fcbe0b0845cccfad160f0035f7817` |
| Imobiliário Construção.pdf | 2025-06-26 | 2 | `50f43b99ce6bc66d38dc2107de569eae3d20166af246c71772379dc2f2855941` |
| Nicho lista.pdf | Lista; sem pesquisa específica | 2 | `88212c6193a6f19394aad039c1db84ae0ec217b44b8291e8d67aed7d22d4b4b7` |
| Saúde e Bem-estar.pdf | 2025-06-25 | 1 | `56b892758bf9c02a22c2ae47223bffe9b41e5300b35a75224b77ea07046751d3` |
| Serviços Profissionais Consultoria.pdf | 2025-06-26 | 2 | `e1689e90ec84e6bc4715b94220ec6953bc8470496c244a2b6ebae7e8f3909472` |
| Varejo e Comércio Local 1.pdf | 2025-06-26 | 1 | `8d36e0640c8776d403e1c8bf58971633c10090ead76cb4ebf4a170b6d26d1dc0` |
| Varejo e Comércio Local 2.pdf | 2025-07-03 | 1 | `d2942178024ac97569ac4ab912e3dc06c3ee05260499dc02a2eb797a1ef58f97` |
| Veículos e Transportes.pdf | 2025-06-26 | 1 | `dde9d34ab21dd2bd00d9e60259bb1e1fdd1b5fc8796699e8f3c2059f5a63e4d6` |

## Comparação completa dos cinco nichos auditados

Os textos abaixo correspondem ao antes capturado e ao candidato depois por ID.
As ressalvas de fonte/período fazem parte do texto persistido, não apenas deste relatório.

### Nutricionistas

**market_overview** — `a3bd497a-c4e6-51c2-b553-8eb13543bd41`

Antes: O material relaciona nutrição a acompanhamento, saúde preventiva e fitness; não comprova demanda atual.

Depois: Fonte histórica: Saúde e Bem-estar.pdf, p.1, 2025-06-25; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro associa a procura à prevenção e ao público fitness e descreve cerca de 200 mil profissionais, com aumento de 22% em três anos; o fim dessa janela não é informado. Aponta consultas de R$100–300 e pacotes mensais que elevam o valor por cliente. Consultório próprio teria custo operacional baixo e margem alta, mas volume modesto: boa margem percentual não equivale a grande faturamento ou orçamento para agência.

**digital_maturity** — `30baaa22-03fd-51d2-ba4a-1990e2098604`

Antes: A pesquisa histórica destaca conteúdo orgânico e adoção variável de anúncios.

Depois: Fonte histórica: Saúde e Bem-estar.pdf, p.1, 2025-06-25; conteúdo sem validação independente. Maturidade moderada no quadro: Instagram orgânico e conteúdo educativo predominam, com pouco investimento em anúncios. Existem agências especializadas, mas o orçamento descrito é inferior ao de clínicas maiores. O relacionamento recorrente e o formato de acompanhamento ajudam a distinguir a venda de uma consulta isolada.

**communication_opportunity** — `2dcebcb6-9213-5bd4-9c39-76e7231f5f5a`

Antes: Comunicar formato de acompanhamento confirmado; não apresentar prescrição, resultado ou promessa individual.

Depois: Fonte histórica: Saúde e Bem-estar.pdf, p.1, 2025-06-25; conteúdo sem validação independente. Hipótese estratégica: organizar a comunicação em torno de acompanhamento e pacotes realmente oferecidos, explicando duração, atendimento e continuidade; combinar conteúdo educativo com descoberta local e conversão para consulta. Qualificar capacidade, receita recorrente e verba antes de propor mídia, em vez de presumir que a margem permita um contrato alto. Especialidade, credenciais, oferta e resultados pertencem ao cliente e precisam de confirmação; não prometer emagrecimento ou benefício clínico.

### Restaurantes e bares

**market_overview** — `b171c9eb-c897-505d-880f-d5564f41854f`

Antes: O acervo descreve concorrência por movimento local, consumo no estabelecimento e entregas, com necessidade de recorrência.

Depois: Fonte histórica: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro registra cerca de 300 mil estabelecimentos, faturamento setorial de R$416 bilhões em 2023 e aproximadamente 4,94 milhões de empregos, sem período próprio para a contagem de empregos. A alta de 3,3% para 2024 aparece como projeção, não resultado confirmado. Ticket em torno de R$20 por cliente varia com o tipo de negócio; margem de 5–10% e operações no equilíbrio mostram que movimento e receita não equivalem a grande lucro. Consumo no salão, delivery e recompra têm economias diferentes.

**digital_maturity** — `c9a5c432-6d12-551e-985b-a4a844af5fcf`

Antes: A pesquisa de 2025 cita redes sociais, aplicativos de entrega e fidelização; a intensidade de uso não foi aferida agora.

Depois: Fonte histórica: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Adoção alta no quadro; o percentual de 46% que priorizaria marketing não tem base e período individualizados. Redes sociais, aplicativos de entrega e fidelização coexistem; a conclusão cita Google, Instagram, TikTok, fotos/vídeos de pratos, indicação e influenciadores gastronômicos. Visibilidade local e relacionamento ajudam a preencher mesas e gerar recorrência, sem retorno garantido. Na comparação dos cinco nichos do PDF, o autor escolhe restaurantes e bares como os mais promissores para agência; é julgamento relativo de 2025, sem ranking atual nem prontidão presumida de um estabelecimento.

**communication_opportunity** — `7cab6fa4-48a8-5b19-ba39-d47a7696c799`

Antes: Explorar informação clara de cardápio, horários, localização e canais de pedido; diferenciação por experiência ou atendimento só quando confirmada.

Depois: Fonte histórica: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Hipótese estratégica: separar objetivos de ocupação em horários ociosos, pedidos por delivery e recompra; combinar descoberta local, apresentação real de pratos e experiência e relacionamento/fidelização quando disponíveis. Qualificar margem, capacidade, reputação e estrutura comercial antes de propor mídia, sobretudo entre operações médias/maiores. Cozinha, cardápio, entrega, promoções e diferenciais são fatos do cliente a confirmar; não presumir verba pela receita setorial.

### Escolas de idiomas

**market_overview** — `82bd24ff-c163-5e00-9e57-2dfebbdcc946`

Antes: O acervo trata de aprendizagem de idiomas e concorrência entre escolas e franquias.

Depois: Fonte histórica: Educação.pdf, p.1, 2025-06-25; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro estima cerca de 6 milhões de pessoas por ano buscando cursos, ticket de R$200–600 e margem de 20–30%. O ano da demanda e a unidade temporal do ticket não são especificados. Redes e franquias tornam o mercado competitivo; continuidade do aprendizado sustenta relacionamentos mais longos, mas não comprova retenção de uma escola particular.

**digital_maturity** — `88f98569-18c8-5359-a710-364c84e38785`

Antes: O quadro histórico cita investimento em divulgação digital por parte das redes.

Depois: Fonte histórica: Educação.pdf, p.1, 2025-06-25; conteúdo sem validação independente. Maturidade alta: redes e franquias já trabalham o digital e o autor destaca orçamento recorrente de divulgação. A classificação como segundo nicho mais atraente é julgamento comercial de 2025, não ranking atual nem garantia de verba para toda escola. A disputa envolve captação e diferenciação entre ofertas percebidas como semelhantes.

**communication_opportunity** — `4cfd6b6c-d2da-5b11-ba3e-b329b0b3bd9b`

Antes: Comunicar modalidades e objetivos de aprendizagem confirmados; método, certificação e evolução individual exigem comprovação.

Depois: Fonte histórica: Educação.pdf, p.1, 2025-06-25; conteúdo sem validação independente. Hipótese estratégica: segmentar por objetivo de aprendizagem e público efetivamente atendido, esclarecer modalidade, método e percurso real e melhorar a passagem do interesse à conversa de matrícula. Qualificar independentes e franquias separadamente, considerando autonomia local de marketing. Método exclusivo, certificação, prazo de fluência, preços e resultados de alunos exigem prova; não presumir esses atributos.

### Hotéis

**market_overview** — `70b558c9-f80f-570e-9249-080f7498b2a9`

Antes: A pesquisa distingue distribuição por intermediários e reservas diretas; a retomada econômica descrita pertence ao período histórico.

Depois: Fonte histórica: Hotelaria e Turismo.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro cita cerca de 10,6 mil hotéis e mercado brasileiro de US$8,6 bilhões em 2023. RevPAR teria subido 40% em 2023 frente a 2022; é receita por quarto disponível, distinta de ocupação ou diária média. A diária de R$390 refere-se a 2023 e varia por categoria. GOP de aproximadamente 37% da receita em 2022 é resultado operacional bruto, não margem líquida. A faixa operacional de 30–40% e a previsão de alta de 27% em investimentos, sem horizonte explícito, são referências do acervo, sem comprovação para um hotel específico.

**digital_maturity** — `0d77c61d-a9ad-591e-b9ff-1fb8e4175060`

Antes: O acervo de 2025 cita portais de reserva, site, busca e redes, com adoção desigual.

Depois: Fonte histórica: Hotelaria e Turismo.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Maturidade moderada e heterogênea: redes maiores já exploram IA; pequenos hotéis ainda digitalizam. Booking e outras OTAs, site próprio, SEO/SEM/Google, redes e e-mail compõem a distribuição. A indicação de marketing em torno de 4–5% ou mais da receita nas operações médias/grandes é histórica e não prova orçamento individual. Reservas diretas e dependência de intermediários têm custos diferentes. Na comparação do PDF, o autor prioriza hotéis e motéis frente a agências de turismo; é julgamento comercial relativo de 2025, sem ranking atual ou capacidade de contratação individual comprovada.

**communication_opportunity** — `59929fbb-3a71-5f7f-b48c-35987fc0f6be`

Antes: Esclarecer acomodação, localização e condições reais de reserva; reservas diretas e experiência são possibilidades condicionais.

Depois: Fonte histórica: Hotelaria e Turismo.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Hipótese estratégica: qualificar categoria, sazonalidade, canais e capacidade; melhorar apresentação e conversão do canal direto, relacionamento e distribuição para reduzir dependência de comissões quando isso for viável. Diferenciar localização, estrutura e experiência comprovadas, respeitando autonomia e parceiros de redes versus independentes. Não presumir ocupação, tarifa, verba, comodidades ou economia garantida com reservas diretas.

### Oficinas mecânicas

**market_overview** — `b0724fb5-d94d-562a-9b6c-f5911ae94203`

Antes: O material trata de manutenção automotiva e recorrência, sem validar quantidade ou margens atuais.

Depois: Fonte histórica: Veículos e Transportes.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro estima aproximadamente 121 mil oficinas no Brasil, predominantemente pequenas, e R$128 bilhões anuais em gastos de manutenção, sem período próprio para essas medidas. Ticket médio de R$570 por atendimento e margem líquida de 5–10% mostram que volume e múltiplos serviços ao longo da vida do veículo importam. O tamanho nacional do mercado não demonstra faturamento nem verba de uma oficina.

**digital_maturity** — `f5080911-1037-5a66-a525-59628cd57241`

Antes: A pesquisa histórica menciona descoberta local e redes em parte das oficinas.

Depois: Fonte histórica: Veículos e Transportes.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Maturidade baixa: Google Meu Negócio e redes sociais aparecem, mas investimento formal em anúncios e SEO é limitado. A conclusão situa oficinas entre negócios menores, com restrição de orçamento e menor prontidão para agência que concessionárias/redes, apesar da oportunidade de profissionalização.

**communication_opportunity** — `5c2f7566-2a04-5fb1-baa2-c6797cf62b1a`

Antes: Esclarecer serviços e agendamento confirmados; capacidade técnica, prazo e diagnóstico não podem ser presumidos.

Depois: Fonte histórica: Veículos e Transportes.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Hipótese estratégica: fortalecer descoberta local e informação sobre serviços reais, facilitar consulta/agendamento e relacionamento para manutenção recorrente, com ações focalizadas compatíveis com margem e capacidade. Diferenciar especialização, equipe e atendimento comprovados. Não presumir diagnóstico, marcas atendidas, certificação, prazos ou garantia; avaliar retorno com dados reais, sem prometer resultado.

## Conferência dos 60 nichos

Cada linha registra a recuperação no panorama e na leitura de marketing.
A oportunidade em cada pesquisa traduz essa combinação em hipótese condicionada
à capacidade e aos atributos confirmados do cliente; os textos integrais, anteriores
e corrigidos, são recuperáveis no SQL por ID.

| Nicho | Recuperação comercial | Maturidade/prontidão recuperada | Decisão |
| --- | --- | --- | --- |
| Academias de artes marciais | O quadro descreve milhares de escolas, interesse associado ao MMA/UFC e ampliação de públicos, incluindo mulheres, crianças e iniciantes. | Maturidade baixa: indicação e reputação do instrutor predominam; Instagram/Facebook mostram treinos e conquistas, com grupos comunitários e pouca mídia. | Corrigir conteúdo; preservar limitações. |
| Academias de ginástica | O quadro estima cerca de 60 mil academias, R$20 bilhões/ano e frequência de 5% da população, sem períodos próprios para essas medidas; cita crescimento de 13–14% ao ano sem série. | Maturidade moderada: o quadro menciona 40% investindo até R$1 mil/mês em digital, sem base/período definidos. | Corrigir conteúdo; preservar limitações. |
| Agências de turismo | O quadro cita cerca de 50 mil cadastros, sem período próprio, e distingue R$13,5 bilhões do turismo corporativo em 2023 de R$19,2 bilhões das operadoras de lazer em 2023: são recortes de mercado diferentes. | Maturidade média: PMEs têm lacunas de presença online; SEO, Google Ads, Facebook/Instagram, WhatsApp, blogs e influenciadores apoiam conteúdo/ofertas. | Corrigir conteúdo; preservar limitações. |
| Aluguel de roupas | O quadro de julho de 2025 indica locação de R$150 a R$3.000 ou mais, margem líquida de 30–60% e procura fortemente sazonal. | Maturidade alta em contatos e apresentação visual e abertura alta a agência no quadro. | Corrigir conteúdo; preservar limitações. |
| Boxes de CrossFit | O quadro estima 900–1.000 boxes e crescimento de 5.900% entre 2013 e 2019; relata estabilização ou retração moderada após a pandemia, de modo que a expansão antiga não é tendência atual demonstrada. | Maturidade moderada/alta: Instagram/Facebook com WODs, vídeos e depoimentos, Google/Meta para aulas experimentais e grupos de WhatsApp/desafios para retenção. | Corrigir conteúdo; preservar limitações. |
| Cafeterias | O quadro associa cafeterias ao crescimento da cultura de cafés premium entre jovens. | Maturidade alta em marca e Instagram orgânico, com mídia paga ainda pouco explorada nas pequenas operações. | Corrigir conteúdo; preservar limitações. |
| Clínica Estética | O quadro de estética registra crescimento de 13,2% do setor de beleza em 2022 e cita aproximadamente 1,5 milhão de procedimentos por ano, sem delimitar com precisão o período desse volume. | Adoção alta no quadro, com redes sociais, anúncios segmentados e influenciadores. | Corrigir conteúdo; preservar limitações. |
| Clínicas médicas | O quadro atribui ao atendimento privado crescimento de 40% em cinco anos após a pandemia, sem fixar o início e o fim da série. | Maturidade média no quadro, com sites e marketing já presentes. | Corrigir conteúdo; preservar limitações. |
| Concessionárias de carros | O quadro descreve 4,1–4,5 milhões de veículos/ano, cerca de 8.010 lojas e crescimento superior a 10% ao ano, sem individualizar períodos/série dessas referências. | Maturidade alta: sites robustos, CRM integrado e investimento em Google e redes sociais para anúncios. | Corrigir conteúdo; preservar limitações. |
| Concessionárias de lanchas | O quadro registra 4,5 mil embarcações em 2020 e faturamento setorial de R$2 bilhões em 2021; dobrar volume e chegar a R$4 bilhões em 2025 são projeções históricas, sem confirmação de realização. | Maturidade média: sites especializados, eventos náuticos e anúncios Google/Meta para público de lazer coexistem com atendimento personalizado. | Corrigir conteúdo; preservar limitações. |
| Confeitarias | O quadro situa a confeitaria dentro da panificação: participação de cerca de 16% na receita e bolos estimados em R$15 bilhões/ano, sem período individualizado. | Maturidade alta no quadro, apoiada em apelo visual, Instagram, WhatsApp e indicação online. | Corrigir conteúdo; preservar limitações. |
| Construtoras e incorporadoras | O quadro registra crescimento de 4,3% no PIB da construção em 2024, cerca de 400 mil unidades novas vendidas nesse ano e alta de 43% nas vendas do Minha Casa Minha Vida. | Maturidade alta: campanhas combinam Google, social, portais e CRM, com contratação frequente de agências e marketing ligado à venda de empreendimentos. | Corrigir conteúdo; preservar limitações. |
| Consultorias empresariais | O quadro estima 161 mil empresas e US$14,4 bilhões de mercado em 2021, com crescimento de 14% naquele ano. | Maturidade moderada, em rápida evolução: newsletters em 60% das consultorias full-service; autônomos representam 83% do mercado e muitos dependem de networking offline. Bases/períodos não individualizados. | Corrigir conteúdo; preservar limitações. |
| Consultório médico | O quadro menciona aproximadamente 500 mil médicos e expansão de clínicas populares. | Maturidade média/alta no quadro: sites, SEO e anúncios aparecem em especialidades com competição por pacientes particulares. | Corrigir conteúdo; preservar limitações. |
| Corretor Imóveis | O quadro cita mais de 630 mil corretores em 2024, aumento de 23% frente a 2023 e alta de 15% nas vendas de imóveis em 2024. | Maturidade muito alta: portais, Google Ads, Facebook/Instagram e WhatsApp; o quadro cita 85% valorizando resposta rápida no WhatsApp, sem base/período próprios. | Corrigir conteúdo; preservar limitações. |
| Cursos preparatórios | O quadro descreve demanda média/alta, porém cíclica, vinculada a vestibulares e concursos; aponta ticket de R$400–2.000 e margem de 15–25%, sem unidade temporal ou período próprios. | Maturidade muito alta: o documento associa cada ciclo de matrícula a forte dependência de marketing e urgência comercial. | Corrigir conteúdo; preservar limitações. |
| Empresas de energia solar | O quadro registra alta de 41% na capacidade instalada em 2023, cerca de 800 mil instalações e 3,7 mil novos entrantes em 2024. | Maturidade alta: Google Ads, SEO, redes sociais, conteúdo e anúncios segmentados já geram contatos, com agências especializadas. | Corrigir conteúdo; preservar limitações. |
| Empresas de engenharia | O quadro cita cerca de 139 mil empresas de serviços de engenharia, sem período próprio, em mercado B2B pulverizado associado a obras e infraestrutura. | Maturidade baixa: networking e licitações predominam; sites institucionais e LinkedIn têm mais presença que marketing ativo. | Corrigir conteúdo; preservar limitações. |
| Empresas de mudanças | O quadro associa procura à mobilidade urbana e descreve mercado pulverizado, de pequenos a grandes prestadores, sem estatísticas consolidadas. | Maturidade baixa/média: indicação e panfletagem predominam; parte das empresas usa site básico e Google Ads local. | Corrigir conteúdo; preservar limitações. |
| Escolas de educação básica | O quadro reúne colégios de ensino fundamental e médio, com milhares de instituições, ticket de R$500–1.200 e margem de 10–20%, sem período próprio nem unidade temporal explícita do ticket. | Adoção digital crescente e desigual no quadro: muitas escolas investem, mas a maturidade não é uniforme. | Corrigir conteúdo; preservar limitações. |
| Escolas de idiomas | O quadro estima cerca de 6 milhões de pessoas por ano buscando cursos, ticket de R$200–600 e margem de 20–30%. | Maturidade alta: redes e franquias já trabalham o digital e o autor destaca orçamento recorrente de divulgação. | Corrigir conteúdo; preservar limitações. |
| Escolas de música | O quadro descreve público diverso e demanda média, com caráter de nicho local, ticket de R$200–400 e margem de 15–25%. | Maturidade baixa/média, com exploração apenas parcial do digital. | Corrigir conteúdo; preservar limitações. |
| Escolas de natação | O quadro descreve demanda local média, ticket de R$150–300 e margem de 12–20%, sem período próprio ou unidade temporal definida. | Maturidade baixa/média: parte das escolas está começando no digital. | Corrigir conteúdo; preservar limitações. |
| Escritórios de advocacia | O quadro descreve aproximadamente 1,3 milhão de advogados e 72% em atuação individual, sem período próprio, em mercado fragmentado e competitivo. | Maturidade heterogênea: LinkedIn, Instagram, artigos, e-books e newsletters apoiam reputação; grandes escritórios usam também blogs e vídeos, com equipe ou agência especializada. | Corrigir conteúdo; preservar limitações. |
| Escritórios de arquitetura | O quadro cita cerca de 212 mil profissionais registrados no CAU e 64% autônomos, sem período próprio; associa a procura à construção e a vendas imobiliárias com alta de 15% em 2024. | Maturidade moderada/alta em portfólio: Instagram, Pinterest, sites, fotos, tours virtuais e busca local/Google Ads. | Corrigir conteúdo; preservar limitações. |
| Escritórios de assessoria de investimentos | O quadro registra cerca de 17 mil assessores em 2021, triplicação em quatro anos e aproximadamente 1.100 escritórios, sem período próprio para esta contagem. | Maturidade alta e em evolução: equipes internas, conteúdo educativo, LinkedIn, inbound e eventos online apoiam aquisição além da cidade. | Corrigir conteúdo; preservar limitações. |
| Escritórios de contabilidade | O quadro cita aproximadamente 71,6 mil escritórios e cerca de 20 mil fechamentos em 2023, sugerindo consolidação, ao lado de relatos de crescimento de 15–30% ao ano sem série uniforme. | Maturidade moderada e desigual: o quadro menciona 53% sem estratégia, 65% no Instagram e 55% no WhatsApp, sem base/período próprios. | Corrigir conteúdo; preservar limitações. |
| Fabricantes de materiais de construção | O quadro registra alta de 5,8% no faturamento da indústria em 2024 e de 5,5% na produção de insumos, após quedas anteriores. | Maturidade moderada, voltada a marca e B2B: campanhas institucionais, conteúdo técnico, programas digitais de fidelidade, redes sociais e YouTube para demonstrar produtos. | Corrigir conteúdo; preservar limitações. |
| Faculdades | O quadro de ensino superior privado descreve demanda de milhões de alunos, tickets de R$800–2.500, excluindo medicina dessa referência, e margem líquida de 10–20%. | Maturidade muito alta: inbound, anúncios e CRM já fazem parte da captação. | Corrigir conteúdo; preservar limitações. |
| Farmácias | O quadro cita cerca de 92 mil farmácias e R$199 bilhões de mercado, sem ano individualizado; crescimento de 8–11% ao ano também não vem acompanhado de série. | Maturidade desigual: redes têm canais digitais avançados, enquanto independentes usam Google Maps e posts básicos, com pouca mídia; delivery e aplicativos aparecem em estágio inicial nessas operações. | Corrigir conteúdo; preservar limitações. |
| Fisioterapia | O quadro relaciona demanda ao envelhecimento e à reabilitação após a Covid e cita cerca de 240 mil profissionais, sem período próprio para essa contagem. | Maturidade baixa/moderada: indicações e parcerias têm peso, redes sociais são mais informativas e poucos negócios investem em anúncios. | Corrigir conteúdo; preservar limitações. |
| Harmonização Facial | O quadro descreve procura de adultos jovens, combos de R$3–5 mil, insumos caros e recorrência potencial de reaplicação semestral. | Maturidade muito alta no quadro, com Instagram, vídeos virais, fotos e anúncios segmentados. | Corrigir conteúdo; preservar limitações. |
| Hospitais | O quadro aponta aproximadamente 7.500 hospitais, dos quais 63% privados, sem ano individualizado para essas contagens. | Maturidade média no quadro; hospitais grandes já contam com marketing estruturado, voltado a reputação, marca e facilitação de agendamento. | Corrigir conteúdo; preservar limitações. |
| Hotéis | O quadro cita cerca de 10,6 mil hotéis e mercado brasileiro de US$8,6 bilhões em 2023. | Maturidade moderada e heterogênea: redes maiores já exploram IA; pequenos hotéis ainda digitalizam. | Corrigir conteúdo; preservar limitações. |
| Imobiliárias | O quadro estima 70 mil imobiliárias e crescimento de vendas de 20–30% ao ano em 2023–24. | Maturidade moderada/crescente: portais, redes sociais e Google/Meta Ads, com lacunas em análise de dados e organização comercial. | Corrigir conteúdo; preservar limitações. |
| Joalherias | O quadro de julho de 2025 cita ticket de R$500 a R$10.000 ou mais, margem líquida de 20–40% e crescimento de 5%, sem período próprio ou método da taxa. | Maturidade alta em marca/luxo e abertura alta a agência no quadro. | Corrigir conteúdo; preservar limitações. |
| Lojas de baterias automotivas | O quadro de julho de 2025 descreve mercado estável, ticket de R$300–800 e margem líquida de 15–25%, sem período próprio ou método. | Maturidade baixa/média e abertura crescente a agência no quadro. | Corrigir conteúdo; preservar limitações. |
| Lojas de calçados | O quadro de julho de 2025 cita ticket de R$80–300, margem líquida de 10–25% e crescimento de 2,6%, sem período próprio ou método da taxa. | Maturidade média, com orientação visual/social, e abertura média a agência. | Corrigir conteúdo; preservar limitações. |
| Lojas de cama mesa e banho | O quadro de julho de 2025 apresenta ticket de R$100–300, margem líquida de 10–20% e crescimento de 3–5%, sem período próprio ou método da taxa. | Maturidade e abertura a agência médias/altas no quadro. | Corrigir conteúdo; preservar limitações. |
| Lojas de colchões | O quadro de julho de 2025 indica ticket de R$800–3.000, margem líquida de 10–25% e crescimento de 5,1%, sem período próprio ou método da taxa. | Maturidade média/alta, orientada à geração de contatos, e boa abertura a agência. | Corrigir conteúdo; preservar limitações. |
| Lojas de cosméticos e perfumes | O quadro cita mercado de R$124 bilhões em 2021, crescimento de maquiagem de 26% em 2024 e projeção de cerca de 5% ao ano até 2026, sem comprovação de realização. | Maturidade alta: branding, influenciadores e canais online/offline integrados são centrais. | Corrigir conteúdo; preservar limitações. |
| Lojas de iluminação | O quadro situa iluminação como parte de materiais elétricos, sem estimativa própria de tamanho, e cita alta de cerca de 20% em volume em 2024. | Maturidade moderada e heterogênea, com presença online em crescimento. | Corrigir conteúdo; preservar limitações. |
| Lojas de informática | O quadro de julho de 2025 descreve mercado estável, ticket de R$250–800 e margem líquida de 8–15%. | Maturidade média, focada em busca, e abertura média a agência. | Corrigir conteúdo; preservar limitações. |
| Lojas de materiais de construção | O quadro descreve cerca de 150 mil lojas e R$223 bilhões de faturamento em 2023, após retração, com retomada de 4–5% nas vendas em 2024. | Maturidade baixa/emergente entre lojas pequenas e médias: Facebook/Instagram, WhatsApp, Google Meu Negócio, marketplaces e anúncios regionais começam a ser usados. | Corrigir conteúdo; preservar limitações. |
| Lojas de móveis | O quadro estima R$100 bilhões de mercado em 2022 e crescimento de 4–5% em 2024. | Maturidade moderada, com início de migração para e-commerce e dependência da visita física. | Corrigir conteúdo; preservar limitações. |
| Lojas de pneus | O quadro cita cerca de 56 milhões de pneus/ano em 2022 e mercado maduro/estável com revendas e redes. | Maturidade alta nas redes, com e-commerce e anúncios intensivos; o acervo cita Pneu Store/Cantu como exemplo histórico. | Corrigir conteúdo; preservar limitações. |
| Lojas de roupa | O quadro cita mercado de R$265,8 bilhões em 2022, crescimento de aproximadamente 5% ao ano em 2023–24 e ticket de R$100–150. | Maturidade moderada/alta, com forte presença visual em redes sociais. | Corrigir conteúdo; preservar limitações. |
| Lojas de utilidades domésticas | O quadro de julho de 2025 cita ticket de R$30–70, margem líquida de 6–12% e crescimento de 3–5%, sem período próprio ou método. | Maturidade e abertura a agência baixas/médias. | Corrigir conteúdo; preservar limitações. |
| Motéis | O quadro descreve cerca de 5 mil motéis, R$4 bilhões anuais e 100 milhões de atendimentos/ano, sem períodos próprios. | Maturidade baixa/média: Instagram/Facebook, Guia de Motéis, Google local, parcerias, promoções e CRM começam a profissionalizar divulgação e relacionamento. | Corrigir conteúdo; preservar limitações. |
| Móveis planejados | O quadro descreve projetos sob medida de ticket muito alto, sem valor monetário único, como parcela do setor de móveis. | Maturidade moderada: anúncios e redes sociais geram contatos; a conclusão cita Google, Instagram e blogs de decoração, com lacunas de exploração digital entre concorrentes. | Corrigir conteúdo; preservar limitações. |
| Nutricionistas | O quadro associa a procura à prevenção e ao público fitness e descreve cerca de 200 mil profissionais, com aumento de 22% em três anos; o fim dessa janela não é informado. | Maturidade moderada no quadro: Instagram orgânico e conteúdo educativo predominam, com pouco investimento em anúncios. | Corrigir conteúdo; preservar limitações. |
| Odontologia | O quadro cita mais de 400 mil dentistas e mercado de R$38 bilhões/ano, sem período específico dessas medidas; menciona crescimento de 13% ao ano na estética sem fixar a série. | Maturidade muito alta: anúncios para implantes e facetas, conteúdo social e muitas agências especializadas. | Corrigir conteúdo; preservar limitações. |
| Oficinas mecânicas | O quadro estima aproximadamente 121 mil oficinas no Brasil, predominantemente pequenas, e R$128 bilhões anuais em gastos de manutenção, sem período próprio para essas medidas. | Maturidade baixa: Google Meu Negócio e redes sociais aparecem, mas investimento formal em anúncios e SEO é limitado. | Corrigir conteúdo; preservar limitações. |
| Óticas | O quadro de julho de 2025 indica ticket de R$300–800, margem líquida de 12–20% e crescimento de 8%, sem período próprio ou método para a taxa. | Maturidade média/alta e abertura média/alta a agência no quadro; o autor considera que o setor já reconhece valor no digital. | Corrigir conteúdo; preservar limitações. |
| Padarias | O quadro cita aproximadamente 70 mil padarias, R$153 bilhões de faturamento em 2024 e 1 milhão de empregos, este sem período próprio. | Maturidade moderada: adoção de redes e aplicativos ainda em aprendizado. | Corrigir conteúdo; preservar limitações. |
| Pet shops | O quadro cita R$75,4 bilhões de mercado em 2024 e crescimento de cerca de 10% nesse ano. | Maturidade moderada: engajamento orgânico forte, com e-commerce e anúncios segmentados em adoção. | Corrigir conteúdo; preservar limitações. |
| Restaurantes e bares | O quadro registra cerca de 300 mil estabelecimentos, faturamento setorial de R$416 bilhões em 2023 e aproximadamente 4,94 milhões de empregos, sem período próprio para a contagem de empregos. | Adoção alta no quadro; o percentual de 46% que priorizaria marketing não tem base e período individualizados. | Corrigir conteúdo; preservar limitações. |
| Salões de beleza | O quadro situa os salões em um universo de aproximadamente 1,33 milhão de negócios de beleza, que não deve ser confundido com número exclusivo de salões. | Maturidade moderada: Instagram como portfólio, WhatsApp para relacionamento e retenção e uso limitado de mídia paga entre pequenos negócios. | Corrigir conteúdo; preservar limitações. |
| Spas | O quadro estima o mercado brasileiro em US$680 milhões e menciona crescimento global de 9% ao ano, sem informar períodos próprios; a taxa global não descreve o Brasil. | Maturidade moderada: Instagram, influenciadores e parcerias apoiam marca e experiência; spas de luxo investem mais. | Corrigir conteúdo; preservar limitações. |
| Supermercados | O quadro cita aproximadamente 90 mil estabelecimentos, R$1 trilhão de faturamento em 2024, 3 milhões de empregos e participação de 9% no PIB, com período próprio não explicitado para as duas últimas medidas. | Maturidade baixa/média nas operações tradicionais, com WhatsApp, entrega e aplicativos em adoção desigual; grandes redes têm outra estrutura. | Corrigir conteúdo; preservar limitações. |

## Comparações históricas e denominadores

Os rankings são julgamentos comerciais relativos dos autores em 2025, sem validação
independente: Educação coloca Faculdades em Top 1, Idiomas em Top 2 e Cursinhos em
Top 3; Alimentação prioriza Restaurantes/Bares entre seus cinco nichos; Hotelaria
prioriza Hotéis e Motéis frente a Agências de Turismo; Veículos prioriza
Concessionárias de carros e Lojas de pneus, seguidas por Concessionárias de lanchas.
Essas posições foram mantidas como opinião histórica do acervo, sem atualidade,
garantia de retorno ou atribuição de orçamento/prontidão ao cliente.

Em Consultorias, 60% se refere às full-service que enviam newsletters; 83% é a
participação dos autônomos no mercado. O PDF afirma apenas que muitos autônomos
dependem de networking offline, sem atribuir a essa dependência o percentual de 83%.

## Ambiguidades preservadas e lacunas reais do PB-B

- Lojas de roupa: o PDF mistura coluna de margem líquida com anotação de margem bruta; não se afirmou lucro líquido dessa faixa.
- Lojas de pneus: unidade `R$1–3 mi` inconsistente para um jogo; não se corrigiu para mil nem se usou como ticket.
- Hotéis: GOP é operacional bruto; RevPAR é receita por quarto disponível. Nenhum foi convertido em margem líquida ou ocupação.
- Confeitarias: 83% atende por encomenda, não 83% do faturamento; café de R$36 bi é setor de café, não apenas cafeterias.
- Turismo: volumes corporativo e de operadoras de lazer são recortes diferentes; venda de pacote não equivale à receita retida.
- Comissões de assessores/corretores e contas de valor vitalício são receita bruta/cenários, não lucro nem rendimento garantido.
- Crescimentos futuros citados para 2025, 2026 ou 2036 permanecem projeções históricas sem confirmação de realização.
- PB-B: buscar fontes primárias, fixar períodos/base/metodologia ausentes, resolver unidades contraditórias e aferir tendências, canais, preços e maturidade atuais/localizados.
- Permanecem as lacunas de oito nichos novos sem pesquisa específica e quatro rótulos ambíguos já registradas no inventário. Não foram preenchidas por analogia.
- Oferta, orçamento, capacidade, prova de resultados e características da empresa dependem de confirmação particular; integração conversacional pertence ao D15B.

## Escrita e leitura

A transação exige o estado anterior exato dos 243 itens e 60 pesquisas, fingerprints
integrais do catálogo/pesquisas e de todos os 622 itens, bloqueia concorrência na gravação
e verifica 183 alterações, preservação dos demais 439 itens e de todos os campos protegidos.
O histórico de revisão fica neste delta Git/PR; timestamps existentes são preservados
intencionalmente com IDs, vínculos, chaves, ordem, prioridades e estados.
A consulta separada usa o `service_role` já autorizado, após COMMIT, comparando textos/notas
e invariantes. O recibo no PR registra execução, hashes e resultado efetivo; este relatório
descreve o conteúdo e o protocolo, sem substituir a prova da gravação.
