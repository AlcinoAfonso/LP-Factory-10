-- E10.13 / PB-A D21: lote operacional pontual, aditivo e fechado; não é migration.
-- V1/V2: mensagens dos commits b4ba0ec0 / 47114670; inventário e10_13_source_inventory.csv.
-- Projeto único dpikmjgiteuafsbaubue; execução operacional postgres via conector geral.
-- Revisar o HEAD e provar em transação com ROLLBACK antes da carga autorizada.
-- Não executar pelo pipeline-supabase-inspect/ai_readonly; não ampliar permissões.
-- Reexecução/colisão falha fechada: reinspecionar; nunca alterar registro existente.
-- Fonte primária dos textos: 10 pesquisas PDF históricas do acervo do titular (2025).
-- Nenhum indicador numérico não validado ingressa como fato atual; lacunas constam no inventário.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '45s';

do $d21$
declare
  payload jsonb := $payload${
  "case": "D21/PB-A/E10.13",
  "source_v1_commit": "b4ba0ec09450a500a6858595f901711d8485415d",
  "source_v2_commit": "47114670c3e11ef5bc4474c6a06d844ac93d1228",
  "baseline_taxons": [
    {
      "id": "3c69df0b-fd72-4b13-bc91-89388d6ef19c",
      "name": "Clínica Estética",
      "slug": "clinica-estetica",
      "level": "niche",
      "is_active": true,
      "parent_id": "9a6b1cf4-2871-4bbe-a6ae-ff445c0d5d54"
    },
    {
      "id": "45d2b485-102c-42c0-b059-876919c9c10a",
      "name": "Consultório médico",
      "slug": "consultorio-medico",
      "level": "niche",
      "is_active": true,
      "parent_id": "9a6b1cf4-2871-4bbe-a6ae-ff445c0d5d54"
    },
    {
      "id": "c7952d16-678c-4615-9483-a003e57d94aa",
      "name": "Corretor Imóveis",
      "slug": "corretor-imoveis",
      "level": "niche",
      "is_active": true,
      "parent_id": "f9ba36cd-fcd9-478b-9823-c2f003cf037a"
    },
    {
      "id": "5662f9ff-0e2f-4190-a288-ef8348c4d7b5",
      "name": "Harmonização Facial",
      "slug": "harmonizacao-facial",
      "level": "niche",
      "is_active": true,
      "parent_id": "9a6b1cf4-2871-4bbe-a6ae-ff445c0d5d54"
    },
    {
      "id": "51b0d440-b54c-450b-b0cf-c8f949f1b8c6",
      "name": "Odontologia",
      "slug": "odontologia",
      "level": "niche",
      "is_active": true,
      "parent_id": "9a6b1cf4-2871-4bbe-a6ae-ff445c0d5d54"
    },
    {
      "id": "1eea070c-a120-46e2-aa85-21be37786728",
      "name": "QA E22.7 20261001 — nicho",
      "slug": "qa-e22-7-20261001-nicho",
      "level": "niche",
      "is_active": false,
      "parent_id": "832eecec-e6f7-49a6-9faa-a54d9ffdbce4"
    },
    {
      "id": "a6bdb959-dff5-4459-b31a-5b4c6576e376",
      "name": "SaaS de landing pages e conversão",
      "slug": "saas-de-landing-pages-e-conversao",
      "level": "niche",
      "is_active": true,
      "parent_id": "1e7bf977-8704-44e7-bf9d-d1c54f891965"
    },
    {
      "id": "f9ba36cd-fcd9-478b-9823-c2f003cf037a",
      "name": "Imobiliário",
      "slug": "imobiliario",
      "level": "segment",
      "is_active": true,
      "parent_id": null
    },
    {
      "id": "1e7bf977-8704-44e7-bf9d-d1c54f891965",
      "name": "Marketing digital",
      "slug": "marketing-digital",
      "level": "segment",
      "is_active": true,
      "parent_id": null
    },
    {
      "id": "e1348a3f-1a06-4315-a945-2f954459b36e",
      "name": "QA E20.6 20260913 0059",
      "slug": "qa-e20-6-20260913-0059",
      "level": "segment",
      "is_active": true,
      "parent_id": null
    },
    {
      "id": "832eecec-e6f7-49a6-9faa-a54d9ffdbce4",
      "name": "QA E22.7 20261001 — segmento",
      "slug": "qa-e22-7-20261001-segmento",
      "level": "segment",
      "is_active": false,
      "parent_id": null
    },
    {
      "id": "9a6b1cf4-2871-4bbe-a6ae-ff445c0d5d54",
      "name": "Saúde e Bem Estar",
      "slug": "saude-e-bem-estar",
      "level": "segment",
      "is_active": true,
      "parent_id": null
    },
    {
      "id": "9ecb10e8-0274-4200-b3d1-8c45f7cc7ad3",
      "name": "Serviços Profissionais",
      "slug": "servicos-profissionais",
      "level": "segment",
      "is_active": true,
      "parent_id": null
    },
    {
      "id": "a8e986cc-070f-4ab4-9857-e6b1ce9fdb75",
      "name": "Corretor de imóveis de médio padrão",
      "slug": "corretor-de-imoveis-de-medio-padrao",
      "level": "ultra_niche",
      "is_active": true,
      "parent_id": "c7952d16-678c-4615-9483-a003e57d94aa"
    },
    {
      "id": "3854d22f-5fd2-4a60-80e8-2f17cf79a497",
      "name": "Implante dentário",
      "slug": "implante-dentario",
      "level": "ultra_niche",
      "is_active": true,
      "parent_id": "51b0d440-b54c-450b-b0cf-c8f949f1b8c6"
    }
  ],
  "baseline_aliases": {
    "count": 22,
    "fingerprint": "a8c65dff27bb6ac8e6aa7c931e5c60a2"
  },
  "taxons": [
    {
      "id": "33a81e27-46f8-54dc-9958-a85bb3c0a15a",
      "name": "Alimentação e Gastronomia",
      "slug": "alimentacao-e-gastronomia",
      "level": "segment",
      "parent_slug": null
    },
    {
      "id": "27f80adc-57bf-52b9-a049-eb6b5f2a243d",
      "name": "Construção",
      "slug": "construcao",
      "level": "segment",
      "parent_slug": null
    },
    {
      "id": "f39b8979-bbf7-5a57-970f-85d908893b03",
      "name": "Educação",
      "slug": "educacao",
      "level": "segment",
      "parent_slug": null
    },
    {
      "id": "76575571-85b0-5ad0-83ac-156add56a859",
      "name": "Fitness e Esportes",
      "slug": "fitness-e-esportes",
      "level": "segment",
      "parent_slug": null
    },
    {
      "id": "bb47f9a1-e701-57a5-8921-e206ace45f28",
      "name": "Hotelaria e Turismo",
      "slug": "hotelaria-e-turismo",
      "level": "segment",
      "parent_slug": null
    },
    {
      "id": "e8c63e31-61e0-58f3-babd-a346d247df6f",
      "name": "Manutenção e Serviços Gerais",
      "slug": "manutencao-e-servicos-gerais",
      "level": "segment",
      "parent_slug": null
    },
    {
      "id": "8d06b984-6d65-5b57-a9da-818ee94801bb",
      "name": "Tecnologia e Comunicação",
      "slug": "tecnologia-e-comunicacao",
      "level": "segment",
      "parent_slug": null
    },
    {
      "id": "b31d4fc4-8344-51cc-9240-ccb273d2536e",
      "name": "Varejo e Comércio Local",
      "slug": "varejo-e-comercio-local",
      "level": "segment",
      "parent_slug": null
    },
    {
      "id": "4edaf680-fb0f-5258-b627-72e960670b52",
      "name": "Veículos e Transportes",
      "slug": "veiculos-e-transportes",
      "level": "segment",
      "parent_slug": null
    },
    {
      "id": "30dd39d5-cd6d-507a-86e4-2f62f6b2e0c2",
      "name": "Academias de artes marciais",
      "slug": "academias-de-artes-marciais",
      "level": "niche",
      "parent_slug": "fitness-e-esportes"
    },
    {
      "id": "53dbf586-b97b-5c5f-a55c-a3dd1d0a373d",
      "name": "Academias de ginástica",
      "slug": "academias-de-ginastica",
      "level": "niche",
      "parent_slug": "fitness-e-esportes"
    },
    {
      "id": "59d140cd-d71f-5f25-b987-d71db6f20d1d",
      "name": "Agências de turismo",
      "slug": "agencias-de-turismo",
      "level": "niche",
      "parent_slug": "hotelaria-e-turismo"
    },
    {
      "id": "0aa3ec7c-b375-56b6-a610-a43d2cf4eb49",
      "name": "Aluguel de roupas",
      "slug": "aluguel-de-roupas",
      "level": "niche",
      "parent_slug": "varejo-e-comercio-local"
    },
    {
      "id": "a14b9993-0752-59d2-862d-c5d85d3e82d7",
      "name": "Boxes de CrossFit",
      "slug": "boxes-de-crossfit",
      "level": "niche",
      "parent_slug": "fitness-e-esportes"
    },
    {
      "id": "250af70b-7298-583e-913c-7c6b0eb1540b",
      "name": "Cafeterias",
      "slug": "cafeterias",
      "level": "niche",
      "parent_slug": "alimentacao-e-gastronomia"
    },
    {
      "id": "2a2fe08f-7012-5927-ae31-7cece585c03d",
      "name": "Clínicas médicas",
      "slug": "clinicas-medicas",
      "level": "niche",
      "parent_slug": "saude-e-bem-estar"
    },
    {
      "id": "92041296-7791-539e-8419-a4a962e9d61c",
      "name": "Concessionárias de carros",
      "slug": "concessionarias-de-carros",
      "level": "niche",
      "parent_slug": "veiculos-e-transportes"
    },
    {
      "id": "636e6441-0f8a-55e5-9cbb-2c0981d278af",
      "name": "Concessionárias de lanchas",
      "slug": "concessionarias-de-lanchas",
      "level": "niche",
      "parent_slug": "veiculos-e-transportes"
    },
    {
      "id": "feb936fd-588b-572b-a7c8-0df48290a01e",
      "name": "Confeitarias",
      "slug": "confeitarias",
      "level": "niche",
      "parent_slug": "alimentacao-e-gastronomia"
    },
    {
      "id": "af9f7030-0b05-5ae8-900d-f9a0c2bf06a1",
      "name": "Construtoras e incorporadoras",
      "slug": "construtoras-e-incorporadoras",
      "level": "niche",
      "parent_slug": "construcao"
    },
    {
      "id": "1e34509b-b858-58c7-8bc7-24f4cdfd3fdf",
      "name": "Consultorias empresariais",
      "slug": "consultorias-empresariais",
      "level": "niche",
      "parent_slug": "servicos-profissionais"
    },
    {
      "id": "a084e3f1-eb94-5f84-81ab-e6a832483822",
      "name": "Consultorias financeiras",
      "slug": "consultorias-financeiras",
      "level": "niche",
      "parent_slug": "servicos-profissionais"
    },
    {
      "id": "2ca52593-a3ea-5761-af28-dbaaf079ca2b",
      "name": "Cursos preparatórios",
      "slug": "cursos-preparatorios",
      "level": "niche",
      "parent_slug": "educacao"
    },
    {
      "id": "b05ade1c-1434-5f8f-b1a3-743f7ea22e14",
      "name": "Empresas de energia solar",
      "slug": "empresas-de-energia-solar",
      "level": "niche",
      "parent_slug": "construcao"
    },
    {
      "id": "cfaf5a87-2b5b-59dd-9470-dab6a812d39d",
      "name": "Empresas de engenharia",
      "slug": "empresas-de-engenharia",
      "level": "niche",
      "parent_slug": "construcao"
    },
    {
      "id": "aa505a5c-b61c-5b4e-a82c-6fc39dd2af98",
      "name": "Empresas de limpeza de estofados e tapetes",
      "slug": "empresas-de-limpeza-de-estofados-e-tapetes",
      "level": "niche",
      "parent_slug": "manutencao-e-servicos-gerais"
    },
    {
      "id": "e5a8fd95-0df8-5273-87ed-c6317054e152",
      "name": "Empresas de mudanças",
      "slug": "empresas-de-mudancas",
      "level": "niche",
      "parent_slug": "veiculos-e-transportes"
    },
    {
      "id": "c756b874-d0aa-5d2c-a223-67f4d7568541",
      "name": "Escolas de educação básica",
      "slug": "escolas-de-educacao-basica",
      "level": "niche",
      "parent_slug": "educacao"
    },
    {
      "id": "9d02c69f-436f-5153-acd2-53f7c3c700d1",
      "name": "Escolas de idiomas",
      "slug": "escolas-de-idiomas",
      "level": "niche",
      "parent_slug": "educacao"
    },
    {
      "id": "51578750-ae76-5b69-9ff1-83c1cdca2f0a",
      "name": "Escolas de música",
      "slug": "escolas-de-musica",
      "level": "niche",
      "parent_slug": "educacao"
    },
    {
      "id": "56355423-f1ce-5d04-862e-3436bb1f77e1",
      "name": "Escolas de natação",
      "slug": "escolas-de-natacao",
      "level": "niche",
      "parent_slug": "educacao"
    },
    {
      "id": "7b6f7d09-0182-5025-aac7-e6947b01910a",
      "name": "Escritórios de advocacia",
      "slug": "escritorios-de-advocacia",
      "level": "niche",
      "parent_slug": "servicos-profissionais"
    },
    {
      "id": "0866330b-b6c9-5715-b426-ba8c8b9d5ba6",
      "name": "Escritórios de arquitetura",
      "slug": "escritorios-de-arquitetura",
      "level": "niche",
      "parent_slug": "servicos-profissionais"
    },
    {
      "id": "3967f1d7-12c2-50a2-907a-4ecadf5c8635",
      "name": "Escritórios de assessoria de investimentos",
      "slug": "escritorios-de-assessoria-de-investimentos",
      "level": "niche",
      "parent_slug": "servicos-profissionais"
    },
    {
      "id": "8d2aeb66-7602-5c20-9401-c5761d6b2362",
      "name": "Escritórios de contabilidade",
      "slug": "escritorios-de-contabilidade",
      "level": "niche",
      "parent_slug": "servicos-profissionais"
    },
    {
      "id": "34cf9bdc-ce9f-5240-becf-668a80a52ea6",
      "name": "Fabricantes de materiais de construção",
      "slug": "fabricantes-de-materiais-de-construcao",
      "level": "niche",
      "parent_slug": "construcao"
    },
    {
      "id": "10134399-3a72-5e01-8ccd-073a3d5f029b",
      "name": "Faculdades",
      "slug": "faculdades",
      "level": "niche",
      "parent_slug": "educacao"
    },
    {
      "id": "6b4ac31d-9a39-5a8f-ac03-918133d2fbe5",
      "name": "Farmácias",
      "slug": "farmacias",
      "level": "niche",
      "parent_slug": "saude-e-bem-estar"
    },
    {
      "id": "95b74024-d064-58dc-a3a4-c71f1c891ce2",
      "name": "Fisioterapia",
      "slug": "fisioterapia",
      "level": "niche",
      "parent_slug": "saude-e-bem-estar"
    },
    {
      "id": "d32425e9-6efe-5699-bab0-2743938595b8",
      "name": "Gráficas",
      "slug": "graficas",
      "level": "niche",
      "parent_slug": "tecnologia-e-comunicacao"
    },
    {
      "id": "b7e67ad6-b905-58f1-8a3f-60c952b590e7",
      "name": "Hospitais",
      "slug": "hospitais",
      "level": "niche",
      "parent_slug": "saude-e-bem-estar"
    },
    {
      "id": "c7c014fa-4953-51b1-9119-9511b5778963",
      "name": "Hotéis",
      "slug": "hoteis",
      "level": "niche",
      "parent_slug": "hotelaria-e-turismo"
    },
    {
      "id": "f0061748-3955-5217-a22d-d58d6de366c6",
      "name": "Imobiliárias",
      "slug": "imobiliarias",
      "level": "niche",
      "parent_slug": "imobiliario"
    },
    {
      "id": "a5c66f17-1a98-5bbb-913d-df773402cd31",
      "name": "Joalherias",
      "slug": "joalherias",
      "level": "niche",
      "parent_slug": "varejo-e-comercio-local"
    },
    {
      "id": "bdc9a667-e856-556f-8898-2eb86de7c2c2",
      "name": "Lanchonetes",
      "slug": "lanchonetes",
      "level": "niche",
      "parent_slug": "alimentacao-e-gastronomia"
    },
    {
      "id": "e0670e67-1806-5169-bddf-d7fa60d18164",
      "name": "Lavanderias",
      "slug": "lavanderias",
      "level": "niche",
      "parent_slug": "manutencao-e-servicos-gerais"
    },
    {
      "id": "1cb6b1fe-540a-56dd-a90c-9475f54af3a6",
      "name": "Lojas de baterias automotivas",
      "slug": "lojas-de-baterias-automotivas",
      "level": "niche",
      "parent_slug": "varejo-e-comercio-local"
    },
    {
      "id": "e1d90712-74be-5acb-a5fd-911d48b3a379",
      "name": "Lojas de calçados",
      "slug": "lojas-de-calcados",
      "level": "niche",
      "parent_slug": "varejo-e-comercio-local"
    },
    {
      "id": "30d27071-1816-5c54-bbe9-caa7b8fc67fa",
      "name": "Lojas de cama mesa e banho",
      "slug": "lojas-de-cama-mesa-e-banho",
      "level": "niche",
      "parent_slug": "varejo-e-comercio-local"
    },
    {
      "id": "beb0f4f8-474a-5da6-963a-1ebb31b25ee8",
      "name": "Lojas de colchões",
      "slug": "lojas-de-colchoes",
      "level": "niche",
      "parent_slug": "varejo-e-comercio-local"
    },
    {
      "id": "d8603216-6afa-54e7-8c9b-84d7c59aec1b",
      "name": "Lojas de cosméticos e perfumes",
      "slug": "lojas-de-cosmeticos-e-perfumes",
      "level": "niche",
      "parent_slug": "varejo-e-comercio-local"
    },
    {
      "id": "c65c114e-8204-5475-9d23-8873ef52d018",
      "name": "Lojas de iluminação",
      "slug": "lojas-de-iluminacao",
      "level": "niche",
      "parent_slug": "varejo-e-comercio-local"
    },
    {
      "id": "d3a44903-ce20-5797-9d3e-0171e5aef4c9",
      "name": "Lojas de informática",
      "slug": "lojas-de-informatica",
      "level": "niche",
      "parent_slug": "varejo-e-comercio-local"
    },
    {
      "id": "68dfe4de-2161-5821-a2d5-4f655bca71f6",
      "name": "Lojas de materiais de construção",
      "slug": "lojas-de-materiais-de-construcao",
      "level": "niche",
      "parent_slug": "construcao"
    },
    {
      "id": "a3bd2246-9e74-5e9a-8867-91b262c7ae69",
      "name": "Lojas de móveis",
      "slug": "lojas-de-moveis",
      "level": "niche",
      "parent_slug": "varejo-e-comercio-local"
    },
    {
      "id": "e0bfba25-6fd6-591b-b33e-e1a8d6094bad",
      "name": "Lojas de pneus",
      "slug": "lojas-de-pneus",
      "level": "niche",
      "parent_slug": "veiculos-e-transportes"
    },
    {
      "id": "8861ec0f-ce14-51c7-b0f5-80bdc59caa37",
      "name": "Lojas de roupa",
      "slug": "lojas-de-roupa",
      "level": "niche",
      "parent_slug": "varejo-e-comercio-local"
    },
    {
      "id": "ff8a1dfe-9baf-590a-8dfd-82d7cce71058",
      "name": "Lojas de utilidades domésticas",
      "slug": "lojas-de-utilidades-domesticas",
      "level": "niche",
      "parent_slug": "varejo-e-comercio-local"
    },
    {
      "id": "feb4731d-0406-530a-be40-dff6eaf842ff",
      "name": "Manutenção de eletrodomésticos",
      "slug": "manutencao-de-eletrodomesticos",
      "level": "niche",
      "parent_slug": "manutencao-e-servicos-gerais"
    },
    {
      "id": "1fa356e4-119f-5a36-96c4-ee3dc33518c6",
      "name": "Motéis",
      "slug": "moteis",
      "level": "niche",
      "parent_slug": "hotelaria-e-turismo"
    },
    {
      "id": "62bd61ed-c5ee-52e6-ad92-f7a70d577f38",
      "name": "Móveis planejados",
      "slug": "moveis-planejados",
      "level": "niche",
      "parent_slug": "varejo-e-comercio-local"
    },
    {
      "id": "2aa3d544-e45f-58e2-9062-bc16a2478821",
      "name": "Nutricionistas",
      "slug": "nutricionistas",
      "level": "niche",
      "parent_slug": "saude-e-bem-estar"
    },
    {
      "id": "7bd257a4-260d-51db-8739-723ca41b4c6f",
      "name": "Oficinas mecânicas",
      "slug": "oficinas-mecanicas",
      "level": "niche",
      "parent_slug": "veiculos-e-transportes"
    },
    {
      "id": "c5f08922-e917-558e-ac6e-963d90d9be5a",
      "name": "Óticas",
      "slug": "oticas",
      "level": "niche",
      "parent_slug": "varejo-e-comercio-local"
    },
    {
      "id": "23829546-fa1f-5b32-b28c-647e338e734b",
      "name": "Padarias",
      "slug": "padarias",
      "level": "niche",
      "parent_slug": "alimentacao-e-gastronomia"
    },
    {
      "id": "d4d08c7d-6c31-5ad8-b08d-b2e76a906c63",
      "name": "Pet shops",
      "slug": "pet-shops",
      "level": "niche",
      "parent_slug": "varejo-e-comercio-local"
    },
    {
      "id": "e47bf4fd-3492-5019-b04a-758a7306baf3",
      "name": "Provedores de internet",
      "slug": "provedores-de-internet",
      "level": "niche",
      "parent_slug": "tecnologia-e-comunicacao"
    },
    {
      "id": "383dc7a6-01db-53da-aaef-7876e39e6de0",
      "name": "Restaurantes e bares",
      "slug": "restaurantes-e-bares",
      "level": "niche",
      "parent_slug": "alimentacao-e-gastronomia"
    },
    {
      "id": "9c6eeafe-e2fa-506c-ab8d-2242dd94b9a2",
      "name": "Salões de beleza",
      "slug": "saloes-de-beleza",
      "level": "niche",
      "parent_slug": "saude-e-bem-estar"
    },
    {
      "id": "1c3ffe05-8c95-54aa-85af-be300d2f52dc",
      "name": "Sonorização de eventos",
      "slug": "sonorizacao-de-eventos",
      "level": "niche",
      "parent_slug": "tecnologia-e-comunicacao"
    },
    {
      "id": "e9cfbfbe-cb4b-59e0-9e87-6d0601e7481e",
      "name": "Spas",
      "slug": "spas",
      "level": "niche",
      "parent_slug": "saude-e-bem-estar"
    },
    {
      "id": "d14d47bb-8165-5cd0-b7b3-b8069c812c91",
      "name": "Supermercados",
      "slug": "supermercados",
      "level": "niche",
      "parent_slug": "alimentacao-e-gastronomia"
    }
  ],
  "research": [
    {
      "id": "c593f1ec-5f4f-531f-9070-80b4441eef28",
      "taxon_slug": "academias-de-artes-marciais",
      "research_block": "market_intelligence",
      "audience_scope": "business_buyer",
      "version": 1,
      "status": "active",
      "items": [
        {
          "id": "09b1ff14-7b29-5f71-b5f2-d843d39a7d76",
          "item_key": "market_overview",
          "item_text": "A pesquisa destaca comunidade, reputação do instrutor e modalidades de luta, sem tomar crescimento histórico como atual.",
          "priority": 2,
          "sort_order": 1,
          "notes": "Acervo do titular: Fitnes e Esportes.pdf, p.1, 2025-06-26; recorte: Academias de Artes Marciais. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "cf95388a-4d54-5bf3-b7bd-6af753cedb95",
          "item_key": "digital_maturity",
          "item_text": "O material descreve indicação e conteúdo comunitário como caminhos de divulgação de 2025.",
          "priority": 2,
          "sort_order": 2,
          "notes": "Acervo do titular: Fitnes e Esportes.pdf, p.1, 2025-06-26; recorte: Academias de Artes Marciais. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "50a586a0-710a-5d3e-8f3a-e378a1a7f257",
          "item_key": "communication_opportunity",
          "item_text": "Explicar modalidades e públicos efetivamente atendidos; reputação, conquistas e aula experimental dependem de comprovação.",
          "priority": 2,
          "sort_order": 3,
          "notes": "Acervo do titular: Fitnes e Esportes.pdf, p.1, 2025-06-26; recorte: Academias de Artes Marciais. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "f6d86253-5ac5-549d-96a0-0e45596269b8",
          "item_key": "evidence_limitations",
          "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
          "priority": 3,
          "sort_order": 4,
          "notes": "Fontes aproveitadas: Fitnes e Esportes.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida."
        }
      ]
    },
    {
      "id": "f8294826-4ab6-5c42-88ea-ccb5e33bd839",
      "taxon_slug": "academias-de-ginastica",
      "research_block": "market_intelligence",
      "audience_scope": "business_buyer",
      "version": 1,
      "status": "active",
      "items": [
        {
          "id": "5e413f1c-4769-5e71-a672-2ad824bce8bb",
          "item_key": "market_overview",
          "item_text": "O acervo diferencia aquisição e retenção de alunos em academias generalistas, sem validar expansão ou margens atuais.",
          "priority": 2,
          "sort_order": 1,
          "notes": "Acervo do titular: Fitnes e Esportes.pdf, p.1, 2025-06-26; recorte: Academias de Ginástica. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "4330a693-01c8-5ec1-a270-67c8226ea044",
          "item_key": "digital_maturity",
          "item_text": "A leitura de 2025 descreve contraste entre redes estruturadas e pequenas operações com divulgação básica.",
          "priority": 2,
          "sort_order": 2,
          "notes": "Acervo do titular: Fitnes e Esportes.pdf, p.1, 2025-06-26; recorte: Academias de Ginástica. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "70355fc9-1029-5dcb-b5e8-13ea7c876f39",
          "item_key": "communication_opportunity",
          "item_text": "Clarificar modalidades e planos reais, facilitar visita e matrícula; resultados físicos e retenção não podem ser prometidos.",
          "priority": 2,
          "sort_order": 3,
          "notes": "Acervo do titular: Fitnes e Esportes.pdf, p.1, 2025-06-26; recorte: Academias de Ginástica. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "3343f56a-3a7d-54f3-b6b3-7b2e1acab2a7",
          "item_key": "evidence_limitations",
          "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
          "priority": 3,
          "sort_order": 4,
          "notes": "Fontes aproveitadas: Fitnes e Esportes.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida."
        }
      ]
    },
    {
      "id": "575b18e9-de6f-5a5a-99f1-3607b20c89ec",
      "taxon_slug": "agencias-de-turismo",
      "research_block": "market_intelligence",
      "audience_scope": "business_buyer",
      "version": 1,
      "status": "active",
      "items": [
        {
          "id": "71004606-54bf-5ff4-bf37-42591498ebd5",
          "item_key": "market_overview",
          "item_text": "O acervo descreve heterogeneidade entre agências e concorrência com vendas online, sem atribuir porte a uma agência particular.",
          "priority": 2,
          "sort_order": 1,
          "notes": "Acervo do titular: Hotelaria e Turismo.pdf, p.1, 2025-06-26; recorte: Agências de Turismo. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "509090b0-823f-5d04-9f71-3532fc865635",
          "item_key": "digital_maturity",
          "item_text": "A leitura de 2025 destaca busca, conteúdo e relacionamento digital, com diferenças entre operações.",
          "priority": 2,
          "sort_order": 2,
          "notes": "Acervo do titular: Hotelaria e Turismo.pdf, p.1, 2025-06-26; recorte: Agências de Turismo. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "53be5e30-9a8a-5aa4-a429-b6c1885c7ede",
          "item_key": "communication_opportunity",
          "item_text": "Explicar planejamento, atendimento e condições reais dos pacotes; especialização e assistência diferenciadas exigem confirmação.",
          "priority": 2,
          "sort_order": 3,
          "notes": "Acervo do titular: Hotelaria e Turismo.pdf, p.1, 2025-06-26; recorte: Agências de Turismo. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "50e9455d-bffe-5599-85b4-e68575a9dbda",
          "item_key": "evidence_limitations",
          "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
          "priority": 3,
          "sort_order": 4,
          "notes": "Fontes aproveitadas: Hotelaria e Turismo.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida."
        }
      ]
    },
    {
      "id": "f893c55c-9d56-5079-badc-0e0f9bb7ea4f",
      "taxon_slug": "aluguel-de-roupas",
      "research_block": "market_intelligence",
      "audience_scope": "business_buyer",
      "version": 1,
      "status": "active",
      "items": [
        {
          "id": "a37b4e89-22e0-5682-a8de-0419805e9a12",
          "item_key": "market_overview",
          "item_text": "A análise trata de locação com sazonalidade e ocasiões, sem criar categoria por gênero ou evento.",
          "priority": 2,
          "sort_order": 1,
          "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Aluguel de Roupas. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "f5fc81bb-6896-508c-985b-3948768479b9",
          "item_key": "digital_maturity",
          "item_text": "O material histórico destaca conteúdo visual e consulta de disponibilidade.",
          "priority": 2,
          "sort_order": 2,
          "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Aluguel de Roupas. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "1165a33e-b528-5ce7-995e-f09a5fffe23d",
          "item_key": "communication_opportunity",
          "item_text": "Explicar prova, reserva e condições reais de locação; variedade e ajuste dependem da operação.",
          "priority": 2,
          "sort_order": 3,
          "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Aluguel de Roupas. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "664b1432-e718-5ea1-8de0-6db8ac40be52",
          "item_key": "evidence_limitations",
          "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
          "priority": 3,
          "sort_order": 4,
          "notes": "Fontes aproveitadas: Varejo e Comércio Local 2.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida."
        }
      ]
    },
    {
      "id": "4247708e-6cb0-5be0-bbac-77d36eb3ec37",
      "taxon_slug": "boxes-de-crossfit",
      "research_block": "market_intelligence",
      "audience_scope": "business_buyer",
      "version": 1,
      "status": "active",
      "items": [
        {
          "id": "c40d4a9c-73f7-5eb4-a8a2-0303a737469d",
          "item_key": "market_overview",
          "item_text": "O acervo relaciona treino e comunidade a recorrência; números de boxes e margens não foram validados.",
          "priority": 2,
          "sort_order": 1,
          "notes": "Acervo do titular: Fitnes e Esportes.pdf, p.1, 2025-06-26; recorte: Boxes de CrossFit. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "fdd988db-687e-5030-a29f-cf0ed17e1d04",
          "item_key": "digital_maturity",
          "item_text": "A pesquisa histórica enfatiza conteúdo de treinos e engajamento em redes.",
          "priority": 2,
          "sort_order": 2,
          "notes": "Acervo do titular: Fitnes e Esportes.pdf, p.1, 2025-06-26; recorte: Boxes de CrossFit. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "ae16fe84-5319-58b5-bf8c-267ce4edcc2f",
          "item_key": "communication_opportunity",
          "item_text": "Mostrar estrutura e acompanhamento confirmados; preservar uso correto de marcas e não prometer desempenho individual.",
          "priority": 2,
          "sort_order": 3,
          "notes": "Acervo do titular: Fitnes e Esportes.pdf, p.1, 2025-06-26; recorte: Boxes de CrossFit. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "8d8e268a-1808-5d5a-a242-96d080eea6b1",
          "item_key": "evidence_limitations",
          "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
          "priority": 3,
          "sort_order": 4,
          "notes": "Fontes aproveitadas: Fitnes e Esportes.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida."
        }
      ]
    },
    {
      "id": "e26e900b-8fe5-5ec8-b62a-6e0986a887bf",
      "taxon_slug": "cafeterias",
      "research_block": "market_intelligence",
      "audience_scope": "business_buyer",
      "version": 1,
      "status": "active",
      "items": [
        {
          "id": "eebcdff5-2f65-5596-9d1d-307e1c4762f2",
          "item_key": "market_overview",
          "item_text": "A análise específica cobre cafeterias e consumo de café; não comprova que toda lanchonete tenha o mesmo perfil.",
          "priority": 2,
          "sort_order": 1,
          "notes": "Acervo do titular: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; recorte: Cafeterias. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "335f4d84-fc2c-5d0f-a61a-c973e40fe6cd",
          "item_key": "digital_maturity",
          "item_text": "O acervo cita presença visual em redes e construção de marca em 2025, sem comprovar a situação de uma cafeteria atual.",
          "priority": 2,
          "sort_order": 2,
          "notes": "Acervo do titular: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; recorte: Cafeterias. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "9a8e51d9-5592-5662-ac65-4559bdfe688c",
          "item_key": "communication_opportunity",
          "item_text": "Explorar ambiente, cardápio e ocasião de visita confirmados; qualidade especial ou experiência diferenciada exige evidência do negócio.",
          "priority": 2,
          "sort_order": 3,
          "notes": "Acervo do titular: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; recorte: Cafeterias. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "a474a4d4-660e-5d49-a48f-cc7d81338488",
          "item_key": "evidence_limitations",
          "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
          "priority": 3,
          "sort_order": 4,
          "notes": "Fontes aproveitadas: Alimentação e Gastronomia.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida."
        }
      ]
    },
    {
      "id": "41b7e4f9-ed34-50f4-b208-e83a9204a1e2",
      "taxon_slug": "clinica-estetica",
      "research_block": "market_intelligence",
      "audience_scope": "business_buyer",
      "version": 1,
      "status": "active",
      "items": [
        {
          "id": "53711982-1951-51e6-ade4-4e3072090e5d",
          "item_key": "market_overview",
          "item_text": "O acervo descreve clínicas e serviços estéticos; volume de procedimentos e rentabilidade não foram validados.",
          "priority": 2,
          "sort_order": 1,
          "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Clínica de Estética. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "92d52236-3a82-5068-991a-e17e41d7c7d6",
          "item_key": "digital_maturity",
          "item_text": "O quadro de 2025 cita divulgação visual e redes sociais.",
          "priority": 2,
          "sort_order": 2,
          "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Clínica de Estética. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "84fe203e-03dd-547a-bbb4-24b0098714b1",
          "item_key": "communication_opportunity",
          "item_text": "Apresentar procedimentos e atendimento efetivamente disponíveis; não prometer resultado ou atribuir credenciais não verificadas.",
          "priority": 2,
          "sort_order": 3,
          "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Clínica de Estética. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "8eff368e-64bb-5108-ae4a-f55eeaeb76d6",
          "item_key": "market_overview",
          "item_text": "O material analisa um procedimento como especialização de clínica estética, sem criar categoria de oferta.",
          "priority": 2,
          "sort_order": 4,
          "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Depilação a Laser. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "73a8602e-657d-54bb-bd6a-41be7dac1630",
          "item_key": "digital_maturity",
          "item_text": "A pesquisa de 2025 cita campanhas e captação digital para esse serviço.",
          "priority": 2,
          "sort_order": 5,
          "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Depilação a Laser. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "50c9e9b3-bd6e-5732-89e1-2ed8ee349751",
          "item_key": "communication_opportunity",
          "item_text": "Se a clínica confirmar a oferta, esclarecer avaliação e condições reais; eficácia, segurança e resultado não são garantias gerais.",
          "priority": 2,
          "sort_order": 6,
          "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Depilação a Laser. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "b4dfb87b-ccbf-5cba-9e32-de3eaa4a3767",
          "item_key": "evidence_limitations",
          "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
          "priority": 3,
          "sort_order": 7,
          "notes": "Fontes aproveitadas: Saúde e Bem-estar.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida."
        }
      ]
    },
    {
      "id": "d5c0e5ab-875f-52c8-afb4-a0facb0b2a48",
      "taxon_slug": "clinicas-medicas",
      "research_block": "market_intelligence",
      "audience_scope": "business_buyer",
      "version": 1,
      "status": "active",
      "items": [
        {
          "id": "d21a31d7-c80e-5d66-b05e-da3b5f6a6654",
          "item_key": "market_overview",
          "item_text": "O quadro distingue modelos de clínicas e atendimento coletivo, sem igualar clínica a consultório individual.",
          "priority": 2,
          "sort_order": 1,
          "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Clínicas Médicas. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "47ae0662-4f66-585b-9670-1641668d11e1",
          "item_key": "digital_maturity",
          "item_text": "O acervo de 2025 descreve sites, conteúdo e estratégias variadas.",
          "priority": 2,
          "sort_order": 2,
          "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Clínicas Médicas. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "53ae43c1-b050-50ee-94a9-9b85dac5e629",
          "item_key": "communication_opportunity",
          "item_text": "Organizar especialidades, agenda e canais reais de atendimento; preço, convênio e estrutura só com confirmação.",
          "priority": 2,
          "sort_order": 3,
          "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Clínicas Médicas. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "f9e43681-f55c-52a7-859e-f9673939173d",
          "item_key": "evidence_limitations",
          "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
          "priority": 3,
          "sort_order": 4,
          "notes": "Fontes aproveitadas: Saúde e Bem-estar.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida."
        }
      ]
    },
    {
      "id": "0de38fe8-16ad-575f-8508-bdbb6bf50076",
      "taxon_slug": "concessionarias-de-carros",
      "research_block": "market_intelligence",
      "audience_scope": "business_buyer",
      "version": 1,
      "status": "active",
      "items": [
        {
          "id": "1bd88399-b0cc-57ee-b99f-0596a08f96b3",
          "item_key": "market_overview",
          "item_text": "O material trata de venda de veículos e comparação de ofertas, sem validar volume ou margens atuais.",
          "priority": 2,
          "sort_order": 1,
          "notes": "Acervo do titular: Veículos e Transportes.pdf, p.1, 2025-06-26; recorte: Concessionárias de carros. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "21881e18-4719-5412-b14b-a7ca34ec99b3",
          "item_key": "digital_maturity",
          "item_text": "A pesquisa histórica cita sites, CRM e anúncios.",
          "priority": 2,
          "sort_order": 2,
          "notes": "Acervo do titular: Veículos e Transportes.pdf, p.1, 2025-06-26; recorte: Concessionárias de carros. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "d590e4c3-9543-5728-8ea2-e26497829019",
          "item_key": "communication_opportunity",
          "item_text": "Organizar veículos e contato; estoque, financiamento e condição de venda não podem ser presumidos.",
          "priority": 2,
          "sort_order": 3,
          "notes": "Acervo do titular: Veículos e Transportes.pdf, p.1, 2025-06-26; recorte: Concessionárias de carros. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "1f7eb67b-8f29-53f6-a038-d090ba82c837",
          "item_key": "evidence_limitations",
          "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
          "priority": 3,
          "sort_order": 4,
          "notes": "Fontes aproveitadas: Veículos e Transportes.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida."
        }
      ]
    },
    {
      "id": "c2f09d80-1f32-546b-a6ff-a1e4091cee1d",
      "taxon_slug": "concessionarias-de-lanchas",
      "research_block": "market_intelligence",
      "audience_scope": "business_buyer",
      "version": 1,
      "status": "active",
      "items": [
        {
          "id": "013ebc4c-ebad-51ee-9aa8-72f9cc35341e",
          "item_key": "market_overview",
          "item_text": "O acervo aborda comércio náutico e atendimento especializado; projeções antigas não são atualidade.",
          "priority": 2,
          "sort_order": 1,
          "notes": "Acervo do titular: Veículos e Transportes.pdf, p.1, 2025-06-26; recorte: Concessionárias de lanchas. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "d2bf5428-7b73-5dbd-a81e-aba9572278b2",
          "item_key": "digital_maturity",
          "item_text": "A leitura de 2025 cita sites especializados, eventos e divulgação segmentada.",
          "priority": 2,
          "sort_order": 2,
          "notes": "Acervo do titular: Veículos e Transportes.pdf, p.1, 2025-06-26; recorte: Concessionárias de lanchas. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "27b65fb4-f6ab-59d9-92ac-a3f36122763b",
          "item_key": "communication_opportunity",
          "item_text": "Apresentar embarcações e serviços reais; disponibilidade, especificações e condições exigem confirmação.",
          "priority": 2,
          "sort_order": 3,
          "notes": "Acervo do titular: Veículos e Transportes.pdf, p.1, 2025-06-26; recorte: Concessionárias de lanchas. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "ae7d49a1-8d3b-555f-bcf5-010037d841c0",
          "item_key": "evidence_limitations",
          "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
          "priority": 3,
          "sort_order": 4,
          "notes": "Fontes aproveitadas: Veículos e Transportes.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida."
        }
      ]
    },
    {
      "id": "28266a9f-faf0-583f-bac7-ee7fdb9fc79a",
      "taxon_slug": "confeitarias",
      "research_block": "market_intelligence",
      "audience_scope": "business_buyer",
      "version": 1,
      "status": "active",
      "items": [
        {
          "id": "ed3816fc-bc6d-507a-b0ca-a536225f72de",
          "item_key": "market_overview",
          "item_text": "O acervo destaca encomendas e ocasiões de consumo como contextos da confeitaria.",
          "priority": 2,
          "sort_order": 1,
          "notes": "Acervo do titular: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; recorte: Confeitarias. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "03e4716a-a422-50b7-b212-d51e96ae61ef",
          "item_key": "digital_maturity",
          "item_text": "A pesquisa cita portfólio visual, Instagram e WhatsApp como caminhos usados em 2025, sem medir adoção atual.",
          "priority": 2,
          "sort_order": 2,
          "notes": "Acervo do titular: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; recorte: Confeitarias. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "a00dc417-6e1e-5c25-a452-4a81ba159fb3",
          "item_key": "communication_opportunity",
          "item_text": "Organizar catálogo e pedidos por ocasião; personalização, prazo e provas visuais dependem de capacidade e autorização reais.",
          "priority": 2,
          "sort_order": 3,
          "notes": "Acervo do titular: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; recorte: Confeitarias. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "7dabd762-0640-5ac0-bed5-94c4da8ccfca",
          "item_key": "evidence_limitations",
          "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
          "priority": 3,
          "sort_order": 4,
          "notes": "Fontes aproveitadas: Alimentação e Gastronomia.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida."
        }
      ]
    },
    {
      "id": "66abf9c2-3920-5f7d-ac9e-9a686342858f",
      "taxon_slug": "construtoras-e-incorporadoras",
      "research_block": "market_intelligence",
      "audience_scope": "business_buyer",
      "version": 1,
      "status": "active",
      "items": [
        {
          "id": "6823c76b-82a6-5818-9ad5-4e38924a3614",
          "item_key": "market_overview",
          "item_text": "O acervo aborda empreendimentos e lançamentos; indicadores de vendas e projeções não são referência atual.",
          "priority": 2,
          "sort_order": 1,
          "notes": "Acervo do titular: Imobiliário Construção.pdf, p.1, 2025-06-26; recorte: Construtoras/Incorporadoras. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "1a105ccf-d58a-5bcb-a90f-385c673ff7df",
          "item_key": "digital_maturity",
          "item_text": "A leitura histórica cita campanhas, portais e CRM na divulgação de empreendimentos.",
          "priority": 2,
          "sort_order": 2,
          "notes": "Acervo do titular: Imobiliário Construção.pdf, p.1, 2025-06-26; recorte: Construtoras/Incorporadoras. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "cf1d4434-57e2-537d-950d-ae277df8ff45",
          "item_key": "communication_opportunity",
          "item_text": "Organizar informação verificável sobre projetos, etapas e canais de atendimento; prazos, financiamento e entrega não podem ser inferidos.",
          "priority": 2,
          "sort_order": 3,
          "notes": "Acervo do titular: Imobiliário Construção.pdf, p.1, 2025-06-26; recorte: Construtoras/Incorporadoras. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "33396142-0e8c-5ea3-9602-400808fc5f39",
          "item_key": "evidence_limitations",
          "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
          "priority": 3,
          "sort_order": 4,
          "notes": "Fontes aproveitadas: Imobiliário Construção.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida."
        }
      ]
    },
    {
      "id": "c043fb2c-c712-5425-898a-d77c4ae00008",
      "taxon_slug": "consultorias-empresariais",
      "research_block": "market_intelligence",
      "audience_scope": "business_buyer",
      "version": 1,
      "status": "active",
      "items": [
        {
          "id": "e90ab9b2-d3a5-55a6-a10b-22c728287e90",
          "item_key": "market_overview",
          "item_text": "A pesquisa aborda projetos de eficiência e gestão para empresas; indicadores e projeções permanecem não validados.",
          "priority": 2,
          "sort_order": 1,
          "notes": "Acervo do titular: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; recorte: Consultorias Empresariais. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "12573af5-58c8-5794-87c8-3d6128f9979d",
          "item_key": "digital_maturity",
          "item_text": "A leitura histórica cita conteúdo técnico e relacionamento entre empresas.",
          "priority": 2,
          "sort_order": 2,
          "notes": "Acervo do titular: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; recorte: Consultorias Empresariais. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "662fc8da-b893-532b-802d-08b417f85ab2",
          "item_key": "communication_opportunity",
          "item_text": "Explicar problemas atendidos e método real; casos e resultados só com prova e autorização.",
          "priority": 2,
          "sort_order": 3,
          "notes": "Acervo do titular: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; recorte: Consultorias Empresariais. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "dc476a50-63b9-5c67-b566-6134f4fccc6f",
          "item_key": "evidence_limitations",
          "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
          "priority": 3,
          "sort_order": 4,
          "notes": "Fontes aproveitadas: Serviços Profissionais Consultoria.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida."
        }
      ]
    },
    {
      "id": "d5bf615a-deb7-55a2-8832-a9f1b22a659b",
      "taxon_slug": "consultorio-medico",
      "research_block": "market_intelligence",
      "audience_scope": "business_buyer",
      "version": 1,
      "status": "active",
      "items": [
        {
          "id": "fe42b097-fb08-5e12-93bb-16c2375b49f6",
          "item_key": "market_overview",
          "item_text": "A pesquisa cobre consultório e consulta, sem validar remuneração, crescimento ou especialidade de um profissional.",
          "priority": 2,
          "sort_order": 1,
          "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Médicos (Consultórios). Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "01cf5d4f-ad72-51e0-a1b7-098ca7db8c62",
          "item_key": "digital_maturity",
          "item_text": "O acervo menciona presença digital heterogênea em 2025.",
          "priority": 2,
          "sort_order": 2,
          "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Médicos (Consultórios). Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "3dbf5f9d-a9ab-5411-b605-c186c7d6919f",
          "item_key": "communication_opportunity",
          "item_text": "Esclarecer atendimento e acesso à consulta; qualificações e publicidade precisam de verificação própria antes de uso.",
          "priority": 2,
          "sort_order": 3,
          "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Médicos (Consultórios). Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "1545e1cd-52b5-5491-9967-c289e236d1bf",
          "item_key": "evidence_limitations",
          "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
          "priority": 3,
          "sort_order": 4,
          "notes": "Fontes aproveitadas: Saúde e Bem-estar.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida."
        }
      ]
    },
    {
      "id": "16278d0f-7f85-5222-bd62-9e57d491a537",
      "taxon_slug": "corretor-imoveis",
      "research_block": "market_intelligence",
      "audience_scope": "business_buyer",
      "version": 1,
      "status": "active",
      "items": [
        {
          "id": "654c68fd-d0c8-519b-ab94-133b6b23d3ad",
          "item_key": "market_overview",
          "item_text": "A análise específica cobre corretores de imóveis; não generalizar para outras corretagens nem mudar sua hierarquia.",
          "priority": 2,
          "sort_order": 1,
          "notes": "Acervo do titular: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; recorte: Corretores de Imóveis (Imobiliário). Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "0a439c4f-02e6-5e32-a6b6-b5268ac2c5b2",
          "item_key": "digital_maturity",
          "item_text": "O acervo cita anúncios, portais e relacionamento digital em 2025.",
          "priority": 2,
          "sort_order": 2,
          "notes": "Acervo do titular: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; recorte: Corretores de Imóveis (Imobiliário). Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "0a04e266-7979-5adb-addb-a8e256208a25",
          "item_key": "communication_opportunity",
          "item_text": "Qualificar apresentação e contato com interessados; portfólio, disponibilidade e diferenciais dependem de confirmação.",
          "priority": 2,
          "sort_order": 3,
          "notes": "Acervo do titular: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; recorte: Corretores de Imóveis (Imobiliário). Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "2c0ce177-1dab-5da1-a7ed-a2a0250c47ea",
          "item_key": "evidence_limitations",
          "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
          "priority": 3,
          "sort_order": 4,
          "notes": "Fontes aproveitadas: Serviços Profissionais Consultoria.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida."
        }
      ]
    },
    {
      "id": "1e07f094-a81f-530d-a4fc-5a39a357c6dc",
      "taxon_slug": "cursos-preparatorios",
      "research_block": "market_intelligence",
      "audience_scope": "business_buyer",
      "version": 1,
      "status": "active",
      "items": [
        {
          "id": "7908a332-adce-5c19-9b4b-f896c3c4ccf7",
          "item_key": "market_overview",
          "item_text": "O material descreve captação ligada a ciclos de exames e concursos, sem validar demanda atual.",
          "priority": 2,
          "sort_order": 1,
          "notes": "Acervo do titular: Educação.pdf, p.1, 2025-06-25; recorte: Cursinhos (Vestibular/Concurso). Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "fa9263e5-d3c8-5a34-97ed-529f9cbb7e5e",
          "item_key": "digital_maturity",
          "item_text": "A pesquisa de 2025 atribui relevância à divulgação digital nos ciclos de matrícula.",
          "priority": 2,
          "sort_order": 2,
          "notes": "Acervo do titular: Educação.pdf, p.1, 2025-06-25; recorte: Cursinhos (Vestibular/Concurso). Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "c22319ac-0edd-5508-9861-13c23faca9cd",
          "item_key": "communication_opportunity",
          "item_text": "Explicar calendário e preparação oferecida; aprovações, índices ou garantias só com prova específica e autorização.",
          "priority": 2,
          "sort_order": 3,
          "notes": "Acervo do titular: Educação.pdf, p.1, 2025-06-25; recorte: Cursinhos (Vestibular/Concurso). Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "cfe1e4b7-eb78-5a9b-be34-9c28c8827d21",
          "item_key": "evidence_limitations",
          "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
          "priority": 3,
          "sort_order": 4,
          "notes": "Fontes aproveitadas: Educação.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida."
        }
      ]
    },
    {
      "id": "902d26ac-62c0-5b9c-b4e8-e5915fc64566",
      "taxon_slug": "empresas-de-energia-solar",
      "research_block": "market_intelligence",
      "audience_scope": "business_buyer",
      "version": 1,
      "status": "active",
      "items": [
        {
          "id": "05832cd1-a85c-5bf3-a19c-f06978986376",
          "item_key": "market_overview",
          "item_text": "O texto descreve empresas de projetos e instalação solar; crescimento, margens e economia futura não foram validados.",
          "priority": 2,
          "sort_order": 1,
          "notes": "Acervo do titular: Imobiliário Construção.pdf, p.1, 2025-06-26; recorte: Energia Solar. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "9e04fcfc-b560-512d-8012-f17728bed287",
          "item_key": "digital_maturity",
          "item_text": "O acervo de 2025 menciona busca, conteúdo e geração de contatos em canais digitais.",
          "priority": 2,
          "sort_order": 2,
          "notes": "Acervo do titular: Imobiliário Construção.pdf, p.1, 2025-06-26; recorte: Energia Solar. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "24153fa6-cda1-5a57-b325-9588ff23a6fb",
          "item_key": "communication_opportunity",
          "item_text": "Explicar avaliação e etapas reais do projeto; economia, retorno, homologação e garantias dependem do caso e não são promessas gerais.",
          "priority": 2,
          "sort_order": 3,
          "notes": "Acervo do titular: Imobiliário Construção.pdf, p.1, 2025-06-26; recorte: Energia Solar. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "8da0c046-94e2-5d65-9893-dbb897ba6aa8",
          "item_key": "evidence_limitations",
          "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
          "priority": 3,
          "sort_order": 4,
          "notes": "Fontes aproveitadas: Imobiliário Construção.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida."
        }
      ]
    },
    {
      "id": "c1c9a4b6-60ca-511e-a343-a7f028d93c1f",
      "taxon_slug": "empresas-de-engenharia",
      "research_block": "market_intelligence",
      "audience_scope": "business_buyer",
      "version": 1,
      "status": "active",
      "items": [
        {
          "id": "8972dd13-b892-53ce-976f-edae5fa2993b",
          "item_key": "market_overview",
          "item_text": "A análise descreve serviços técnicos e contratos entre empresas, sem sustentar margens ou quantidade atual de prestadores.",
          "priority": 2,
          "sort_order": 1,
          "notes": "Acervo do titular: Imobiliário Construção.pdf, p.1, 2025-06-26; recorte: Empresas de Engenharia. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "0ac87ec4-37ae-5662-8960-3ed68bb63e94",
          "item_key": "digital_maturity",
          "item_text": "O acervo cita relacionamento e presença institucional como caminhos históricos de divulgação.",
          "priority": 2,
          "sort_order": 2,
          "notes": "Acervo do titular: Imobiliário Construção.pdf, p.1, 2025-06-26; recorte: Empresas de Engenharia. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "aaede3a6-3954-57d9-8a4c-a461c1d15625",
          "item_key": "communication_opportunity",
          "item_text": "Explicar escopo técnico e evidências de projetos autorizadas; certificações, responsabilidade técnica e capacidade não são presumidas.",
          "priority": 2,
          "sort_order": 3,
          "notes": "Acervo do titular: Imobiliário Construção.pdf, p.1, 2025-06-26; recorte: Empresas de Engenharia. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "d07adc34-fe53-548c-9691-d41b963eaba9",
          "item_key": "evidence_limitations",
          "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
          "priority": 3,
          "sort_order": 4,
          "notes": "Fontes aproveitadas: Imobiliário Construção.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida."
        }
      ]
    },
    {
      "id": "d45cc27f-701b-54bc-aaa4-6de93152dfb9",
      "taxon_slug": "empresas-de-mudancas",
      "research_block": "market_intelligence",
      "audience_scope": "business_buyer",
      "version": 1,
      "status": "active",
      "items": [
        {
          "id": "16cec7ec-c756-5084-a936-f0af9c1ff374",
          "item_key": "market_overview",
          "item_text": "O acervo descreve serviços de transporte em mudanças e diversidade de porte, sem estatística consolidada verificada.",
          "priority": 2,
          "sort_order": 1,
          "notes": "Acervo do titular: Veículos e Transportes.pdf, p.1, 2025-06-26; recorte: Empresas de mudanças. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "54b4631e-9bd3-50ce-8fec-0fd7bf0c1018",
          "item_key": "digital_maturity",
          "item_text": "A observação de 2025 cita indicação e descoberta local com digitalização desigual.",
          "priority": 2,
          "sort_order": 2,
          "notes": "Acervo do titular: Veículos e Transportes.pdf, p.1, 2025-06-26; recorte: Empresas de mudanças. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "1e0509b8-6f03-56be-a7b3-c85d9564306b",
          "item_key": "communication_opportunity",
          "item_text": "Explicar orçamento e escopo reais; cobertura, cuidados e seguro só quando comprovados.",
          "priority": 2,
          "sort_order": 3,
          "notes": "Acervo do titular: Veículos e Transportes.pdf, p.1, 2025-06-26; recorte: Empresas de mudanças. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "c88d6c11-ac04-5df5-a599-3c3052ef31ca",
          "item_key": "evidence_limitations",
          "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
          "priority": 3,
          "sort_order": 4,
          "notes": "Fontes aproveitadas: Veículos e Transportes.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida."
        }
      ]
    },
    {
      "id": "05d666b4-ad53-53fc-bbaf-87ddab20269f",
      "taxon_slug": "escolas-de-educacao-basica",
      "research_block": "market_intelligence",
      "audience_scope": "business_buyer",
      "version": 1,
      "status": "active",
      "items": [
        {
          "id": "71b2ea8c-c74f-5c53-80c3-9db1d6a60f9f",
          "item_key": "market_overview",
          "item_text": "O quadro reúne educação básica e diferenças entre escolas, sem separar artificialmente cada etapa em nicho.",
          "priority": 2,
          "sort_order": 1,
          "notes": "Acervo do titular: Educação.pdf, p.1, 2025-06-25; recorte: Colégios (Fundamental/Médio). Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "604588c8-18b3-5a1d-b1d3-576fbff9dbef",
          "item_key": "digital_maturity",
          "item_text": "A observação histórica aponta adoção digital variável entre instituições.",
          "priority": 2,
          "sort_order": 2,
          "notes": "Acervo do titular: Educação.pdf, p.1, 2025-06-25; recorte: Colégios (Fundamental/Médio). Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "ee6966f2-a177-55e3-b75e-081dd3b5a64d",
          "item_key": "communication_opportunity",
          "item_text": "Apresentar etapas atendidas, proposta pedagógica e canais de visita confirmados; não inferir qualidade de uma escola.",
          "priority": 2,
          "sort_order": 3,
          "notes": "Acervo do titular: Educação.pdf, p.1, 2025-06-25; recorte: Colégios (Fundamental/Médio). Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "50364ccd-4e0e-5cbc-96f2-9965c23b1cbe",
          "item_key": "evidence_limitations",
          "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
          "priority": 3,
          "sort_order": 4,
          "notes": "Fontes aproveitadas: Educação.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida."
        }
      ]
    },
    {
      "id": "2518abd5-c761-50d2-b29a-cf12f3a4b29e",
      "taxon_slug": "escolas-de-idiomas",
      "research_block": "market_intelligence",
      "audience_scope": "business_buyer",
      "version": 1,
      "status": "active",
      "items": [
        {
          "id": "82bd24ff-c163-5e00-9e57-2dfebbdcc946",
          "item_key": "market_overview",
          "item_text": "O acervo trata de aprendizagem de idiomas e concorrência entre escolas e franquias.",
          "priority": 2,
          "sort_order": 1,
          "notes": "Acervo do titular: Educação.pdf, p.1, 2025-06-25; recorte: Escolas de Idiomas. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "88f98569-18c8-5359-a710-364c84e38785",
          "item_key": "digital_maturity",
          "item_text": "O quadro histórico cita investimento em divulgação digital por parte das redes.",
          "priority": 2,
          "sort_order": 2,
          "notes": "Acervo do titular: Educação.pdf, p.1, 2025-06-25; recorte: Escolas de Idiomas. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "4cfd6b6c-d2da-5b11-ba3e-b329b0b3bd9b",
          "item_key": "communication_opportunity",
          "item_text": "Comunicar modalidades e objetivos de aprendizagem confirmados; método, certificação e evolução individual exigem comprovação.",
          "priority": 2,
          "sort_order": 3,
          "notes": "Acervo do titular: Educação.pdf, p.1, 2025-06-25; recorte: Escolas de Idiomas. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "a913676b-72e6-5439-826c-e3171e403ce4",
          "item_key": "evidence_limitations",
          "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
          "priority": 3,
          "sort_order": 4,
          "notes": "Fontes aproveitadas: Educação.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida."
        }
      ]
    },
    {
      "id": "03e6c2a3-493b-5601-bf29-db4c8c97bf21",
      "taxon_slug": "escolas-de-musica",
      "research_block": "market_intelligence",
      "audience_scope": "business_buyer",
      "version": 1,
      "status": "active",
      "items": [
        {
          "id": "5a913add-ccf4-5944-b3f1-a0c9fd6eec02",
          "item_key": "market_overview",
          "item_text": "O quadro trata de ensino musical para públicos diversos, sem indicadores atuais sustentados.",
          "priority": 2,
          "sort_order": 1,
          "notes": "Acervo do titular: Educação.pdf, p.1, 2025-06-25; recorte: Escolas de Música. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "9d9ba7f3-fe56-556a-a1aa-de344b05bfa3",
          "item_key": "digital_maturity",
          "item_text": "O acervo descreve exploração parcial do digital em 2025.",
          "priority": 2,
          "sort_order": 2,
          "notes": "Acervo do titular: Educação.pdf, p.1, 2025-06-25; recorte: Escolas de Música. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "fa3b6785-2505-53c0-b7f4-ae016ce14df8",
          "item_key": "communication_opportunity",
          "item_text": "Apresentar instrumentos, modalidades e experiência dos professores quando confirmados; aula experimental é possibilidade, não oferta presumida.",
          "priority": 2,
          "sort_order": 3,
          "notes": "Acervo do titular: Educação.pdf, p.1, 2025-06-25; recorte: Escolas de Música. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "454859f3-3a90-53e7-a141-9ac39d449a53",
          "item_key": "evidence_limitations",
          "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
          "priority": 3,
          "sort_order": 4,
          "notes": "Fontes aproveitadas: Educação.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida."
        }
      ]
    },
    {
      "id": "04ba8fb4-f897-5d96-bb4c-15af859a13f8",
      "taxon_slug": "escolas-de-natacao",
      "research_block": "market_intelligence",
      "audience_scope": "business_buyer",
      "version": 1,
      "status": "active",
      "items": [
        {
          "id": "8246cbee-8e7e-5b36-8e14-fd5475b8330a",
          "item_key": "market_overview",
          "item_text": "A pesquisa aborda ensino de natação com alcance local, sem comprovar escassez atual de concorrentes.",
          "priority": 2,
          "sort_order": 1,
          "notes": "Acervo do titular: Educação.pdf, p.1, 2025-06-25; recorte: Escolas de Natação. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "7a673962-8245-586a-9d34-a662c923f4c7",
          "item_key": "digital_maturity",
          "item_text": "O material de 2025 sugere digitalização inicial em parte das escolas.",
          "priority": 2,
          "sort_order": 2,
          "notes": "Acervo do titular: Educação.pdf, p.1, 2025-06-25; recorte: Escolas de Natação. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "aa0f97bf-d4b3-5687-81fc-975316b1f1e0",
          "item_key": "communication_opportunity",
          "item_text": "Esclarecer turmas, faixas atendidas e agendamento; estrutura, segurança e qualificação só com informação confirmada.",
          "priority": 2,
          "sort_order": 3,
          "notes": "Acervo do titular: Educação.pdf, p.1, 2025-06-25; recorte: Escolas de Natação. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "79b49315-66ab-51dc-b784-623cb4a0cddd",
          "item_key": "evidence_limitations",
          "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
          "priority": 3,
          "sort_order": 4,
          "notes": "Fontes aproveitadas: Educação.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida."
        }
      ]
    },
    {
      "id": "f77ed02c-86e8-5f5b-afc6-d1a1188febb4",
      "taxon_slug": "escritorios-de-advocacia",
      "research_block": "market_intelligence",
      "audience_scope": "business_buyer",
      "version": 1,
      "status": "active",
      "items": [
        {
          "id": "1475d816-3e25-5e6f-861b-7f8f121f38c0",
          "item_key": "market_overview",
          "item_text": "O material trata de serviços jurídicos com públicos e honorários diversos, sem validar renda ou demanda atual.",
          "priority": 2,
          "sort_order": 1,
          "notes": "Acervo do titular: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; recorte: Advogados. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "ef076492-8b70-51a6-9d9e-677a277c55ed",
          "item_key": "digital_maturity",
          "item_text": "A pesquisa histórica destaca conteúdo institucional e reputação.",
          "priority": 2,
          "sort_order": 2,
          "notes": "Acervo do titular: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; recorte: Advogados. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "01338f0a-d5a6-5c4d-95b0-2f21481164ae",
          "item_key": "communication_opportunity",
          "item_text": "Apresentar atuação confirmada e conteúdo informativo; publicidade exige verificação normativa própria e não promessa de êxito.",
          "priority": 2,
          "sort_order": 3,
          "notes": "Acervo do titular: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; recorte: Advogados. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "bfae781b-0c21-5949-b10f-feb70d56fc9f",
          "item_key": "evidence_limitations",
          "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
          "priority": 3,
          "sort_order": 4,
          "notes": "Fontes aproveitadas: Serviços Profissionais Consultoria.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida."
        }
      ]
    },
    {
      "id": "3c675b4d-43d4-52da-a2dc-eba41130917d",
      "taxon_slug": "escritorios-de-arquitetura",
      "research_block": "market_intelligence",
      "audience_scope": "business_buyer",
      "version": 1,
      "status": "active",
      "items": [
        {
          "id": "04a159b8-8b90-51e7-8c63-53b8aafd4373",
          "item_key": "market_overview",
          "item_text": "O acervo descreve projetos de arquitetura e mercado heterogêneo, sem validar honorários ou rendimentos.",
          "priority": 2,
          "sort_order": 1,
          "notes": "Acervo do titular: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; recorte: Arquitetos. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "3da66b63-d2f1-5037-a7bf-2f66ac82977d",
          "item_key": "digital_maturity",
          "item_text": "A leitura de 2025 cita portfólio visual e descoberta local.",
          "priority": 2,
          "sort_order": 2,
          "notes": "Acervo do titular: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; recorte: Arquitetos. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "e05c9adc-dee2-55dd-8a2a-56d6cb4d86a3",
          "item_key": "communication_opportunity",
          "item_text": "Organizar projetos e processo de atendimento comprovados; autoria, imagens e especialização dependem de autorização e prova.",
          "priority": 2,
          "sort_order": 3,
          "notes": "Acervo do titular: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; recorte: Arquitetos. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "74109068-e74f-5e30-bbf4-77d19d0bbe0a",
          "item_key": "evidence_limitations",
          "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
          "priority": 3,
          "sort_order": 4,
          "notes": "Fontes aproveitadas: Serviços Profissionais Consultoria.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida."
        }
      ]
    },
    {
      "id": "a438c7b8-abbd-5df4-ac1c-0e00308ac29f",
      "taxon_slug": "escritorios-de-assessoria-de-investimentos",
      "research_block": "market_intelligence",
      "audience_scope": "business_buyer",
      "version": 1,
      "status": "active",
      "items": [
        {
          "id": "7b02351b-ffa2-5500-8deb-f8bdafa00103",
          "item_key": "market_overview",
          "item_text": "O acervo trata de assessoria de investimentos e relacionamento; não valida crescimento, comissões ou retorno.",
          "priority": 2,
          "sort_order": 1,
          "notes": "Acervo do titular: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; recorte: Escritórios de Investimento. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "75b4325a-6867-56f0-bcb1-112a4fb1a5aa",
          "item_key": "digital_maturity",
          "item_text": "A pesquisa histórica cita educação, conteúdo e relacionamento digital.",
          "priority": 2,
          "sort_order": 2,
          "notes": "Acervo do titular: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; recorte: Escritórios de Investimento. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "a26b4925-f602-5fe7-ab31-fe2dd09b5dc6",
          "item_key": "communication_opportunity",
          "item_text": "Explicar serviço e público atendido com confirmação; não oferecer recomendação financeira ou prometer rentabilidade.",
          "priority": 2,
          "sort_order": 3,
          "notes": "Acervo do titular: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; recorte: Escritórios de Investimento. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "b39898b6-c834-54dd-9319-c5750ac13eaf",
          "item_key": "evidence_limitations",
          "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
          "priority": 3,
          "sort_order": 4,
          "notes": "Fontes aproveitadas: Serviços Profissionais Consultoria.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida."
        }
      ]
    },
    {
      "id": "39c4cb19-e78f-508d-a78e-88ec8352af47",
      "taxon_slug": "escritorios-de-contabilidade",
      "research_block": "market_intelligence",
      "audience_scope": "business_buyer",
      "version": 1,
      "status": "active",
      "items": [
        {
          "id": "503525fb-86c5-544c-8274-5b6d4fd3a53c",
          "item_key": "market_overview",
          "item_text": "O material descreve atendimento contábil recorrente e concorrência, sem validar faturamento ou retenção.",
          "priority": 2,
          "sort_order": 1,
          "notes": "Acervo do titular: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; recorte: Contadores. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "9916cd34-0b6a-514f-a378-bbcf5a4a034f",
          "item_key": "digital_maturity",
          "item_text": "O acervo de 2025 cita uso de redes e mensagens com profissionalização desigual.",
          "priority": 2,
          "sort_order": 2,
          "notes": "Acervo do titular: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; recorte: Contadores. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "20cc1990-888b-510b-b8a1-24bbd7a49515",
          "item_key": "communication_opportunity",
          "item_text": "Clarificar escopo e atendimento; especialização e agilidade só quando confirmadas, sem prometer economia tributária.",
          "priority": 2,
          "sort_order": 3,
          "notes": "Acervo do titular: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; recorte: Contadores. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "7ac1579f-f905-520a-a35d-c07f4adfc453",
          "item_key": "evidence_limitations",
          "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
          "priority": 3,
          "sort_order": 4,
          "notes": "Fontes aproveitadas: Serviços Profissionais Consultoria.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida."
        }
      ]
    },
    {
      "id": "b48f71c3-50a1-57f5-8661-b3239735fde1",
      "taxon_slug": "fabricantes-de-materiais-de-construcao",
      "research_block": "market_intelligence",
      "audience_scope": "business_buyer",
      "version": 1,
      "status": "active",
      "items": [
        {
          "id": "2bc86bb4-cc27-52d4-8986-cd6ee8663220",
          "item_key": "market_overview",
          "item_text": "O documento distingue fabricação e fornecimento em lotes do comércio varejista, sem validar indicadores industriais atuais.",
          "priority": 2,
          "sort_order": 1,
          "notes": "Acervo do titular: Imobiliário Construção.pdf, p.1, 2025-06-26; recorte: Material de Construção (Indústria). Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "95399b11-c468-5984-a808-529c795299c0",
          "item_key": "digital_maturity",
          "item_text": "A pesquisa histórica cita comunicação institucional e técnica entre empresas.",
          "priority": 2,
          "sort_order": 2,
          "notes": "Acervo do titular: Imobiliário Construção.pdf, p.1, 2025-06-26; recorte: Material de Construção (Indústria). Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "10138ce1-9317-52ef-8a06-0ec7b560ff84",
          "item_key": "communication_opportunity",
          "item_text": "Apresentar especificações verificadas e canais de fornecimento; qualidade certificada, escala e prazos exigem prova.",
          "priority": 2,
          "sort_order": 3,
          "notes": "Acervo do titular: Imobiliário Construção.pdf, p.1, 2025-06-26; recorte: Material de Construção (Indústria). Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "b27a059a-2fa2-50e7-b0b8-c7dc15bc1046",
          "item_key": "evidence_limitations",
          "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
          "priority": 3,
          "sort_order": 4,
          "notes": "Fontes aproveitadas: Imobiliário Construção.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida."
        }
      ]
    },
    {
      "id": "1bc90f27-db13-5b45-b180-cb12cedc0bb0",
      "taxon_slug": "faculdades",
      "research_block": "market_intelligence",
      "audience_scope": "business_buyer",
      "version": 1,
      "status": "active",
      "items": [
        {
          "id": "f3c78e34-25db-5975-a4f8-505cd2b1d24f",
          "item_key": "market_overview",
          "item_text": "A pesquisa cobre ensino superior privado e ciclos de captação; titularidade privada é contexto da análise, sem categoria adicional.",
          "priority": 2,
          "sort_order": 1,
          "notes": "Acervo do titular: Educação.pdf, p.1, 2025-06-25; recorte: Faculdades Privadas. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "421653da-eb41-5b3d-a0f1-c7b6cf7b616a",
          "item_key": "digital_maturity",
          "item_text": "O quadro de 2025 menciona anúncios, inbound e CRM, sem aferição atual.",
          "priority": 2,
          "sort_order": 2,
          "notes": "Acervo do titular: Educação.pdf, p.1, 2025-06-25; recorte: Faculdades Privadas. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "678c635e-c322-5d4c-a6dc-e6ce1aa3587b",
          "item_key": "communication_opportunity",
          "item_text": "Organizar cursos, formas de ingresso e informação institucional verificável; não prometer empregabilidade ou resultado.",
          "priority": 2,
          "sort_order": 3,
          "notes": "Acervo do titular: Educação.pdf, p.1, 2025-06-25; recorte: Faculdades Privadas. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "4489dfaa-7824-5600-bda7-79966a3c7ffa",
          "item_key": "evidence_limitations",
          "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
          "priority": 3,
          "sort_order": 4,
          "notes": "Fontes aproveitadas: Educação.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida."
        }
      ]
    },
    {
      "id": "63e12d86-2f4f-5ff7-ace8-8c2a8b98f676",
      "taxon_slug": "farmacias",
      "research_block": "market_intelligence",
      "audience_scope": "business_buyer",
      "version": 1,
      "status": "active",
      "items": [
        {
          "id": "503af7d4-dae3-5ce6-a060-83a5c3f70698",
          "item_key": "market_overview",
          "item_text": "O quadro diferencia redes e farmácias independentes, sem validar margens ou faturamento atual.",
          "priority": 2,
          "sort_order": 1,
          "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Farmácia. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "1460e065-474c-5ec1-949b-010f592269f0",
          "item_key": "digital_maturity",
          "item_text": "A pesquisa de 2025 cita descoberta local e canais de entrega em parte das operações.",
          "priority": 2,
          "sort_order": 2,
          "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Farmácia. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "1490907c-e4e1-54a7-8885-ece3f60897ce",
          "item_key": "communication_opportunity",
          "item_text": "Esclarecer localização, horário e serviços permitidos e confirmados; não produzir recomendações de medicamentos.",
          "priority": 2,
          "sort_order": 3,
          "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Farmácia. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "890e4ac6-b343-5d61-bcd6-169a4f1d3609",
          "item_key": "evidence_limitations",
          "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
          "priority": 3,
          "sort_order": 4,
          "notes": "Fontes aproveitadas: Saúde e Bem-estar.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida."
        }
      ]
    },
    {
      "id": "68aea8e0-d763-5597-850e-f294df298fd8",
      "taxon_slug": "fisioterapia",
      "research_block": "market_intelligence",
      "audience_scope": "business_buyer",
      "version": 1,
      "status": "active",
      "items": [
        {
          "id": "22d76f1a-16ef-53a6-a3bf-0ecccba322fb",
          "item_key": "market_overview",
          "item_text": "O material trata de acompanhamento fisioterapêutico, sem validar volume de profissionais ou efeitos de tratamento.",
          "priority": 2,
          "sort_order": 1,
          "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Fisioterapia. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "8bf00175-960c-5751-8a4f-7366a999bb89",
          "item_key": "digital_maturity",
          "item_text": "A leitura histórica cita indicação, parcerias e conteúdo informativo.",
          "priority": 2,
          "sort_order": 2,
          "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Fisioterapia. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "1b51a5fe-d317-552c-8654-2322308d95fc",
          "item_key": "communication_opportunity",
          "item_text": "Apresentar modalidades e atendimento real; não inferir indicação clínica nem prometer recuperação.",
          "priority": 2,
          "sort_order": 3,
          "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Fisioterapia. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "ff14fdef-6d79-5448-b1fa-95a1114f990c",
          "item_key": "evidence_limitations",
          "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
          "priority": 3,
          "sort_order": 4,
          "notes": "Fontes aproveitadas: Saúde e Bem-estar.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida."
        }
      ]
    },
    {
      "id": "4b304c4e-01a8-51dc-b0dd-8fa2f5ca2d41",
      "taxon_slug": "harmonizacao-facial",
      "research_block": "market_intelligence",
      "audience_scope": "business_buyer",
      "version": 1,
      "status": "active",
      "items": [
        {
          "id": "c4708b98-5166-547b-858f-a70ca5b1eeb7",
          "item_key": "market_overview",
          "item_text": "A pesquisa cobre harmonização facial e procedimentos contextuais; preservada a categoria existente.",
          "priority": 2,
          "sort_order": 1,
          "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Harmonização Facial. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "1ee13249-c813-5ebe-907d-d0221bdd2747",
          "item_key": "digital_maturity",
          "item_text": "O quadro histórico enfatiza conteúdo visual e concorrência digital, sem validar saturação atual.",
          "priority": 2,
          "sort_order": 2,
          "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Harmonização Facial. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "5cd64430-8f50-5f50-bd99-69dc32f9880d",
          "item_key": "communication_opportunity",
          "item_text": "Informar apenas atuação e atendimento confirmados; resultado, habilitação e publicidade exigem verificação própria.",
          "priority": 2,
          "sort_order": 3,
          "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Harmonização Facial. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "eb8deeed-a8f1-5121-96ca-8547ab0bd2a9",
          "item_key": "evidence_limitations",
          "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
          "priority": 3,
          "sort_order": 4,
          "notes": "Fontes aproveitadas: Saúde e Bem-estar.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida."
        }
      ]
    },
    {
      "id": "106aab43-8724-516f-8ef4-7513d564eb5f",
      "taxon_slug": "hospitais",
      "research_block": "market_intelligence",
      "audience_scope": "business_buyer",
      "version": 1,
      "status": "active",
      "items": [
        {
          "id": "0934b6d1-b60d-52dc-ba90-333b691a9f94",
          "item_key": "market_overview",
          "item_text": "A pesquisa aborda organizações hospitalares e reputação, sem sustentar contagem ou crescimento atual.",
          "priority": 2,
          "sort_order": 1,
          "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Hospitais. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "cdba7b91-3d42-5cf7-8f36-e8e9616e950a",
          "item_key": "digital_maturity",
          "item_text": "O acervo histórico cita comunicação institucional e agendamento em parte do setor.",
          "priority": 2,
          "sort_order": 2,
          "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Hospitais. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "7da3bfbc-ab4c-52d9-bdcd-8fc7e454a0a6",
          "item_key": "communication_opportunity",
          "item_text": "Esclarecer serviços e acesso confirmados; acreditação, equipe e diferenciais clínicos exigem prova.",
          "priority": 2,
          "sort_order": 3,
          "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Hospitais. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "0f9ee6c5-bb72-57bb-a59d-c61ea87a08f0",
          "item_key": "evidence_limitations",
          "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
          "priority": 3,
          "sort_order": 4,
          "notes": "Fontes aproveitadas: Saúde e Bem-estar.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida."
        }
      ]
    },
    {
      "id": "e6b25ac2-0744-5938-adcf-85aa3029b1fc",
      "taxon_slug": "hoteis",
      "research_block": "market_intelligence",
      "audience_scope": "business_buyer",
      "version": 1,
      "status": "active",
      "items": [
        {
          "id": "70b558c9-f80f-570e-9249-080f7498b2a9",
          "item_key": "market_overview",
          "item_text": "A pesquisa distingue distribuição por intermediários e reservas diretas; a retomada econômica descrita pertence ao período histórico.",
          "priority": 2,
          "sort_order": 1,
          "notes": "Acervo do titular: Hotelaria e Turismo.pdf, p.1, 2025-06-26; recorte: Hotéis (Hotelaria). Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "0d77c61d-a9ad-591e-b9ff-1fb8e4175060",
          "item_key": "digital_maturity",
          "item_text": "O acervo de 2025 cita portais de reserva, site, busca e redes, com adoção desigual.",
          "priority": 2,
          "sort_order": 2,
          "notes": "Acervo do titular: Hotelaria e Turismo.pdf, p.1, 2025-06-26; recorte: Hotéis (Hotelaria). Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "59929fbb-3a71-5f7f-b48c-35987fc0f6be",
          "item_key": "communication_opportunity",
          "item_text": "Esclarecer acomodação, localização e condições reais de reserva; reservas diretas e experiência são possibilidades condicionais.",
          "priority": 2,
          "sort_order": 3,
          "notes": "Acervo do titular: Hotelaria e Turismo.pdf, p.1, 2025-06-26; recorte: Hotéis (Hotelaria). Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "633e3fa9-70a2-5c81-892b-d2256d4a5073",
          "item_key": "evidence_limitations",
          "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
          "priority": 3,
          "sort_order": 4,
          "notes": "Fontes aproveitadas: Hotelaria e Turismo.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida."
        }
      ]
    },
    {
      "id": "1faa0522-effd-52bb-80de-8967130856f9",
      "taxon_slug": "imobiliarias",
      "research_block": "market_intelligence",
      "audience_scope": "business_buyer",
      "version": 1,
      "status": "active",
      "items": [
        {
          "id": "3cf945f3-f03c-53d8-bde4-4d9cdd4e025b",
          "item_key": "market_overview",
          "item_text": "O material trata de intermediação de imóveis e concorrência local; crescimento de vendas e comissões são históricos não validados.",
          "priority": 2,
          "sort_order": 1,
          "notes": "Acervo do titular: Imobiliário Construção.pdf, p.1, 2025-06-26; recorte: Imobiliárias. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "53601b45-4ffa-503c-9d1b-255784f1efe2",
          "item_key": "digital_maturity",
          "item_text": "A pesquisa cita portais, redes e necessidade de organização de dados, como observações de 2025.",
          "priority": 2,
          "sort_order": 2,
          "notes": "Acervo do titular: Imobiliário Construção.pdf, p.1, 2025-06-26; recorte: Imobiliárias. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "0bb532b6-88a0-572c-a87c-e46fcdf75bc7",
          "item_key": "communication_opportunity",
          "item_text": "Qualificar apresentação dos imóveis e contato; atendimento e experiência local só se comprovados.",
          "priority": 2,
          "sort_order": 3,
          "notes": "Acervo do titular: Imobiliário Construção.pdf, p.1, 2025-06-26; recorte: Imobiliárias. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "a0b599e2-fe49-5f31-8546-8a960b337546",
          "item_key": "evidence_limitations",
          "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
          "priority": 3,
          "sort_order": 4,
          "notes": "Fontes aproveitadas: Imobiliário Construção.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida."
        }
      ]
    },
    {
      "id": "2e4a461d-27a6-57c0-a0d0-2283d8f379f3",
      "taxon_slug": "joalherias",
      "research_block": "market_intelligence",
      "audience_scope": "business_buyer",
      "version": 1,
      "status": "active",
      "items": [
        {
          "id": "5feb7257-970a-5001-adf6-1c9f270f4996",
          "item_key": "market_overview",
          "item_text": "O quadro trata de joias e decisão de compra por confiança e apresentação, sem validar margens ou crescimento.",
          "priority": 2,
          "sort_order": 1,
          "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Joalheria. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "680e6f62-ce2e-503b-938a-bf44a0bdcada",
          "item_key": "digital_maturity",
          "item_text": "O acervo de 2025 enfatiza marca e conteúdo visual.",
          "priority": 2,
          "sort_order": 2,
          "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Joalheria. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "4e01c64b-3448-5a9c-8b45-c0d892a72afb",
          "item_key": "communication_opportunity",
          "item_text": "Apresentar peças e informações verificadas; autenticidade, material e certificação exigem prova.",
          "priority": 2,
          "sort_order": 3,
          "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Joalheria. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "649016a4-d7f2-5098-b9ef-6c6b0c801bde",
          "item_key": "evidence_limitations",
          "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
          "priority": 3,
          "sort_order": 4,
          "notes": "Fontes aproveitadas: Varejo e Comércio Local 2.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida."
        }
      ]
    },
    {
      "id": "c0b7e6ce-81be-534d-94ff-487dfe9e5b96",
      "taxon_slug": "lojas-de-baterias-automotivas",
      "research_block": "market_intelligence",
      "audience_scope": "business_buyer",
      "version": 1,
      "status": "active",
      "items": [
        {
          "id": "4eae0e9f-4381-5111-b4a5-37cfd9252efc",
          "item_key": "market_overview",
          "item_text": "O quadro cobre comércio de baterias automotivas, distinto de produto isolado por haver loja explicitada na lista.",
          "priority": 2,
          "sort_order": 1,
          "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Bateria de Carro. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "de34caf0-437b-5f50-968d-4ce044e55d97",
          "item_key": "digital_maturity",
          "item_text": "A observação histórica sugere adoção digital inicial ou intermediária.",
          "priority": 2,
          "sort_order": 2,
          "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Bateria de Carro. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "7d65c29f-0039-54e0-99b8-33f94f268516",
          "item_key": "communication_opportunity",
          "item_text": "Facilitar localização e consulta de compatibilidade; estoque, instalação e urgência só com confirmação.",
          "priority": 2,
          "sort_order": 3,
          "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Bateria de Carro. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "89600a82-2adb-5e6e-92ab-d7307e8f0849",
          "item_key": "evidence_limitations",
          "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
          "priority": 3,
          "sort_order": 4,
          "notes": "Fontes aproveitadas: Varejo e Comércio Local 2.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida."
        }
      ]
    },
    {
      "id": "2c88749f-ab50-563b-9525-b67103b77ada",
      "taxon_slug": "lojas-de-calcados",
      "research_block": "market_intelligence",
      "audience_scope": "business_buyer",
      "version": 1,
      "status": "active",
      "items": [
        {
          "id": "2963b3d2-8ab7-5f49-ab7c-350869d45949",
          "item_key": "market_overview",
          "item_text": "O acervo aborda varejo de calçados, sem validar crescimento ou margem atuais.",
          "priority": 2,
          "sort_order": 1,
          "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Loja de Sapatos. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "45900b9c-b332-5793-a45c-6e571a81a5c3",
          "item_key": "digital_maturity",
          "item_text": "O quadro de 2025 enfatiza comunicação visual e social.",
          "priority": 2,
          "sort_order": 2,
          "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Loja de Sapatos. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "67a50833-26a6-566e-b5b5-b491c1ef8285",
          "item_key": "communication_opportunity",
          "item_text": "Mostrar modelos e numeração disponíveis; conforto, troca e entrega exigem informação real.",
          "priority": 2,
          "sort_order": 3,
          "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Loja de Sapatos. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "3f779ba9-7846-5835-baa8-d1d45eaaa368",
          "item_key": "evidence_limitations",
          "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
          "priority": 3,
          "sort_order": 4,
          "notes": "Fontes aproveitadas: Varejo e Comércio Local 2.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida."
        }
      ]
    },
    {
      "id": "6b17c125-7bdb-5415-996b-185af1d5e22c",
      "taxon_slug": "lojas-de-cama-mesa-e-banho",
      "research_block": "market_intelligence",
      "audience_scope": "business_buyer",
      "version": 1,
      "status": "active",
      "items": [
        {
          "id": "df7c5ac7-1634-5374-a4ce-3fb670f19f14",
          "item_key": "market_overview",
          "item_text": "O quadro trata de varejo de têxteis domésticos, sem validar crescimento ou rentabilidade.",
          "priority": 2,
          "sort_order": 1,
          "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Cama, Mesa e Banho. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "e8336bc1-539f-5844-bdb2-8582bbeb93af",
          "item_key": "digital_maturity",
          "item_text": "O acervo de 2025 cita abertura desigual a canais digitais.",
          "priority": 2,
          "sort_order": 2,
          "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Cama, Mesa e Banho. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "86f50cfa-9cc0-5161-8b3c-b900481c294d",
          "item_key": "communication_opportunity",
          "item_text": "Apresentar composição, medidas e linhas reais; qualidade superior e procedência exigem comprovação.",
          "priority": 2,
          "sort_order": 3,
          "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Cama, Mesa e Banho. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "97ffbe68-cc7c-5fc0-8d2c-7010abb572dc",
          "item_key": "evidence_limitations",
          "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
          "priority": 3,
          "sort_order": 4,
          "notes": "Fontes aproveitadas: Varejo e Comércio Local 2.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida."
        }
      ]
    },
    {
      "id": "cfa009ea-1284-52fb-bf51-124737060a6d",
      "taxon_slug": "lojas-de-colchoes",
      "research_block": "market_intelligence",
      "audience_scope": "business_buyer",
      "version": 1,
      "status": "active",
      "items": [
        {
          "id": "b9ca4acd-d2f8-5a4f-8830-19aafb355842",
          "item_key": "market_overview",
          "item_text": "O material descreve compra de maior consideração, sem validar ticket ou retorno de anúncios.",
          "priority": 2,
          "sort_order": 1,
          "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Loja de Colchão. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "a3119aca-e185-5cf4-8ed4-21b757519efe",
          "item_key": "digital_maturity",
          "item_text": "O quadro histórico associa canais digitais à geração de interessados.",
          "priority": 2,
          "sort_order": 2,
          "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Loja de Colchão. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "d90856fb-62aa-52f9-9c51-92a9cdc87d01",
          "item_key": "communication_opportunity",
          "item_text": "Esclarecer características verificadas e condições de compra; benefício de saúde e garantia não são presumidos.",
          "priority": 2,
          "sort_order": 3,
          "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Loja de Colchão. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "6c7be112-706f-5c21-ac70-ef4e538332ac",
          "item_key": "evidence_limitations",
          "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
          "priority": 3,
          "sort_order": 4,
          "notes": "Fontes aproveitadas: Varejo e Comércio Local 2.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida."
        }
      ]
    },
    {
      "id": "cfa04ae3-d989-5a72-a155-84d4f96f9fb0",
      "taxon_slug": "lojas-de-cosmeticos-e-perfumes",
      "research_block": "market_intelligence",
      "audience_scope": "business_buyer",
      "version": 1,
      "status": "active",
      "items": [
        {
          "id": "ed3e06ca-6814-5584-b774-3416c7f76fde",
          "item_key": "market_overview",
          "item_text": "A pesquisa trata de varejo de cosméticos e perfumes, sem validar indicadores atuais do setor.",
          "priority": 2,
          "sort_order": 1,
          "notes": "Acervo do titular: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; recorte: Maquiagem/Perfumaria. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "cb5bda02-187a-54a9-a974-f2fef245b4d3",
          "item_key": "digital_maturity",
          "item_text": "O material de 2025 cita conteúdo visual e integração de vendas físicas e online.",
          "priority": 2,
          "sort_order": 2,
          "notes": "Acervo do titular: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; recorte: Maquiagem/Perfumaria. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "fd50bea3-d979-56fb-b266-19426c155af6",
          "item_key": "communication_opportunity",
          "item_text": "Apresentar produtos e condições reais; procedência, marcas e aconselhamento não podem ser presumidos.",
          "priority": 2,
          "sort_order": 3,
          "notes": "Acervo do titular: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; recorte: Maquiagem/Perfumaria. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "400225a7-38ba-5bf9-adbe-81dd5eacf622",
          "item_key": "evidence_limitations",
          "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
          "priority": 3,
          "sort_order": 4,
          "notes": "Fontes aproveitadas: Varejo e Comércio Local 1.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida."
        }
      ]
    },
    {
      "id": "0a8d7814-ed9b-5a9f-babd-5be9142a1c62",
      "taxon_slug": "lojas-de-iluminacao",
      "research_block": "market_intelligence",
      "audience_scope": "business_buyer",
      "version": 1,
      "status": "active",
      "items": [
        {
          "id": "08ebb41d-49e4-5f88-90a0-d42cbbcbb4b1",
          "item_key": "market_overview",
          "item_text": "O acervo cobre comércio de iluminação com mix e valores heterogêneos.",
          "priority": 2,
          "sort_order": 1,
          "notes": "Acervo do titular: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; recorte: Lojas de Iluminação. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "68b7f6f1-7f9c-5529-8865-94d693f5f39d",
          "item_key": "digital_maturity",
          "item_text": "A leitura histórica indica adoção digital desigual.",
          "priority": 2,
          "sort_order": 2,
          "notes": "Acervo do titular: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; recorte: Lojas de Iluminação. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "d55f47bc-1508-5c10-b519-bb36bd555fbf",
          "item_key": "communication_opportunity",
          "item_text": "Explicar aplicações e especificações verificadas; consultoria técnica e projeto só quando realmente oferecidos.",
          "priority": 2,
          "sort_order": 3,
          "notes": "Acervo do titular: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; recorte: Lojas de Iluminação. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "76495d97-fb4d-522a-a467-6c863c388165",
          "item_key": "evidence_limitations",
          "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
          "priority": 3,
          "sort_order": 4,
          "notes": "Fontes aproveitadas: Varejo e Comércio Local 1.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida."
        }
      ]
    },
    {
      "id": "33cbabb9-1844-50da-b1a3-47d554182249",
      "taxon_slug": "lojas-de-informatica",
      "research_block": "market_intelligence",
      "audience_scope": "business_buyer",
      "version": 1,
      "status": "active",
      "items": [
        {
          "id": "9f71cca0-9866-599f-a4c1-c5d7a268657c",
          "item_key": "market_overview",
          "item_text": "O quadro descreve comércio de informática sem comprovar ticket, margens ou estabilidade atuais.",
          "priority": 2,
          "sort_order": 1,
          "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Loja de Informática. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "1fc509e3-6e73-59af-959e-52e9cf723324",
          "item_key": "digital_maturity",
          "item_text": "O acervo histórico associa descoberta digital a pesquisa de produtos.",
          "priority": 2,
          "sort_order": 2,
          "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Loja de Informática. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "b718e3a2-268e-50e9-8fee-80224d460423",
          "item_key": "communication_opportunity",
          "item_text": "Facilitar comparação e orçamento de itens reais; suporte ou manutenção só quando confirmados.",
          "priority": 2,
          "sort_order": 3,
          "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Loja de Informática. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "12778d66-be5c-54f6-801f-b9dc71d74528",
          "item_key": "evidence_limitations",
          "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
          "priority": 3,
          "sort_order": 4,
          "notes": "Fontes aproveitadas: Varejo e Comércio Local 2.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida."
        }
      ]
    },
    {
      "id": "c530d2ac-d0f5-5644-9126-8e4df34f0521",
      "taxon_slug": "lojas-de-materiais-de-construcao",
      "research_block": "market_intelligence",
      "audience_scope": "business_buyer",
      "version": 1,
      "status": "active",
      "items": [
        {
          "id": "c25c591a-1e54-5e78-96d8-f7f3db254f29",
          "item_key": "market_overview",
          "item_text": "O quadro trata do varejo para obras e reformas, distinto de fabricação de materiais.",
          "priority": 2,
          "sort_order": 1,
          "notes": "Acervo do titular: Imobiliário Construção.pdf, p.1, 2025-06-26; recorte: Lojas de Material (Varejo). Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "5ebedfe9-45ca-5bde-9465-205c96e6ee4e",
          "item_key": "digital_maturity",
          "item_text": "A observação de 2025 sugere digitalização desigual de lojas locais.",
          "priority": 2,
          "sort_order": 2,
          "notes": "Acervo do titular: Imobiliário Construção.pdf, p.1, 2025-06-26; recorte: Lojas de Material (Varejo). Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "d43c27d9-3134-557e-98d4-9e9e6ac308b7",
          "item_key": "communication_opportunity",
          "item_text": "Facilitar consulta de produtos e orçamento; estoque, entrega e atendimento técnico somente quando confirmados.",
          "priority": 2,
          "sort_order": 3,
          "notes": "Acervo do titular: Imobiliário Construção.pdf, p.1, 2025-06-26; recorte: Lojas de Material (Varejo). Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "ba2dbaec-bee3-54c1-955a-0e58e11de1a2",
          "item_key": "evidence_limitations",
          "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
          "priority": 3,
          "sort_order": 4,
          "notes": "Fontes aproveitadas: Imobiliário Construção.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida."
        }
      ]
    },
    {
      "id": "095dab3e-8153-5d04-8b60-ddf2a901e195",
      "taxon_slug": "lojas-de-moveis",
      "research_block": "market_intelligence",
      "audience_scope": "business_buyer",
      "version": 1,
      "status": "active",
      "items": [
        {
          "id": "d8719718-c92d-51ca-abfe-699ca2595d54",
          "item_key": "market_overview",
          "item_text": "O material cobre móveis de varejo, distinto do projeto sob medida.",
          "priority": 2,
          "sort_order": 1,
          "notes": "Acervo do titular: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; recorte: Lojas de Móveis. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "f45dc329-ad61-5df4-81dc-1979eb249d33",
          "item_key": "digital_maturity",
          "item_text": "A leitura de 2025 sugere combinação de visita física e pesquisa online.",
          "priority": 2,
          "sort_order": 2,
          "notes": "Acervo do titular: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; recorte: Lojas de Móveis. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "abb26317-5464-5d3d-a724-4628e3dfa276",
          "item_key": "communication_opportunity",
          "item_text": "Organizar produtos e medidas verificadas; entrega, montagem e estoque dependem de confirmação.",
          "priority": 2,
          "sort_order": 3,
          "notes": "Acervo do titular: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; recorte: Lojas de Móveis. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "ed85bc68-38e8-5dee-a623-e2f24a1c10b9",
          "item_key": "evidence_limitations",
          "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
          "priority": 3,
          "sort_order": 4,
          "notes": "Fontes aproveitadas: Varejo e Comércio Local 1.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida."
        }
      ]
    },
    {
      "id": "be721a6d-b5c1-5087-a221-cebd855380a3",
      "taxon_slug": "lojas-de-pneus",
      "research_block": "market_intelligence",
      "audience_scope": "business_buyer",
      "version": 1,
      "status": "active",
      "items": [
        {
          "id": "98d48695-a648-518e-8d94-bfe6ac461b9c",
          "item_key": "market_overview",
          "item_text": "A análise cobre comércio de pneus; o valor original de um jogo com unidade monetária inconsistente foi omitido, assim como os demais indicadores sem fonte rastreável.",
          "priority": 2,
          "sort_order": 1,
          "notes": "Acervo do titular: Veículos e Transportes.pdf, p.1, 2025-06-26; recorte: Lojas de pneus. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "af371107-844e-5ba3-a5eb-3435bb3043af",
          "item_key": "digital_maturity",
          "item_text": "A pesquisa histórica diferencia grandes canais online e divulgação local de pequenas lojas.",
          "priority": 2,
          "sort_order": 2,
          "notes": "Acervo do titular: Veículos e Transportes.pdf, p.1, 2025-06-26; recorte: Lojas de pneus. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "7adef79d-ab90-5afb-8e77-8a4abec63f13",
          "item_key": "communication_opportunity",
          "item_text": "Facilitar busca por especificação e orçamento; compatibilidade, instalação e estoque precisam de verificação.",
          "priority": 2,
          "sort_order": 3,
          "notes": "Acervo do titular: Veículos e Transportes.pdf, p.1, 2025-06-26; recorte: Lojas de pneus. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "86eebe16-b6a1-563a-b217-8181ad5a8d41",
          "item_key": "evidence_limitations",
          "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
          "priority": 3,
          "sort_order": 4,
          "notes": "Fontes aproveitadas: Veículos e Transportes.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida."
        }
      ]
    },
    {
      "id": "85d331a2-c4ff-51fa-9a4e-26b99e724824",
      "taxon_slug": "lojas-de-roupa",
      "research_block": "market_intelligence",
      "audience_scope": "business_buyer",
      "version": 1,
      "status": "active",
      "items": [
        {
          "id": "0a7d00ef-b642-5778-b947-546f41f8aebe",
          "item_key": "market_overview",
          "item_text": "O acervo descreve competição e renovação de oferta de vestuário, sem validar crescimento ou margens atuais.",
          "priority": 2,
          "sort_order": 1,
          "notes": "Acervo do titular: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; recorte: Lojas de Roupa. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "c1264783-a6d5-5b94-8525-079428375c8f",
          "item_key": "digital_maturity",
          "item_text": "A pesquisa histórica enfatiza presença visual em redes.",
          "priority": 2,
          "sort_order": 2,
          "notes": "Acervo do titular: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; recorte: Lojas de Roupa. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "a6b8ccd0-aab2-531a-bf64-39a03d695ad3",
          "item_key": "communication_opportunity",
          "item_text": "Apresentar coleção e disponibilidade reais; estilo, atendimento e integração de canais são possibilidades condicionais.",
          "priority": 2,
          "sort_order": 3,
          "notes": "Acervo do titular: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; recorte: Lojas de Roupa. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "5c6e66a3-bf01-54a8-86de-92986b2213bc",
          "item_key": "evidence_limitations",
          "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
          "priority": 3,
          "sort_order": 4,
          "notes": "Fontes aproveitadas: Varejo e Comércio Local 1.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida."
        }
      ]
    },
    {
      "id": "f19a300b-6d9d-5ecd-8cab-6f890d10d413",
      "taxon_slug": "lojas-de-utilidades-domesticas",
      "research_block": "market_intelligence",
      "audience_scope": "business_buyer",
      "version": 1,
      "status": "active",
      "items": [
        {
          "id": "e1f7a14c-8b5b-514f-92bf-e06e731a4673",
          "item_key": "market_overview",
          "item_text": "O documento aborda comércio de utilidades domésticas e variedade, sem sustentar margens atuais.",
          "priority": 2,
          "sort_order": 1,
          "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Utilidades do Lar. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "1f913f93-b53a-5948-bf92-9594d3832e61",
          "item_key": "digital_maturity",
          "item_text": "A observação de 2025 sugere maturidade digital variável.",
          "priority": 2,
          "sort_order": 2,
          "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Utilidades do Lar. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "32334a44-b3c0-5241-beda-d271f58776b6",
          "item_key": "communication_opportunity",
          "item_text": "Organizar categorias de produtos e conveniência real; preço e disponibilidade precisam estar confirmados.",
          "priority": 2,
          "sort_order": 3,
          "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Utilidades do Lar. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "804b07b8-66a3-5763-b0b8-326a7895f323",
          "item_key": "evidence_limitations",
          "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
          "priority": 3,
          "sort_order": 4,
          "notes": "Fontes aproveitadas: Varejo e Comércio Local 2.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida."
        }
      ]
    },
    {
      "id": "1034feee-11ae-5479-ad86-1b91d9571916",
      "taxon_slug": "moteis",
      "research_block": "market_intelligence",
      "audience_scope": "business_buyer",
      "version": 1,
      "status": "active",
      "items": [
        {
          "id": "ba14f325-72e7-52b8-9834-336289b2497b",
          "item_key": "market_overview",
          "item_text": "O material aborda hospedagem de curta permanência e reposicionamento de imagem, sem validar crescimento ou orçamento atual.",
          "priority": 2,
          "sort_order": 1,
          "notes": "Acervo do titular: Hotelaria e Turismo.pdf, p.1, 2025-06-26; recorte: Motéis (Motelaria). Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "111d05bf-3686-5ba0-95d5-08aa648bde4f",
          "item_key": "digital_maturity",
          "item_text": "A pesquisa histórica menciona descoberta local, conteúdo visual e canais próprios.",
          "priority": 2,
          "sort_order": 2,
          "notes": "Acervo do titular: Hotelaria e Turismo.pdf, p.1, 2025-06-26; recorte: Motéis (Motelaria). Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "ee8d9587-66cd-5da2-8925-9bfe75dc15f6",
          "item_key": "communication_opportunity",
          "item_text": "Comunicar privacidade e características verificadas das suítes e condições de uso; não presumir serviço, público ou padrão.",
          "priority": 2,
          "sort_order": 3,
          "notes": "Acervo do titular: Hotelaria e Turismo.pdf, p.1, 2025-06-26; recorte: Motéis (Motelaria). Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "5bb73957-5fea-58bc-8cf6-6bccb1c168a0",
          "item_key": "evidence_limitations",
          "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
          "priority": 3,
          "sort_order": 4,
          "notes": "Fontes aproveitadas: Hotelaria e Turismo.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida."
        }
      ]
    },
    {
      "id": "6fdb3f17-1fb2-5759-948c-09966870e3e8",
      "taxon_slug": "moveis-planejados",
      "research_block": "market_intelligence",
      "audience_scope": "business_buyer",
      "version": 1,
      "status": "active",
      "items": [
        {
          "id": "8165cc17-9ca9-57a0-b67b-c2fbe085bd0b",
          "item_key": "market_overview",
          "item_text": "A análise trata de projetos sob medida e decisão de compra com orçamento, sem validar rentabilidade.",
          "priority": 2,
          "sort_order": 1,
          "notes": "Acervo do titular: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; recorte: Móveis Planejados. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "09b5deb7-c73b-552a-a065-0df6c1e13e91",
          "item_key": "digital_maturity",
          "item_text": "O acervo histórico cita portfólio e geração de contatos.",
          "priority": 2,
          "sort_order": 2,
          "notes": "Acervo do titular: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; recorte: Móveis Planejados. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "825e2ea0-4af9-5f23-9c02-a7c9373daa74",
          "item_key": "communication_opportunity",
          "item_text": "Mostrar projetos autorizados e etapas reais do orçamento; personalização, prazo e garantia só se comprovados.",
          "priority": 2,
          "sort_order": 3,
          "notes": "Acervo do titular: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; recorte: Móveis Planejados. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "5ab38254-6c99-548d-a474-0c110beb86b8",
          "item_key": "evidence_limitations",
          "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
          "priority": 3,
          "sort_order": 4,
          "notes": "Fontes aproveitadas: Varejo e Comércio Local 1.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida."
        }
      ]
    },
    {
      "id": "16a2416c-d5c9-5356-983b-f354ce2eca08",
      "taxon_slug": "nutricionistas",
      "research_block": "market_intelligence",
      "audience_scope": "business_buyer",
      "version": 1,
      "status": "active",
      "items": [
        {
          "id": "a3bd497a-c4e6-51c2-b553-8eb13543bd41",
          "item_key": "market_overview",
          "item_text": "O material relaciona nutrição a acompanhamento, saúde preventiva e fitness; não comprova demanda atual.",
          "priority": 2,
          "sort_order": 1,
          "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Nutricionistas. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "30baaa22-03fd-51d2-ba4a-1990e2098604",
          "item_key": "digital_maturity",
          "item_text": "A pesquisa histórica destaca conteúdo orgânico e adoção variável de anúncios.",
          "priority": 2,
          "sort_order": 2,
          "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Nutricionistas. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "2dcebcb6-9213-5bd4-9c39-76e7231f5f5a",
          "item_key": "communication_opportunity",
          "item_text": "Comunicar formato de acompanhamento confirmado; não apresentar prescrição, resultado ou promessa individual.",
          "priority": 2,
          "sort_order": 3,
          "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Nutricionistas. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "11968815-0d00-5915-b82f-241c0ad378b3",
          "item_key": "evidence_limitations",
          "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
          "priority": 3,
          "sort_order": 4,
          "notes": "Fontes aproveitadas: Saúde e Bem-estar.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida."
        }
      ]
    },
    {
      "id": "342a642b-8fd5-5d14-a68f-ae15ad108b4a",
      "taxon_slug": "odontologia",
      "research_block": "market_intelligence",
      "audience_scope": "business_buyer",
      "version": 1,
      "status": "active",
      "items": [
        {
          "id": "6689b9f8-24e2-531f-9164-1c6888b58beb",
          "item_key": "market_overview",
          "item_text": "O material descreve serviços odontológicos e concorrência, sem transformar procedimento específico em categoria nova.",
          "priority": 2,
          "sort_order": 1,
          "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Odontologia. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "372bdf78-2113-52ca-8289-6d5470ea82bb",
          "item_key": "digital_maturity",
          "item_text": "O acervo histórico menciona busca e conteúdo de profissionais.",
          "priority": 2,
          "sort_order": 2,
          "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Odontologia. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "e8713c60-5ce0-5955-aad3-254b4f90b9fb",
          "item_key": "communication_opportunity",
          "item_text": "Facilitar informação e agendamento; imagens, resultados e qualificações requerem validação e autorização próprias.",
          "priority": 2,
          "sort_order": 3,
          "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Odontologia. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "a3c4f5a7-4e88-5bb8-9b45-c2038a86a667",
          "item_key": "evidence_limitations",
          "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
          "priority": 3,
          "sort_order": 4,
          "notes": "Fontes aproveitadas: Saúde e Bem-estar.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida."
        }
      ]
    },
    {
      "id": "de373e04-827e-5c85-82ea-f4e7009cb97e",
      "taxon_slug": "oficinas-mecanicas",
      "research_block": "market_intelligence",
      "audience_scope": "business_buyer",
      "version": 1,
      "status": "active",
      "items": [
        {
          "id": "b0724fb5-d94d-562a-9b6c-f5911ae94203",
          "item_key": "market_overview",
          "item_text": "O material trata de manutenção automotiva e recorrência, sem validar quantidade ou margens atuais.",
          "priority": 2,
          "sort_order": 1,
          "notes": "Acervo do titular: Veículos e Transportes.pdf, p.1, 2025-06-26; recorte: Oficinas mecânicas. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "f5080911-1037-5a66-a525-59628cd57241",
          "item_key": "digital_maturity",
          "item_text": "A pesquisa histórica menciona descoberta local e redes em parte das oficinas.",
          "priority": 2,
          "sort_order": 2,
          "notes": "Acervo do titular: Veículos e Transportes.pdf, p.1, 2025-06-26; recorte: Oficinas mecânicas. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "5c2f7566-2a04-5fb1-baa2-c6797cf62b1a",
          "item_key": "communication_opportunity",
          "item_text": "Esclarecer serviços e agendamento confirmados; capacidade técnica, prazo e diagnóstico não podem ser presumidos.",
          "priority": 2,
          "sort_order": 3,
          "notes": "Acervo do titular: Veículos e Transportes.pdf, p.1, 2025-06-26; recorte: Oficinas mecânicas. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "1899a258-0416-5d0e-81a0-e3ba052baf9f",
          "item_key": "evidence_limitations",
          "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
          "priority": 3,
          "sort_order": 4,
          "notes": "Fontes aproveitadas: Veículos e Transportes.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida."
        }
      ]
    },
    {
      "id": "997272c5-ec44-5398-82d9-1cf7f2cc8d80",
      "taxon_slug": "oticas",
      "research_block": "market_intelligence",
      "audience_scope": "business_buyer",
      "version": 1,
      "status": "active",
      "items": [
        {
          "id": "ed0d73fa-81ae-5ee2-b031-bacf04672f3d",
          "item_key": "market_overview",
          "item_text": "O material aborda varejo óptico e recorrência, sem validar crescimento ou desempenho atual.",
          "priority": 2,
          "sort_order": 1,
          "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Óticas. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "142d35f8-07fa-5dd0-908e-561b9db35fad",
          "item_key": "digital_maturity",
          "item_text": "A leitura de 2025 sugere busca e presença visual.",
          "priority": 2,
          "sort_order": 2,
          "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Óticas. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "9408d795-fabf-581d-bfa9-abc24ee231d4",
          "item_key": "communication_opportunity",
          "item_text": "Explicar opções e atendimento verificáveis; não inferir diagnóstico, condição clínica ou eficácia individual.",
          "priority": 2,
          "sort_order": 3,
          "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Óticas. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "14df650c-17eb-5d0f-b49d-fa5ef33b1dc0",
          "item_key": "evidence_limitations",
          "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
          "priority": 3,
          "sort_order": 4,
          "notes": "Fontes aproveitadas: Varejo e Comércio Local 2.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida."
        }
      ]
    },
    {
      "id": "a2409fde-422d-52d3-83e6-71f9a1dc4604",
      "taxon_slug": "padarias",
      "research_block": "market_intelligence",
      "audience_scope": "business_buyer",
      "version": 1,
      "status": "active",
      "items": [
        {
          "id": "3e338aaa-2c70-54af-8144-b6281f745bb0",
          "item_key": "market_overview",
          "item_text": "O material relaciona panificação a compras frequentes, lanches e operação local, sem comprovar expansão atual.",
          "priority": 2,
          "sort_order": 1,
          "notes": "Acervo do titular: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; recorte: Padarias. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "486ee5bd-32f3-5779-915a-ff0a13f6a7de",
          "item_key": "digital_maturity",
          "item_text": "O acervo descreve adoção digital desigual e aprendizado de redes e aplicativos, hipótese histórica a conferir.",
          "priority": 2,
          "sort_order": 2,
          "notes": "Acervo do titular: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; recorte: Padarias. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "a8398363-fca7-5b3f-97fc-c0f21acd43b4",
          "item_key": "communication_opportunity",
          "item_text": "Comunicar mix real, horários e conveniência local; destacar encomendas ou produção própria somente se o negócio confirmar.",
          "priority": 2,
          "sort_order": 3,
          "notes": "Acervo do titular: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; recorte: Padarias. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "891c4cc5-fb32-52e1-b01d-3db5d7d26f53",
          "item_key": "evidence_limitations",
          "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
          "priority": 3,
          "sort_order": 4,
          "notes": "Fontes aproveitadas: Alimentação e Gastronomia.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida."
        }
      ]
    },
    {
      "id": "3ce5e2fc-4531-5035-8eec-c98571997872",
      "taxon_slug": "pet-shops",
      "research_block": "market_intelligence",
      "audience_scope": "business_buyer",
      "version": 1,
      "status": "active",
      "items": [
        {
          "id": "5d7c11cf-b4d6-5a06-b9af-1f4ed2722362",
          "item_key": "market_overview",
          "item_text": "O material descreve consumo recorrente e competição entre negócios pet, sem validar crescimento atual.",
          "priority": 2,
          "sort_order": 1,
          "notes": "Acervo do titular: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; recorte: Pet Shops. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "70bfb81d-df2e-5bea-8d87-3bea080cc0dd",
          "item_key": "digital_maturity",
          "item_text": "A pesquisa de 2025 cita conteúdo e ampliação de canais digitais.",
          "priority": 2,
          "sort_order": 2,
          "notes": "Acervo do titular: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; recorte: Pet Shops. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "977f35da-8346-5643-b47f-64f2feb3db3e",
          "item_key": "communication_opportunity",
          "item_text": "Organizar produtos e serviços reais; conveniência e fidelização são possibilidades, sem inferir cuidados veterinários.",
          "priority": 2,
          "sort_order": 3,
          "notes": "Acervo do titular: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; recorte: Pet Shops. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "ea101734-b82a-5567-a1c0-3a565e851a4b",
          "item_key": "evidence_limitations",
          "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
          "priority": 3,
          "sort_order": 4,
          "notes": "Fontes aproveitadas: Varejo e Comércio Local 1.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida."
        }
      ]
    },
    {
      "id": "2abf9c49-a1ca-5def-8a5e-552739f51eb5",
      "taxon_slug": "restaurantes-e-bares",
      "research_block": "market_intelligence",
      "audience_scope": "business_buyer",
      "version": 1,
      "status": "active",
      "items": [
        {
          "id": "b171c9eb-c897-505d-880f-d5564f41854f",
          "item_key": "market_overview",
          "item_text": "O acervo descreve concorrência por movimento local, consumo no estabelecimento e entregas, com necessidade de recorrência.",
          "priority": 2,
          "sort_order": 1,
          "notes": "Acervo do titular: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; recorte: Restaurantes/Bares. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "c9a5c432-6d12-551e-985b-a4a844af5fcf",
          "item_key": "digital_maturity",
          "item_text": "A pesquisa de 2025 cita redes sociais, aplicativos de entrega e fidelização; a intensidade de uso não foi aferida agora.",
          "priority": 2,
          "sort_order": 2,
          "notes": "Acervo do titular: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; recorte: Restaurantes/Bares. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "7cab6fa4-48a8-5b19-ba39-d47a7696c799",
          "item_key": "communication_opportunity",
          "item_text": "Explorar informação clara de cardápio, horários, localização e canais de pedido; diferenciação por experiência ou atendimento só quando confirmada.",
          "priority": 2,
          "sort_order": 3,
          "notes": "Acervo do titular: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; recorte: Restaurantes/Bares. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "85098785-b1e2-5c28-99be-396f299c12ce",
          "item_key": "evidence_limitations",
          "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
          "priority": 3,
          "sort_order": 4,
          "notes": "Fontes aproveitadas: Alimentação e Gastronomia.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida."
        }
      ]
    },
    {
      "id": "f959b397-71a7-5196-ac68-603f6ae44d05",
      "taxon_slug": "saloes-de-beleza",
      "research_block": "market_intelligence",
      "audience_scope": "business_buyer",
      "version": 1,
      "status": "active",
      "items": [
        {
          "id": "18a445ed-6740-500f-bd3f-935615bf7273",
          "item_key": "market_overview",
          "item_text": "O acervo descreve negócios locais de serviços de beleza e recorrência, sem validar porte ou margens.",
          "priority": 2,
          "sort_order": 1,
          "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Salão de Beleza. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "a931b530-f0cf-5c95-a7f3-4be4cc41fca3",
          "item_key": "digital_maturity",
          "item_text": "A pesquisa de 2025 cita portfólio em redes e relacionamento por mensagens.",
          "priority": 2,
          "sort_order": 2,
          "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Salão de Beleza. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "79957af5-74cc-5853-8e97-a3e31c6dba9a",
          "item_key": "communication_opportunity",
          "item_text": "Mostrar serviços, agenda e trabalhos com autorização; personalização e experiência dependem da operação real.",
          "priority": 2,
          "sort_order": 3,
          "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Salão de Beleza. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "7090dfc7-2eb9-519d-a302-a2a190c01686",
          "item_key": "evidence_limitations",
          "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
          "priority": 3,
          "sort_order": 4,
          "notes": "Fontes aproveitadas: Saúde e Bem-estar.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida."
        }
      ]
    },
    {
      "id": "840bc8f9-a341-53c7-8ce8-c31fa516b9fc",
      "taxon_slug": "spas",
      "research_block": "market_intelligence",
      "audience_scope": "business_buyer",
      "version": 1,
      "status": "active",
      "items": [
        {
          "id": "dfe01272-9435-5842-b07b-7a4f257c7b00",
          "item_key": "market_overview",
          "item_text": "O acervo trata de experiência de bem-estar e serviços, sem validar tamanho ou crescimento de mercado.",
          "priority": 2,
          "sort_order": 1,
          "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Spa. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "30d08cf6-48ba-552e-801d-26a090b1039a",
          "item_key": "digital_maturity",
          "item_text": "A observação histórica cita conteúdo visual e parcerias.",
          "priority": 2,
          "sort_order": 2,
          "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Spa. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "2018d2bc-fb9d-5ed3-95be-e5e842f83310",
          "item_key": "communication_opportunity",
          "item_text": "Apresentar estrutura, serviços e condições reais; experiência premium ou benefício terapêutico não é presumido.",
          "priority": 2,
          "sort_order": 3,
          "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Spa. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "c18de1b6-90a6-55e5-967d-5c475b39d238",
          "item_key": "evidence_limitations",
          "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
          "priority": 3,
          "sort_order": 4,
          "notes": "Fontes aproveitadas: Saúde e Bem-estar.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida."
        }
      ]
    },
    {
      "id": "d3254254-c82c-5732-9ed1-dd66270b8a20",
      "taxon_slug": "supermercados",
      "research_block": "market_intelligence",
      "audience_scope": "business_buyer",
      "version": 1,
      "status": "active",
      "items": [
        {
          "id": "2b3e3e1b-52a5-5b08-8000-fd0eab837e90",
          "item_key": "market_overview",
          "item_text": "O documento descreve operação de volume e mix de compras, sem sustentar margens ou porte de uma loja específica.",
          "priority": 2,
          "sort_order": 1,
          "notes": "Acervo do titular: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; recorte: Supermercados. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "91fde768-6815-5be4-804d-e0f3d73be3de",
          "item_key": "digital_maturity",
          "item_text": "A leitura histórica sugere maturidade desigual, com redes sociais e entrega em parte das operações.",
          "priority": 2,
          "sort_order": 2,
          "notes": "Acervo do titular: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; recorte: Supermercados. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "85b09c2f-ec3d-5ab5-a639-e78ce2170174",
          "item_key": "communication_opportunity",
          "item_text": "Apresentar ofertas vigentes, localização e opções reais de compra; conveniência e entrega são possibilidades condicionais.",
          "priority": 2,
          "sort_order": 3,
          "notes": "Acervo do titular: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; recorte: Supermercados. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular."
        },
        {
          "id": "fef7e990-0eae-57b7-9039-5bca72c967ac",
          "item_key": "evidence_limitations",
          "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
          "priority": 3,
          "sort_order": 4,
          "notes": "Fontes aproveitadas: Alimentação e Gastronomia.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida."
        }
      ]
    }
  ]
}$payload$::jsonb;
  row_data jsonb;
  research_data jsonb;
  item_data jsonb;
  parent_uuid uuid;
  taxon_uuid uuid;
  original_taxons uuid[];
  original_research uuid[];
  original_items uuid[];
  original_taxons_hash text;
  original_research_hash text;
  original_items_hash text;
  aliases_hash text;
  loaded_taxons integer := 0;
  loaded_research integer := 0;
  loaded_items integer := 0;
begin
  -- DML operacional aprovada D21; não é migration nem execução do inspector read-only.
  if current_user <> 'postgres' then
    raise exception 'D21: canal operacional não autorizado; não ampliar permissões';
  end if;
  -- Locks transitórios: nenhuma tabela, função ou permissão é criada.
  lock table public.business_taxons, public.taxon_market_research,
    public.taxon_market_research_items in share row exclusive mode;
  lock table public.business_taxon_aliases in share mode;
  select array_agg(t.id order by t.id),md5(coalesce(string_agg(row_to_json(t)::text,E'\n' order by t.id),''))
    into original_taxons,original_taxons_hash from public.business_taxons t;
  select array_agg(r.id order by r.id),md5(coalesce(string_agg(row_to_json(r)::text,E'\n' order by r.id),''))
    into original_research,original_research_hash from public.taxon_market_research r;
  select array_agg(i.id order by i.id),md5(coalesce(string_agg(row_to_json(i)::text,E'\n' order by i.id),''))
    into original_items,original_items_hash from public.taxon_market_research_items i;
  select md5(coalesce(string_agg(row_to_json(a)::text,E'\n' order by a.id),''))
    into aliases_hash from public.business_taxon_aliases a;
  if aliases_hash <> payload #>> '{baseline_aliases,fingerprint}'
    or (select count(*) from public.business_taxon_aliases) <> (payload #>> '{baseline_aliases,count}')::integer then
    raise exception 'D21: aliases divergiram do inventário; reinspecionar sem escrever';
  end if;
  -- Confere os registros preexistentes, inclusive inativos; não os atualiza.
  for row_data in select value from jsonb_array_elements(payload->'baseline_taxons') loop
    if not exists (
      select 1 from public.business_taxons t
      where t.id=(row_data->>'id')::uuid and t.slug=row_data->>'slug'
        and t.name=row_data->>'name' and t.level=row_data->>'level'
        and t.parent_id is not distinct from (row_data->>'parent_id')::uuid
        and t.is_active=(row_data->>'is_active')::boolean
    ) then raise exception 'D21: catálogo preexistente divergiu: %',row_data->>'slug'; end if;
  end loop;
  if exists (
    select 1 from jsonb_array_elements(payload->'taxons') a
    group by public.normalize_taxon_match_text(a->>'name') having count(*)>1
  ) then raise exception 'D21: nomes duplicados no candidato'; end if;
  if exists (
    select 1 from jsonb_array_elements(payload->'taxons') a
    group by a->>'slug' having count(*)>1
  ) then raise exception 'D21: slugs duplicados no candidato'; end if;
  -- Preflight de todo o lote antes do primeiro INSERT.
  for row_data in select value from jsonb_array_elements(payload->'taxons') loop
    if row_data->>'level' not in ('segment','niche')
      or nullif(trim(row_data->>'name'),'') is null
      or nullif(trim(row_data->>'slug'),'') is null
      or (row_data->>'level'='segment' and row_data->>'parent_slug' is not null)
      or (row_data->>'level'='niche' and row_data->>'parent_slug' is null) then
      raise exception 'D21: nível/nome/hierarquia inválidos: %',row_data->>'slug';
    end if;
    if exists (
      select 1 from public.business_taxons t
      where t.id=(row_data->>'id')::uuid or t.slug=row_data->>'slug'
        or public.normalize_taxon_match_text(t.name)=public.normalize_taxon_match_text(row_data->>'name')
        or public.normalize_taxon_match_text(replace(t.slug,'-',' '))=public.normalize_taxon_match_text(row_data->>'name')
    ) or exists (
      select 1 from public.business_taxon_aliases a
      where a.alias_text_normalized in (
        public.normalize_taxon_match_text(row_data->>'name'),
        public.normalize_taxon_match_text(replace(row_data->>'slug','-',' ')))
    ) then raise exception 'D21: taxon/alias já existe, inclusive inativo: %',row_data->>'slug'; end if;
    if row_data->>'level'='niche' and not (
      exists (select 1 from public.business_taxons t
        where t.slug=row_data->>'parent_slug' and t.level='segment' and t.is_active)
      or exists (select 1 from jsonb_array_elements(payload->'taxons') candidate_parent
        where candidate_parent->>'slug'=row_data->>'parent_slug'
          and candidate_parent->>'level'='segment')
    ) then raise exception 'D21: pai inválido/inativo/ausente: %',row_data->>'slug'; end if;
  end loop;
  -- Todas as categorias novas são validadas e inseridas; segmentos precedem nichos.
  for row_data in
    select value from jsonb_array_elements(payload->'taxons')
    order by case when value->>'level'='segment' then 0 else 1 end,value->>'slug'
  loop
    parent_uuid := null;
    if row_data->>'level'='niche' then
      select id into strict parent_uuid from public.business_taxons
        where slug=row_data->>'parent_slug' and level='segment' and is_active;
    end if;
    insert into public.business_taxons(id,parent_id,level,name,slug,is_active)
      values ((row_data->>'id')::uuid,parent_uuid,row_data->>'level',
        row_data->>'name',row_data->>'slug',true);
    loaded_taxons := loaded_taxons+1;
  end loop;
  -- Colisão de pesquisa aborta a transação inteira, inclusive taxons recém-inseridos.
  for research_data in select value from jsonb_array_elements(payload->'research') loop
    select id into strict taxon_uuid from public.business_taxons
      where slug=research_data->>'taxon_slug' and level='niche' and is_active;
    if research_data->>'research_block'<>'market_intelligence'
      or research_data->>'audience_scope'<>'business_buyer'
      or (research_data->>'version')::integer<>1
      or research_data->>'status'<>'active'
      or jsonb_array_length(research_data->'items')=0 then
      raise exception 'D21: contrato da inteligência inválido: %',research_data->>'taxon_slug';
    end if;
    if exists (select 1 from public.taxon_market_research r
      where r.id=(research_data->>'id')::uuid
        or (r.taxon_id=taxon_uuid and r.research_block=research_data->>'research_block'
          and r.audience_scope=research_data->>'audience_scope')) then
      raise exception 'D21: pesquisa existente; não sobrescrever: %',research_data->>'taxon_slug';
    end if;
    insert into public.taxon_market_research(id,taxon_id,research_block,audience_scope,version,status)
      values ((research_data->>'id')::uuid,taxon_uuid,'market_intelligence','business_buyer',1,'active');
    loaded_research := loaded_research+1;
    for item_data in select value from jsonb_array_elements(research_data->'items') loop
      if nullif(trim(item_data->>'item_text'),'') is null
        or nullif(trim(item_data->>'notes'),'') is null
        or (item_data->>'priority')::integer not between 1 and 3
        or (item_data->>'sort_order')::integer<1
        or item_data->>'item_key' not in
          ('market_overview','digital_maturity','communication_opportunity','evidence_limitations') then
        raise exception 'D21: item inválido: %',item_data->>'id';
      end if;
      insert into public.taxon_market_research_items
        (id,research_id,item_key,item_text,priority,sort_order,is_active,notes)
      values ((item_data->>'id')::uuid,(research_data->>'id')::uuid,item_data->>'item_key',
        item_data->>'item_text',(item_data->>'priority')::integer,
        (item_data->>'sort_order')::integer,true,item_data->>'notes');
      loaded_items := loaded_items+1;
    end loop;
  end loop;
  if loaded_taxons<>jsonb_array_length(payload->'taxons')
    or loaded_research<>jsonb_array_length(payload->'research')
    or loaded_items<>(select sum(jsonb_array_length(value->'items')) from jsonb_array_elements(payload->'research')) then
    raise exception 'D21: contagem divergente; carga integral revertida';
  end if;
  -- Preservação byte-a-byte das linhas originais, incluindo timestamps e seleção de pesquisa.
  if original_taxons_hash<>(select md5(coalesce(string_agg(row_to_json(t)::text,E'\n' order by t.id),''))
      from public.business_taxons t where t.id=any(original_taxons))
    or original_research_hash<>(select md5(coalesce(string_agg(row_to_json(r)::text,E'\n' order by r.id),''))
      from public.taxon_market_research r where r.id=any(original_research))
    or original_items_hash<>(select md5(coalesce(string_agg(row_to_json(i)::text,E'\n' order by i.id),''))
      from public.taxon_market_research_items i where i.id=any(original_items))
    or aliases_hash<>(select md5(coalesce(string_agg(row_to_json(a)::text,E'\n' order by a.id),''))
      from public.business_taxon_aliases a) then
    raise exception 'D21: alteração preexistente não autorizada; carga integral revertida';
  end if;
  raise notice 'D21: % taxons, % pesquisas, % itens; linhas originais preservadas',loaded_taxons,loaded_research,loaded_items;
end $d21$;

select 'D21_PB_A_LOADED' as result,
  (select count(*) from public.business_taxons where id in ('33a81e27-46f8-54dc-9958-a85bb3c0a15a'::uuid,'27f80adc-57bf-52b9-a049-eb6b5f2a243d'::uuid,'f39b8979-bbf7-5a57-970f-85d908893b03'::uuid,'76575571-85b0-5ad0-83ac-156add56a859'::uuid,'bb47f9a1-e701-57a5-8921-e206ace45f28'::uuid,'e8c63e31-61e0-58f3-babd-a346d247df6f'::uuid,'8d06b984-6d65-5b57-a9da-818ee94801bb'::uuid,'b31d4fc4-8344-51cc-9240-ccb273d2536e'::uuid,'4edaf680-fb0f-5258-b627-72e960670b52'::uuid,'30dd39d5-cd6d-507a-86e4-2f62f6b2e0c2'::uuid,'53dbf586-b97b-5c5f-a55c-a3dd1d0a373d'::uuid,'59d140cd-d71f-5f25-b987-d71db6f20d1d'::uuid,'0aa3ec7c-b375-56b6-a610-a43d2cf4eb49'::uuid,'a14b9993-0752-59d2-862d-c5d85d3e82d7'::uuid,'250af70b-7298-583e-913c-7c6b0eb1540b'::uuid,'2a2fe08f-7012-5927-ae31-7cece585c03d'::uuid,'92041296-7791-539e-8419-a4a962e9d61c'::uuid,'636e6441-0f8a-55e5-9cbb-2c0981d278af'::uuid,'feb936fd-588b-572b-a7c8-0df48290a01e'::uuid,'af9f7030-0b05-5ae8-900d-f9a0c2bf06a1'::uuid,'1e34509b-b858-58c7-8bc7-24f4cdfd3fdf'::uuid,'a084e3f1-eb94-5f84-81ab-e6a832483822'::uuid,'2ca52593-a3ea-5761-af28-dbaaf079ca2b'::uuid,'b05ade1c-1434-5f8f-b1a3-743f7ea22e14'::uuid,'cfaf5a87-2b5b-59dd-9470-dab6a812d39d'::uuid,'aa505a5c-b61c-5b4e-a82c-6fc39dd2af98'::uuid,'e5a8fd95-0df8-5273-87ed-c6317054e152'::uuid,'c756b874-d0aa-5d2c-a223-67f4d7568541'::uuid,'9d02c69f-436f-5153-acd2-53f7c3c700d1'::uuid,'51578750-ae76-5b69-9ff1-83c1cdca2f0a'::uuid,'56355423-f1ce-5d04-862e-3436bb1f77e1'::uuid,'7b6f7d09-0182-5025-aac7-e6947b01910a'::uuid,'0866330b-b6c9-5715-b426-ba8c8b9d5ba6'::uuid,'3967f1d7-12c2-50a2-907a-4ecadf5c8635'::uuid,'8d2aeb66-7602-5c20-9401-c5761d6b2362'::uuid,'34cf9bdc-ce9f-5240-becf-668a80a52ea6'::uuid,'10134399-3a72-5e01-8ccd-073a3d5f029b'::uuid,'6b4ac31d-9a39-5a8f-ac03-918133d2fbe5'::uuid,'95b74024-d064-58dc-a3a4-c71f1c891ce2'::uuid,'d32425e9-6efe-5699-bab0-2743938595b8'::uuid,'b7e67ad6-b905-58f1-8a3f-60c952b590e7'::uuid,'c7c014fa-4953-51b1-9119-9511b5778963'::uuid,'f0061748-3955-5217-a22d-d58d6de366c6'::uuid,'a5c66f17-1a98-5bbb-913d-df773402cd31'::uuid,'bdc9a667-e856-556f-8898-2eb86de7c2c2'::uuid,'e0670e67-1806-5169-bddf-d7fa60d18164'::uuid,'1cb6b1fe-540a-56dd-a90c-9475f54af3a6'::uuid,'e1d90712-74be-5acb-a5fd-911d48b3a379'::uuid,'30d27071-1816-5c54-bbe9-caa7b8fc67fa'::uuid,'beb0f4f8-474a-5da6-963a-1ebb31b25ee8'::uuid,'d8603216-6afa-54e7-8c9b-84d7c59aec1b'::uuid,'c65c114e-8204-5475-9d23-8873ef52d018'::uuid,'d3a44903-ce20-5797-9d3e-0171e5aef4c9'::uuid,'68dfe4de-2161-5821-a2d5-4f655bca71f6'::uuid,'a3bd2246-9e74-5e9a-8867-91b262c7ae69'::uuid,'e0bfba25-6fd6-591b-b33e-e1a8d6094bad'::uuid,'8861ec0f-ce14-51c7-b0f5-80bdc59caa37'::uuid,'ff8a1dfe-9baf-590a-8dfd-82d7cce71058'::uuid,'feb4731d-0406-530a-be40-dff6eaf842ff'::uuid,'1fa356e4-119f-5a36-96c4-ee3dc33518c6'::uuid,'62bd61ed-c5ee-52e6-ad92-f7a70d577f38'::uuid,'2aa3d544-e45f-58e2-9062-bc16a2478821'::uuid,'7bd257a4-260d-51db-8739-723ca41b4c6f'::uuid,'c5f08922-e917-558e-ac6e-963d90d9be5a'::uuid,'23829546-fa1f-5b32-b28c-647e338e734b'::uuid,'d4d08c7d-6c31-5ad8-b08d-b2e76a906c63'::uuid,'e47bf4fd-3492-5019-b04a-758a7306baf3'::uuid,'383dc7a6-01db-53da-aaef-7876e39e6de0'::uuid,'9c6eeafe-e2fa-506c-ab8d-2242dd94b9a2'::uuid,'1c3ffe05-8c95-54aa-85af-be300d2f52dc'::uuid,'e9cfbfbe-cb4b-59e0-9e87-6d0601e7481e'::uuid,'d14d47bb-8165-5cd0-b7b3-b8069c812c91'::uuid)) as new_taxons,
  (select count(*) from public.taxon_market_research where id in ('c593f1ec-5f4f-531f-9070-80b4441eef28'::uuid,'f8294826-4ab6-5c42-88ea-ccb5e33bd839'::uuid,'575b18e9-de6f-5a5a-99f1-3607b20c89ec'::uuid,'f893c55c-9d56-5079-badc-0e0f9bb7ea4f'::uuid,'4247708e-6cb0-5be0-bbac-77d36eb3ec37'::uuid,'e26e900b-8fe5-5ec8-b62a-6e0986a887bf'::uuid,'41b7e4f9-ed34-50f4-b208-e83a9204a1e2'::uuid,'d5c0e5ab-875f-52c8-afb4-a0facb0b2a48'::uuid,'0de38fe8-16ad-575f-8508-bdbb6bf50076'::uuid,'c2f09d80-1f32-546b-a6ff-a1e4091cee1d'::uuid,'28266a9f-faf0-583f-bac7-ee7fdb9fc79a'::uuid,'66abf9c2-3920-5f7d-ac9e-9a686342858f'::uuid,'c043fb2c-c712-5425-898a-d77c4ae00008'::uuid,'d5bf615a-deb7-55a2-8832-a9f1b22a659b'::uuid,'16278d0f-7f85-5222-bd62-9e57d491a537'::uuid,'1e07f094-a81f-530d-a4fc-5a39a357c6dc'::uuid,'902d26ac-62c0-5b9c-b4e8-e5915fc64566'::uuid,'c1c9a4b6-60ca-511e-a343-a7f028d93c1f'::uuid,'d45cc27f-701b-54bc-aaa4-6de93152dfb9'::uuid,'05d666b4-ad53-53fc-bbaf-87ddab20269f'::uuid,'2518abd5-c761-50d2-b29a-cf12f3a4b29e'::uuid,'03e6c2a3-493b-5601-bf29-db4c8c97bf21'::uuid,'04ba8fb4-f897-5d96-bb4c-15af859a13f8'::uuid,'f77ed02c-86e8-5f5b-afc6-d1a1188febb4'::uuid,'3c675b4d-43d4-52da-a2dc-eba41130917d'::uuid,'a438c7b8-abbd-5df4-ac1c-0e00308ac29f'::uuid,'39c4cb19-e78f-508d-a78e-88ec8352af47'::uuid,'b48f71c3-50a1-57f5-8661-b3239735fde1'::uuid,'1bc90f27-db13-5b45-b180-cb12cedc0bb0'::uuid,'63e12d86-2f4f-5ff7-ace8-8c2a8b98f676'::uuid,'68aea8e0-d763-5597-850e-f294df298fd8'::uuid,'4b304c4e-01a8-51dc-b0dd-8fa2f5ca2d41'::uuid,'106aab43-8724-516f-8ef4-7513d564eb5f'::uuid,'e6b25ac2-0744-5938-adcf-85aa3029b1fc'::uuid,'1faa0522-effd-52bb-80de-8967130856f9'::uuid,'2e4a461d-27a6-57c0-a0d0-2283d8f379f3'::uuid,'c0b7e6ce-81be-534d-94ff-487dfe9e5b96'::uuid,'2c88749f-ab50-563b-9525-b67103b77ada'::uuid,'6b17c125-7bdb-5415-996b-185af1d5e22c'::uuid,'cfa009ea-1284-52fb-bf51-124737060a6d'::uuid,'cfa04ae3-d989-5a72-a155-84d4f96f9fb0'::uuid,'0a8d7814-ed9b-5a9f-babd-5be9142a1c62'::uuid,'33cbabb9-1844-50da-b1a3-47d554182249'::uuid,'c530d2ac-d0f5-5644-9126-8e4df34f0521'::uuid,'095dab3e-8153-5d04-8b60-ddf2a901e195'::uuid,'be721a6d-b5c1-5087-a221-cebd855380a3'::uuid,'85d331a2-c4ff-51fa-9a4e-26b99e724824'::uuid,'f19a300b-6d9d-5ecd-8cab-6f890d10d413'::uuid,'1034feee-11ae-5479-ad86-1b91d9571916'::uuid,'6fdb3f17-1fb2-5759-948c-09966870e3e8'::uuid,'16a2416c-d5c9-5356-983b-f354ce2eca08'::uuid,'342a642b-8fd5-5d14-a68f-ae15ad108b4a'::uuid,'de373e04-827e-5c85-82ea-f4e7009cb97e'::uuid,'997272c5-ec44-5398-82d9-1cf7f2cc8d80'::uuid,'a2409fde-422d-52d3-83e6-71f9a1dc4604'::uuid,'3ce5e2fc-4531-5035-8eec-c98571997872'::uuid,'2abf9c49-a1ca-5def-8a5e-552739f51eb5'::uuid,'f959b397-71a7-5196-ac68-603f6ae44d05'::uuid,'840bc8f9-a341-53c7-8ce8-c31fa516b9fc'::uuid,'d3254254-c82c-5732-9ed1-dd66270b8a20'::uuid)) as research_parents,
  (select count(*) from public.taxon_market_research_items where research_id in ('c593f1ec-5f4f-531f-9070-80b4441eef28'::uuid,'f8294826-4ab6-5c42-88ea-ccb5e33bd839'::uuid,'575b18e9-de6f-5a5a-99f1-3607b20c89ec'::uuid,'f893c55c-9d56-5079-badc-0e0f9bb7ea4f'::uuid,'4247708e-6cb0-5be0-bbac-77d36eb3ec37'::uuid,'e26e900b-8fe5-5ec8-b62a-6e0986a887bf'::uuid,'41b7e4f9-ed34-50f4-b208-e83a9204a1e2'::uuid,'d5c0e5ab-875f-52c8-afb4-a0facb0b2a48'::uuid,'0de38fe8-16ad-575f-8508-bdbb6bf50076'::uuid,'c2f09d80-1f32-546b-a6ff-a1e4091cee1d'::uuid,'28266a9f-faf0-583f-bac7-ee7fdb9fc79a'::uuid,'66abf9c2-3920-5f7d-ac9e-9a686342858f'::uuid,'c043fb2c-c712-5425-898a-d77c4ae00008'::uuid,'d5bf615a-deb7-55a2-8832-a9f1b22a659b'::uuid,'16278d0f-7f85-5222-bd62-9e57d491a537'::uuid,'1e07f094-a81f-530d-a4fc-5a39a357c6dc'::uuid,'902d26ac-62c0-5b9c-b4e8-e5915fc64566'::uuid,'c1c9a4b6-60ca-511e-a343-a7f028d93c1f'::uuid,'d45cc27f-701b-54bc-aaa4-6de93152dfb9'::uuid,'05d666b4-ad53-53fc-bbaf-87ddab20269f'::uuid,'2518abd5-c761-50d2-b29a-cf12f3a4b29e'::uuid,'03e6c2a3-493b-5601-bf29-db4c8c97bf21'::uuid,'04ba8fb4-f897-5d96-bb4c-15af859a13f8'::uuid,'f77ed02c-86e8-5f5b-afc6-d1a1188febb4'::uuid,'3c675b4d-43d4-52da-a2dc-eba41130917d'::uuid,'a438c7b8-abbd-5df4-ac1c-0e00308ac29f'::uuid,'39c4cb19-e78f-508d-a78e-88ec8352af47'::uuid,'b48f71c3-50a1-57f5-8661-b3239735fde1'::uuid,'1bc90f27-db13-5b45-b180-cb12cedc0bb0'::uuid,'63e12d86-2f4f-5ff7-ace8-8c2a8b98f676'::uuid,'68aea8e0-d763-5597-850e-f294df298fd8'::uuid,'4b304c4e-01a8-51dc-b0dd-8fa2f5ca2d41'::uuid,'106aab43-8724-516f-8ef4-7513d564eb5f'::uuid,'e6b25ac2-0744-5938-adcf-85aa3029b1fc'::uuid,'1faa0522-effd-52bb-80de-8967130856f9'::uuid,'2e4a461d-27a6-57c0-a0d0-2283d8f379f3'::uuid,'c0b7e6ce-81be-534d-94ff-487dfe9e5b96'::uuid,'2c88749f-ab50-563b-9525-b67103b77ada'::uuid,'6b17c125-7bdb-5415-996b-185af1d5e22c'::uuid,'cfa009ea-1284-52fb-bf51-124737060a6d'::uuid,'cfa04ae3-d989-5a72-a155-84d4f96f9fb0'::uuid,'0a8d7814-ed9b-5a9f-babd-5be9142a1c62'::uuid,'33cbabb9-1844-50da-b1a3-47d554182249'::uuid,'c530d2ac-d0f5-5644-9126-8e4df34f0521'::uuid,'095dab3e-8153-5d04-8b60-ddf2a901e195'::uuid,'be721a6d-b5c1-5087-a221-cebd855380a3'::uuid,'85d331a2-c4ff-51fa-9a4e-26b99e724824'::uuid,'f19a300b-6d9d-5ecd-8cab-6f890d10d413'::uuid,'1034feee-11ae-5479-ad86-1b91d9571916'::uuid,'6fdb3f17-1fb2-5759-948c-09966870e3e8'::uuid,'16a2416c-d5c9-5356-983b-f354ce2eca08'::uuid,'342a642b-8fd5-5d14-a68f-ae15ad108b4a'::uuid,'de373e04-827e-5c85-82ea-f4e7009cb97e'::uuid,'997272c5-ec44-5398-82d9-1cf7f2cc8d80'::uuid,'a2409fde-422d-52d3-83e6-71f9a1dc4604'::uuid,'3ce5e2fc-4531-5035-8eec-c98571997872'::uuid,'2abf9c49-a1ca-5def-8a5e-552739f51eb5'::uuid,'f959b397-71a7-5196-ac68-603f6ae44d05'::uuid,'840bc8f9-a341-53c7-8ce8-c31fa516b9fc'::uuid,'d3254254-c82c-5732-9ed1-dd66270b8a20'::uuid)) as research_items;
commit;
