-- E10.13: correção editorial única; não é migration nem recarga inicial.
-- Projeto autorizado: dpikmjgiteuafsbaubue. Versionar este backup antes da escrita.
-- before_items contém integralmente os 243 itens anteriores, inclusive timestamps.
-- Recuperação: os textos/notas originais estão em before_items por ID; qualquer
-- restauração exige novo delta revisado, CAS do estado posterior e transação própria.
-- Não reexecutar a carga inicial. Reexecução deste patch deve abortar por divergência.
-- Somente item_text/notes mudam; timestamps e demais campos permanecem preservados.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';
set local time zone 'UTC';
lock table public.business_taxons, public.business_taxon_aliases,
 public.taxon_market_research in share mode;
lock table public.taxon_market_research_items in share row exclusive mode;
do $editorial$
declare
 p jsonb := $payload${
  "case": "D21/PB-A/E10.13/correcao-editorial",
  "source_pr": 1048,
  "source_v1_commit": "b4ba0ec09450a500a6858595f901711d8485415d",
  "source_v2_commit": "47114670c3e11ef5bc4474c6a06d844ac93d1228",
  "sources": [
    {
      "file": "Alimentação e Gastronomia.pdf",
      "pages": 1,
      "characters": 5764,
      "sha256": "aee99dbe347f7111f2cd54ca5cc1c85f61fdd0128ac43a3e92e9d9096f195c7a",
      "zip_match": true
    },
    {
      "file": "Educação.pdf",
      "pages": 1,
      "characters": 1495,
      "sha256": "fb9403295b3428205f0fd128ce0c7cf4f4fb83e2437faade03e1ebfcd05d1291",
      "zip_match": true
    },
    {
      "file": "Fitnes e Esportes.pdf",
      "pages": 2,
      "characters": 9633,
      "sha256": "ebb01aadcce657ad78bfe4d38e37e002a33d308c007081c3d841bc79cf5867d9",
      "zip_match": true
    },
    {
      "file": "Hotelaria e Turismo.pdf",
      "pages": 1,
      "characters": 7279,
      "sha256": "25a0041b2f0ce6848cbcd950f26a94025c0fcbe0b0845cccfad160f0035f7817",
      "zip_match": true
    },
    {
      "file": "Imobiliário Construção.pdf",
      "pages": 2,
      "characters": 8934,
      "sha256": "50f43b99ce6bc66d38dc2107de569eae3d20166af246c71772379dc2f2855941",
      "zip_match": true
    },
    {
      "file": "Nicho lista.pdf",
      "pages": 2,
      "characters": 1902,
      "sha256": "88212c6193a6f19394aad039c1db84ae0ec217b44b8291e8d67aed7d22d4b4b7",
      "zip_match": true
    },
    {
      "file": "Saúde e Bem-estar.pdf",
      "pages": 1,
      "characters": 4899,
      "sha256": "56b892758bf9c02a22c2ae47223bffe9b41e5300b35a75224b77ea07046751d3",
      "zip_match": true
    },
    {
      "file": "Serviços Profissionais Consultoria.pdf",
      "pages": 2,
      "characters": 14392,
      "sha256": "e1689e90ec84e6bc4715b94220ec6953bc8470496c244a2b6ebae7e8f3909472",
      "zip_match": true
    },
    {
      "file": "Varejo e Comércio Local 1.pdf",
      "pages": 1,
      "characters": 5391,
      "sha256": "8d36e0640c8776d403e1c8bf58971633c10090ead76cb4ebf4a170b6d26d1dc0",
      "zip_match": true
    },
    {
      "file": "Varejo e Comércio Local 2.pdf",
      "pages": 1,
      "characters": 2124,
      "sha256": "d2942178024ac97569ac4ab912e3dc06c3ee05260499dc02a2eb797a1ef58f97",
      "zip_match": true
    },
    {
      "file": "Veículos e Transportes.pdf",
      "pages": 1,
      "characters": 3515,
      "sha256": "dde9d34ab21dd2bd00d9e60259bb1e1fdd1b5fc8796699e8f3c2059f5a63e4d6",
      "zip_match": true
    }
  ],
  "hashes": {
    "items": "e5d3032326f9cdf3ac4d615597e75498",
    "legacy": "a50e50cb7e13ec9051ba9a3ddbac6dac",
    "taxons": "ea08e0e45dbc3de74a3188225baa2aef",
    "aliases": "fd703d08fc612eee3a5a12e60191f1b2",
    "parents": "4c3a69f59f9f5e46679c523223a56519",
    "protected_items": "ebc9f7bdc1100fb57fcb3a24dc7b939c",
    "untouched_items": "4afb0950f4f87c1f34eb71c51c6b15cd"
  },
  "before_parents": [
    {
      "id": "03e6c2a3-493b-5601-bf29-db4c8c97bf21",
      "status": "active",
      "version": 1,
      "taxon_id": "51578750-ae76-5b69-9ff1-83c1cdca2f0a",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "audience_scope": "business_buyer",
      "research_block": "market_intelligence"
    },
    {
      "id": "04ba8fb4-f897-5d96-bb4c-15af859a13f8",
      "status": "active",
      "version": 1,
      "taxon_id": "56355423-f1ce-5d04-862e-3436bb1f77e1",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "audience_scope": "business_buyer",
      "research_block": "market_intelligence"
    },
    {
      "id": "05d666b4-ad53-53fc-bbaf-87ddab20269f",
      "status": "active",
      "version": 1,
      "taxon_id": "c756b874-d0aa-5d2c-a223-67f4d7568541",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "audience_scope": "business_buyer",
      "research_block": "market_intelligence"
    },
    {
      "id": "095dab3e-8153-5d04-8b60-ddf2a901e195",
      "status": "active",
      "version": 1,
      "taxon_id": "a3bd2246-9e74-5e9a-8867-91b262c7ae69",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "audience_scope": "business_buyer",
      "research_block": "market_intelligence"
    },
    {
      "id": "0a8d7814-ed9b-5a9f-babd-5be9142a1c62",
      "status": "active",
      "version": 1,
      "taxon_id": "c65c114e-8204-5475-9d23-8873ef52d018",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "audience_scope": "business_buyer",
      "research_block": "market_intelligence"
    },
    {
      "id": "0de38fe8-16ad-575f-8508-bdbb6bf50076",
      "status": "active",
      "version": 1,
      "taxon_id": "92041296-7791-539e-8419-a4a962e9d61c",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "audience_scope": "business_buyer",
      "research_block": "market_intelligence"
    },
    {
      "id": "1034feee-11ae-5479-ad86-1b91d9571916",
      "status": "active",
      "version": 1,
      "taxon_id": "1fa356e4-119f-5a36-96c4-ee3dc33518c6",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "audience_scope": "business_buyer",
      "research_block": "market_intelligence"
    },
    {
      "id": "106aab43-8724-516f-8ef4-7513d564eb5f",
      "status": "active",
      "version": 1,
      "taxon_id": "b7e67ad6-b905-58f1-8a3f-60c952b590e7",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "audience_scope": "business_buyer",
      "research_block": "market_intelligence"
    },
    {
      "id": "16278d0f-7f85-5222-bd62-9e57d491a537",
      "status": "active",
      "version": 1,
      "taxon_id": "c7952d16-678c-4615-9483-a003e57d94aa",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "audience_scope": "business_buyer",
      "research_block": "market_intelligence"
    },
    {
      "id": "16a2416c-d5c9-5356-983b-f354ce2eca08",
      "status": "active",
      "version": 1,
      "taxon_id": "2aa3d544-e45f-58e2-9062-bc16a2478821",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "audience_scope": "business_buyer",
      "research_block": "market_intelligence"
    },
    {
      "id": "1bc90f27-db13-5b45-b180-cb12cedc0bb0",
      "status": "active",
      "version": 1,
      "taxon_id": "10134399-3a72-5e01-8ccd-073a3d5f029b",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "audience_scope": "business_buyer",
      "research_block": "market_intelligence"
    },
    {
      "id": "1e07f094-a81f-530d-a4fc-5a39a357c6dc",
      "status": "active",
      "version": 1,
      "taxon_id": "2ca52593-a3ea-5761-af28-dbaaf079ca2b",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "audience_scope": "business_buyer",
      "research_block": "market_intelligence"
    },
    {
      "id": "1faa0522-effd-52bb-80de-8967130856f9",
      "status": "active",
      "version": 1,
      "taxon_id": "f0061748-3955-5217-a22d-d58d6de366c6",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "audience_scope": "business_buyer",
      "research_block": "market_intelligence"
    },
    {
      "id": "2518abd5-c761-50d2-b29a-cf12f3a4b29e",
      "status": "active",
      "version": 1,
      "taxon_id": "9d02c69f-436f-5153-acd2-53f7c3c700d1",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "audience_scope": "business_buyer",
      "research_block": "market_intelligence"
    },
    {
      "id": "28266a9f-faf0-583f-bac7-ee7fdb9fc79a",
      "status": "active",
      "version": 1,
      "taxon_id": "feb936fd-588b-572b-a7c8-0df48290a01e",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "audience_scope": "business_buyer",
      "research_block": "market_intelligence"
    },
    {
      "id": "2abf9c49-a1ca-5def-8a5e-552739f51eb5",
      "status": "active",
      "version": 1,
      "taxon_id": "383dc7a6-01db-53da-aaef-7876e39e6de0",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "audience_scope": "business_buyer",
      "research_block": "market_intelligence"
    },
    {
      "id": "2c88749f-ab50-563b-9525-b67103b77ada",
      "status": "active",
      "version": 1,
      "taxon_id": "e1d90712-74be-5acb-a5fd-911d48b3a379",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "audience_scope": "business_buyer",
      "research_block": "market_intelligence"
    },
    {
      "id": "2e4a461d-27a6-57c0-a0d0-2283d8f379f3",
      "status": "active",
      "version": 1,
      "taxon_id": "a5c66f17-1a98-5bbb-913d-df773402cd31",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "audience_scope": "business_buyer",
      "research_block": "market_intelligence"
    },
    {
      "id": "33cbabb9-1844-50da-b1a3-47d554182249",
      "status": "active",
      "version": 1,
      "taxon_id": "d3a44903-ce20-5797-9d3e-0171e5aef4c9",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "audience_scope": "business_buyer",
      "research_block": "market_intelligence"
    },
    {
      "id": "342a642b-8fd5-5d14-a68f-ae15ad108b4a",
      "status": "active",
      "version": 1,
      "taxon_id": "51b0d440-b54c-450b-b0cf-c8f949f1b8c6",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "audience_scope": "business_buyer",
      "research_block": "market_intelligence"
    },
    {
      "id": "39c4cb19-e78f-508d-a78e-88ec8352af47",
      "status": "active",
      "version": 1,
      "taxon_id": "8d2aeb66-7602-5c20-9401-c5761d6b2362",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "audience_scope": "business_buyer",
      "research_block": "market_intelligence"
    },
    {
      "id": "3c675b4d-43d4-52da-a2dc-eba41130917d",
      "status": "active",
      "version": 1,
      "taxon_id": "0866330b-b6c9-5715-b426-ba8c8b9d5ba6",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "audience_scope": "business_buyer",
      "research_block": "market_intelligence"
    },
    {
      "id": "3ce5e2fc-4531-5035-8eec-c98571997872",
      "status": "active",
      "version": 1,
      "taxon_id": "d4d08c7d-6c31-5ad8-b08d-b2e76a906c63",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "audience_scope": "business_buyer",
      "research_block": "market_intelligence"
    },
    {
      "id": "41b7e4f9-ed34-50f4-b208-e83a9204a1e2",
      "status": "active",
      "version": 1,
      "taxon_id": "3c69df0b-fd72-4b13-bc91-89388d6ef19c",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "audience_scope": "business_buyer",
      "research_block": "market_intelligence"
    },
    {
      "id": "4247708e-6cb0-5be0-bbac-77d36eb3ec37",
      "status": "active",
      "version": 1,
      "taxon_id": "a14b9993-0752-59d2-862d-c5d85d3e82d7",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "audience_scope": "business_buyer",
      "research_block": "market_intelligence"
    },
    {
      "id": "4b304c4e-01a8-51dc-b0dd-8fa2f5ca2d41",
      "status": "active",
      "version": 1,
      "taxon_id": "5662f9ff-0e2f-4190-a288-ef8348c4d7b5",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "audience_scope": "business_buyer",
      "research_block": "market_intelligence"
    },
    {
      "id": "575b18e9-de6f-5a5a-99f1-3607b20c89ec",
      "status": "active",
      "version": 1,
      "taxon_id": "59d140cd-d71f-5f25-b987-d71db6f20d1d",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "audience_scope": "business_buyer",
      "research_block": "market_intelligence"
    },
    {
      "id": "63e12d86-2f4f-5ff7-ace8-8c2a8b98f676",
      "status": "active",
      "version": 1,
      "taxon_id": "6b4ac31d-9a39-5a8f-ac03-918133d2fbe5",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "audience_scope": "business_buyer",
      "research_block": "market_intelligence"
    },
    {
      "id": "66abf9c2-3920-5f7d-ac9e-9a686342858f",
      "status": "active",
      "version": 1,
      "taxon_id": "af9f7030-0b05-5ae8-900d-f9a0c2bf06a1",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "audience_scope": "business_buyer",
      "research_block": "market_intelligence"
    },
    {
      "id": "68aea8e0-d763-5597-850e-f294df298fd8",
      "status": "active",
      "version": 1,
      "taxon_id": "95b74024-d064-58dc-a3a4-c71f1c891ce2",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "audience_scope": "business_buyer",
      "research_block": "market_intelligence"
    },
    {
      "id": "6b17c125-7bdb-5415-996b-185af1d5e22c",
      "status": "active",
      "version": 1,
      "taxon_id": "30d27071-1816-5c54-bbe9-caa7b8fc67fa",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "audience_scope": "business_buyer",
      "research_block": "market_intelligence"
    },
    {
      "id": "6fdb3f17-1fb2-5759-948c-09966870e3e8",
      "status": "active",
      "version": 1,
      "taxon_id": "62bd61ed-c5ee-52e6-ad92-f7a70d577f38",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "audience_scope": "business_buyer",
      "research_block": "market_intelligence"
    },
    {
      "id": "840bc8f9-a341-53c7-8ce8-c31fa516b9fc",
      "status": "active",
      "version": 1,
      "taxon_id": "e9cfbfbe-cb4b-59e0-9e87-6d0601e7481e",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "audience_scope": "business_buyer",
      "research_block": "market_intelligence"
    },
    {
      "id": "85d331a2-c4ff-51fa-9a4e-26b99e724824",
      "status": "active",
      "version": 1,
      "taxon_id": "8861ec0f-ce14-51c7-b0f5-80bdc59caa37",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "audience_scope": "business_buyer",
      "research_block": "market_intelligence"
    },
    {
      "id": "902d26ac-62c0-5b9c-b4e8-e5915fc64566",
      "status": "active",
      "version": 1,
      "taxon_id": "b05ade1c-1434-5f8f-b1a3-743f7ea22e14",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "audience_scope": "business_buyer",
      "research_block": "market_intelligence"
    },
    {
      "id": "997272c5-ec44-5398-82d9-1cf7f2cc8d80",
      "status": "active",
      "version": 1,
      "taxon_id": "c5f08922-e917-558e-ac6e-963d90d9be5a",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "audience_scope": "business_buyer",
      "research_block": "market_intelligence"
    },
    {
      "id": "a2409fde-422d-52d3-83e6-71f9a1dc4604",
      "status": "active",
      "version": 1,
      "taxon_id": "23829546-fa1f-5b32-b28c-647e338e734b",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "audience_scope": "business_buyer",
      "research_block": "market_intelligence"
    },
    {
      "id": "a438c7b8-abbd-5df4-ac1c-0e00308ac29f",
      "status": "active",
      "version": 1,
      "taxon_id": "3967f1d7-12c2-50a2-907a-4ecadf5c8635",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "audience_scope": "business_buyer",
      "research_block": "market_intelligence"
    },
    {
      "id": "b48f71c3-50a1-57f5-8661-b3239735fde1",
      "status": "active",
      "version": 1,
      "taxon_id": "34cf9bdc-ce9f-5240-becf-668a80a52ea6",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "audience_scope": "business_buyer",
      "research_block": "market_intelligence"
    },
    {
      "id": "be721a6d-b5c1-5087-a221-cebd855380a3",
      "status": "active",
      "version": 1,
      "taxon_id": "e0bfba25-6fd6-591b-b33e-e1a8d6094bad",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "audience_scope": "business_buyer",
      "research_block": "market_intelligence"
    },
    {
      "id": "c043fb2c-c712-5425-898a-d77c4ae00008",
      "status": "active",
      "version": 1,
      "taxon_id": "1e34509b-b858-58c7-8bc7-24f4cdfd3fdf",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "audience_scope": "business_buyer",
      "research_block": "market_intelligence"
    },
    {
      "id": "c0b7e6ce-81be-534d-94ff-487dfe9e5b96",
      "status": "active",
      "version": 1,
      "taxon_id": "1cb6b1fe-540a-56dd-a90c-9475f54af3a6",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "audience_scope": "business_buyer",
      "research_block": "market_intelligence"
    },
    {
      "id": "c1c9a4b6-60ca-511e-a343-a7f028d93c1f",
      "status": "active",
      "version": 1,
      "taxon_id": "cfaf5a87-2b5b-59dd-9470-dab6a812d39d",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "audience_scope": "business_buyer",
      "research_block": "market_intelligence"
    },
    {
      "id": "c2f09d80-1f32-546b-a6ff-a1e4091cee1d",
      "status": "active",
      "version": 1,
      "taxon_id": "636e6441-0f8a-55e5-9cbb-2c0981d278af",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "audience_scope": "business_buyer",
      "research_block": "market_intelligence"
    },
    {
      "id": "c530d2ac-d0f5-5644-9126-8e4df34f0521",
      "status": "active",
      "version": 1,
      "taxon_id": "68dfe4de-2161-5821-a2d5-4f655bca71f6",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "audience_scope": "business_buyer",
      "research_block": "market_intelligence"
    },
    {
      "id": "c593f1ec-5f4f-531f-9070-80b4441eef28",
      "status": "active",
      "version": 1,
      "taxon_id": "30dd39d5-cd6d-507a-86e4-2f62f6b2e0c2",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "audience_scope": "business_buyer",
      "research_block": "market_intelligence"
    },
    {
      "id": "cfa009ea-1284-52fb-bf51-124737060a6d",
      "status": "active",
      "version": 1,
      "taxon_id": "beb0f4f8-474a-5da6-963a-1ebb31b25ee8",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "audience_scope": "business_buyer",
      "research_block": "market_intelligence"
    },
    {
      "id": "cfa04ae3-d989-5a72-a155-84d4f96f9fb0",
      "status": "active",
      "version": 1,
      "taxon_id": "d8603216-6afa-54e7-8c9b-84d7c59aec1b",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "audience_scope": "business_buyer",
      "research_block": "market_intelligence"
    },
    {
      "id": "d3254254-c82c-5732-9ed1-dd66270b8a20",
      "status": "active",
      "version": 1,
      "taxon_id": "d14d47bb-8165-5cd0-b7b3-b8069c812c91",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "audience_scope": "business_buyer",
      "research_block": "market_intelligence"
    },
    {
      "id": "d45cc27f-701b-54bc-aaa4-6de93152dfb9",
      "status": "active",
      "version": 1,
      "taxon_id": "e5a8fd95-0df8-5273-87ed-c6317054e152",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "audience_scope": "business_buyer",
      "research_block": "market_intelligence"
    },
    {
      "id": "d5bf615a-deb7-55a2-8832-a9f1b22a659b",
      "status": "active",
      "version": 1,
      "taxon_id": "45d2b485-102c-42c0-b059-876919c9c10a",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "audience_scope": "business_buyer",
      "research_block": "market_intelligence"
    },
    {
      "id": "d5c0e5ab-875f-52c8-afb4-a0facb0b2a48",
      "status": "active",
      "version": 1,
      "taxon_id": "2a2fe08f-7012-5927-ae31-7cece585c03d",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "audience_scope": "business_buyer",
      "research_block": "market_intelligence"
    },
    {
      "id": "de373e04-827e-5c85-82ea-f4e7009cb97e",
      "status": "active",
      "version": 1,
      "taxon_id": "7bd257a4-260d-51db-8739-723ca41b4c6f",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "audience_scope": "business_buyer",
      "research_block": "market_intelligence"
    },
    {
      "id": "e26e900b-8fe5-5ec8-b62a-6e0986a887bf",
      "status": "active",
      "version": 1,
      "taxon_id": "250af70b-7298-583e-913c-7c6b0eb1540b",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "audience_scope": "business_buyer",
      "research_block": "market_intelligence"
    },
    {
      "id": "e6b25ac2-0744-5938-adcf-85aa3029b1fc",
      "status": "active",
      "version": 1,
      "taxon_id": "c7c014fa-4953-51b1-9119-9511b5778963",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "audience_scope": "business_buyer",
      "research_block": "market_intelligence"
    },
    {
      "id": "f19a300b-6d9d-5ecd-8cab-6f890d10d413",
      "status": "active",
      "version": 1,
      "taxon_id": "ff8a1dfe-9baf-590a-8dfd-82d7cce71058",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "audience_scope": "business_buyer",
      "research_block": "market_intelligence"
    },
    {
      "id": "f77ed02c-86e8-5f5b-afc6-d1a1188febb4",
      "status": "active",
      "version": 1,
      "taxon_id": "7b6f7d09-0182-5025-aac7-e6947b01910a",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "audience_scope": "business_buyer",
      "research_block": "market_intelligence"
    },
    {
      "id": "f8294826-4ab6-5c42-88ea-ccb5e33bd839",
      "status": "active",
      "version": 1,
      "taxon_id": "53dbf586-b97b-5c5f-a55c-a3dd1d0a373d",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "audience_scope": "business_buyer",
      "research_block": "market_intelligence"
    },
    {
      "id": "f893c55c-9d56-5079-badc-0e0f9bb7ea4f",
      "status": "active",
      "version": 1,
      "taxon_id": "0aa3ec7c-b375-56b6-a610-a43d2cf4eb49",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "audience_scope": "business_buyer",
      "research_block": "market_intelligence"
    },
    {
      "id": "f959b397-71a7-5196-ac68-603f6ae44d05",
      "status": "active",
      "version": 1,
      "taxon_id": "9c6eeafe-e2fa-506c-ab8d-2242dd94b9a2",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "audience_scope": "business_buyer",
      "research_block": "market_intelligence"
    }
  ],
  "before_items": [
    {
      "id": "01338f0a-d5a6-5c4d-95b0-2f21481164ae",
      "notes": "Acervo do titular: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; recorte: Advogados. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "communication_opportunity",
      "priority": 2,
      "is_active": true,
      "item_text": "Apresentar atuação confirmada e conteúdo informativo; publicidade exige verificação normativa própria e não promessa de êxito.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 3,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "f77ed02c-86e8-5f5b-afc6-d1a1188febb4"
    },
    {
      "id": "013ebc4c-ebad-51ee-9aa8-72f9cc35341e",
      "notes": "Acervo do titular: Veículos e Transportes.pdf, p.1, 2025-06-26; recorte: Concessionárias de lanchas. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "market_overview",
      "priority": 2,
      "is_active": true,
      "item_text": "O acervo aborda comércio náutico e atendimento especializado; projeções antigas não são atualidade.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 1,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "c2f09d80-1f32-546b-a6ff-a1e4091cee1d"
    },
    {
      "id": "01cf5d4f-ad72-51e0-a1b7-098ca7db8c62",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Médicos (Consultórios). Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "digital_maturity",
      "priority": 2,
      "is_active": true,
      "item_text": "O acervo menciona presença digital heterogênea em 2025.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 2,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "d5bf615a-deb7-55a2-8832-a9f1b22a659b"
    },
    {
      "id": "03e4716a-a422-50b7-b212-d51e96ae61ef",
      "notes": "Acervo do titular: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; recorte: Confeitarias. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "digital_maturity",
      "priority": 2,
      "is_active": true,
      "item_text": "A pesquisa cita portfólio visual, Instagram e WhatsApp como caminhos usados em 2025, sem medir adoção atual.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 2,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "28266a9f-faf0-583f-bac7-ee7fdb9fc79a"
    },
    {
      "id": "04a159b8-8b90-51e7-8c63-53b8aafd4373",
      "notes": "Acervo do titular: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; recorte: Arquitetos. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "market_overview",
      "priority": 2,
      "is_active": true,
      "item_text": "O acervo descreve projetos de arquitetura e mercado heterogêneo, sem validar honorários ou rendimentos.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 1,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "3c675b4d-43d4-52da-a2dc-eba41130917d"
    },
    {
      "id": "05832cd1-a85c-5bf3-a19c-f06978986376",
      "notes": "Acervo do titular: Imobiliário Construção.pdf, p.1, 2025-06-26; recorte: Energia Solar. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "market_overview",
      "priority": 2,
      "is_active": true,
      "item_text": "O texto descreve empresas de projetos e instalação solar; crescimento, margens e economia futura não foram validados.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 1,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "902d26ac-62c0-5b9c-b4e8-e5915fc64566"
    },
    {
      "id": "08ebb41d-49e4-5f88-90a0-d42cbbcbb4b1",
      "notes": "Acervo do titular: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; recorte: Lojas de Iluminação. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "market_overview",
      "priority": 2,
      "is_active": true,
      "item_text": "O acervo cobre comércio de iluminação com mix e valores heterogêneos.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 1,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "0a8d7814-ed9b-5a9f-babd-5be9142a1c62"
    },
    {
      "id": "0934b6d1-b60d-52dc-ba90-333b691a9f94",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Hospitais. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "market_overview",
      "priority": 2,
      "is_active": true,
      "item_text": "A pesquisa aborda organizações hospitalares e reputação, sem sustentar contagem ou crescimento atual.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 1,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "106aab43-8724-516f-8ef4-7513d564eb5f"
    },
    {
      "id": "09b1ff14-7b29-5f71-b5f2-d843d39a7d76",
      "notes": "Acervo do titular: Fitnes e Esportes.pdf, p.1, 2025-06-26; recorte: Academias de Artes Marciais. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "market_overview",
      "priority": 2,
      "is_active": true,
      "item_text": "A pesquisa destaca comunidade, reputação do instrutor e modalidades de luta, sem tomar crescimento histórico como atual.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 1,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "c593f1ec-5f4f-531f-9070-80b4441eef28"
    },
    {
      "id": "09b5deb7-c73b-552a-a065-0df6c1e13e91",
      "notes": "Acervo do titular: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; recorte: Móveis Planejados. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "digital_maturity",
      "priority": 2,
      "is_active": true,
      "item_text": "O acervo histórico cita portfólio e geração de contatos.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 2,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "6fdb3f17-1fb2-5759-948c-09966870e3e8"
    },
    {
      "id": "0a04e266-7979-5adb-addb-a8e256208a25",
      "notes": "Acervo do titular: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; recorte: Corretores de Imóveis (Imobiliário). Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "communication_opportunity",
      "priority": 2,
      "is_active": true,
      "item_text": "Qualificar apresentação e contato com interessados; portfólio, disponibilidade e diferenciais dependem de confirmação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 3,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "16278d0f-7f85-5222-bd62-9e57d491a537"
    },
    {
      "id": "0a439c4f-02e6-5e32-a6b6-b5268ac2c5b2",
      "notes": "Acervo do titular: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; recorte: Corretores de Imóveis (Imobiliário). Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "digital_maturity",
      "priority": 2,
      "is_active": true,
      "item_text": "O acervo cita anúncios, portais e relacionamento digital em 2025.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 2,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "16278d0f-7f85-5222-bd62-9e57d491a537"
    },
    {
      "id": "0a7d00ef-b642-5778-b947-546f41f8aebe",
      "notes": "Acervo do titular: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; recorte: Lojas de Roupa. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "market_overview",
      "priority": 2,
      "is_active": true,
      "item_text": "O acervo descreve competição e renovação de oferta de vestuário, sem validar crescimento ou margens atuais.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 1,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "85d331a2-c4ff-51fa-9a4e-26b99e724824"
    },
    {
      "id": "0ac87ec4-37ae-5662-8960-3ed68bb63e94",
      "notes": "Acervo do titular: Imobiliário Construção.pdf, p.1, 2025-06-26; recorte: Empresas de Engenharia. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "digital_maturity",
      "priority": 2,
      "is_active": true,
      "item_text": "O acervo cita relacionamento e presença institucional como caminhos históricos de divulgação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 2,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "c1c9a4b6-60ca-511e-a343-a7f028d93c1f"
    },
    {
      "id": "0bb532b6-88a0-572c-a87c-e46fcdf75bc7",
      "notes": "Acervo do titular: Imobiliário Construção.pdf, p.1, 2025-06-26; recorte: Imobiliárias. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "communication_opportunity",
      "priority": 2,
      "is_active": true,
      "item_text": "Qualificar apresentação dos imóveis e contato; atendimento e experiência local só se comprovados.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 3,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "1faa0522-effd-52bb-80de-8967130856f9"
    },
    {
      "id": "0d77c61d-a9ad-591e-b9ff-1fb8e4175060",
      "notes": "Acervo do titular: Hotelaria e Turismo.pdf, p.1, 2025-06-26; recorte: Hotéis (Hotelaria). Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "digital_maturity",
      "priority": 2,
      "is_active": true,
      "item_text": "O acervo de 2025 cita portais de reserva, site, busca e redes, com adoção desigual.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 2,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "e6b25ac2-0744-5938-adcf-85aa3029b1fc"
    },
    {
      "id": "0f9ee6c5-bb72-57bb-a59d-c61ea87a08f0",
      "notes": "Fontes aproveitadas: Saúde e Bem-estar.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida.",
      "item_key": "evidence_limitations",
      "priority": 3,
      "is_active": true,
      "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 4,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "106aab43-8724-516f-8ef4-7513d564eb5f"
    },
    {
      "id": "10138ce1-9317-52ef-8a06-0ec7b560ff84",
      "notes": "Acervo do titular: Imobiliário Construção.pdf, p.1, 2025-06-26; recorte: Material de Construção (Indústria). Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "communication_opportunity",
      "priority": 2,
      "is_active": true,
      "item_text": "Apresentar especificações verificadas e canais de fornecimento; qualidade certificada, escala e prazos exigem prova.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 3,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "b48f71c3-50a1-57f5-8661-b3239735fde1"
    },
    {
      "id": "111d05bf-3686-5ba0-95d5-08aa648bde4f",
      "notes": "Acervo do titular: Hotelaria e Turismo.pdf, p.1, 2025-06-26; recorte: Motéis (Motelaria). Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "digital_maturity",
      "priority": 2,
      "is_active": true,
      "item_text": "A pesquisa histórica menciona descoberta local, conteúdo visual e canais próprios.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 2,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "1034feee-11ae-5479-ad86-1b91d9571916"
    },
    {
      "id": "1165a33e-b528-5ce7-995e-f09a5fffe23d",
      "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Aluguel de Roupas. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "communication_opportunity",
      "priority": 2,
      "is_active": true,
      "item_text": "Explicar prova, reserva e condições reais de locação; variedade e ajuste dependem da operação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 3,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "f893c55c-9d56-5079-badc-0e0f9bb7ea4f"
    },
    {
      "id": "11968815-0d00-5915-b82f-241c0ad378b3",
      "notes": "Fontes aproveitadas: Saúde e Bem-estar.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida.",
      "item_key": "evidence_limitations",
      "priority": 3,
      "is_active": true,
      "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 4,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "16a2416c-d5c9-5356-983b-f354ce2eca08"
    },
    {
      "id": "12573af5-58c8-5794-87c8-3d6128f9979d",
      "notes": "Acervo do titular: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; recorte: Consultorias Empresariais. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "digital_maturity",
      "priority": 2,
      "is_active": true,
      "item_text": "A leitura histórica cita conteúdo técnico e relacionamento entre empresas.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 2,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "c043fb2c-c712-5425-898a-d77c4ae00008"
    },
    {
      "id": "12778d66-be5c-54f6-801f-b9dc71d74528",
      "notes": "Fontes aproveitadas: Varejo e Comércio Local 2.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida.",
      "item_key": "evidence_limitations",
      "priority": 3,
      "is_active": true,
      "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 4,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "33cbabb9-1844-50da-b1a3-47d554182249"
    },
    {
      "id": "142d35f8-07fa-5dd0-908e-561b9db35fad",
      "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Óticas. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "digital_maturity",
      "priority": 2,
      "is_active": true,
      "item_text": "A leitura de 2025 sugere busca e presença visual.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 2,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "997272c5-ec44-5398-82d9-1cf7f2cc8d80"
    },
    {
      "id": "1460e065-474c-5ec1-949b-010f592269f0",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Farmácia. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "digital_maturity",
      "priority": 2,
      "is_active": true,
      "item_text": "A pesquisa de 2025 cita descoberta local e canais de entrega em parte das operações.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 2,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "63e12d86-2f4f-5ff7-ace8-8c2a8b98f676"
    },
    {
      "id": "1475d816-3e25-5e6f-861b-7f8f121f38c0",
      "notes": "Acervo do titular: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; recorte: Advogados. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "market_overview",
      "priority": 2,
      "is_active": true,
      "item_text": "O material trata de serviços jurídicos com públicos e honorários diversos, sem validar renda ou demanda atual.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 1,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "f77ed02c-86e8-5f5b-afc6-d1a1188febb4"
    },
    {
      "id": "1490907c-e4e1-54a7-8885-ece3f60897ce",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Farmácia. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "communication_opportunity",
      "priority": 2,
      "is_active": true,
      "item_text": "Esclarecer localização, horário e serviços permitidos e confirmados; não produzir recomendações de medicamentos.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 3,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "63e12d86-2f4f-5ff7-ace8-8c2a8b98f676"
    },
    {
      "id": "14df650c-17eb-5d0f-b49d-fa5ef33b1dc0",
      "notes": "Fontes aproveitadas: Varejo e Comércio Local 2.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida.",
      "item_key": "evidence_limitations",
      "priority": 3,
      "is_active": true,
      "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 4,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "997272c5-ec44-5398-82d9-1cf7f2cc8d80"
    },
    {
      "id": "1545e1cd-52b5-5491-9967-c289e236d1bf",
      "notes": "Fontes aproveitadas: Saúde e Bem-estar.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida.",
      "item_key": "evidence_limitations",
      "priority": 3,
      "is_active": true,
      "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 4,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "d5bf615a-deb7-55a2-8832-a9f1b22a659b"
    },
    {
      "id": "16cec7ec-c756-5084-a936-f0af9c1ff374",
      "notes": "Acervo do titular: Veículos e Transportes.pdf, p.1, 2025-06-26; recorte: Empresas de mudanças. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "market_overview",
      "priority": 2,
      "is_active": true,
      "item_text": "O acervo descreve serviços de transporte em mudanças e diversidade de porte, sem estatística consolidada verificada.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 1,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "d45cc27f-701b-54bc-aaa4-6de93152dfb9"
    },
    {
      "id": "1899a258-0416-5d0e-81a0-e3ba052baf9f",
      "notes": "Fontes aproveitadas: Veículos e Transportes.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida.",
      "item_key": "evidence_limitations",
      "priority": 3,
      "is_active": true,
      "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 4,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "de373e04-827e-5c85-82ea-f4e7009cb97e"
    },
    {
      "id": "18a445ed-6740-500f-bd3f-935615bf7273",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Salão de Beleza. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "market_overview",
      "priority": 2,
      "is_active": true,
      "item_text": "O acervo descreve negócios locais de serviços de beleza e recorrência, sem validar porte ou margens.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 1,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "f959b397-71a7-5196-ac68-603f6ae44d05"
    },
    {
      "id": "1a105ccf-d58a-5bcb-a90f-385c673ff7df",
      "notes": "Acervo do titular: Imobiliário Construção.pdf, p.1, 2025-06-26; recorte: Construtoras/Incorporadoras. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "digital_maturity",
      "priority": 2,
      "is_active": true,
      "item_text": "A leitura histórica cita campanhas, portais e CRM na divulgação de empreendimentos.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 2,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "66abf9c2-3920-5f7d-ac9e-9a686342858f"
    },
    {
      "id": "1b51a5fe-d317-552c-8654-2322308d95fc",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Fisioterapia. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "communication_opportunity",
      "priority": 2,
      "is_active": true,
      "item_text": "Apresentar modalidades e atendimento real; não inferir indicação clínica nem prometer recuperação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 3,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "68aea8e0-d763-5597-850e-f294df298fd8"
    },
    {
      "id": "1bd88399-b0cc-57ee-b99f-0596a08f96b3",
      "notes": "Acervo do titular: Veículos e Transportes.pdf, p.1, 2025-06-26; recorte: Concessionárias de carros. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "market_overview",
      "priority": 2,
      "is_active": true,
      "item_text": "O material trata de venda de veículos e comparação de ofertas, sem validar volume ou margens atuais.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 1,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "0de38fe8-16ad-575f-8508-bdbb6bf50076"
    },
    {
      "id": "1e0509b8-6f03-56be-a7b3-c85d9564306b",
      "notes": "Acervo do titular: Veículos e Transportes.pdf, p.1, 2025-06-26; recorte: Empresas de mudanças. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "communication_opportunity",
      "priority": 2,
      "is_active": true,
      "item_text": "Explicar orçamento e escopo reais; cobertura, cuidados e seguro só quando comprovados.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 3,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "d45cc27f-701b-54bc-aaa4-6de93152dfb9"
    },
    {
      "id": "1ee13249-c813-5ebe-907d-d0221bdd2747",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Harmonização Facial. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "digital_maturity",
      "priority": 2,
      "is_active": true,
      "item_text": "O quadro histórico enfatiza conteúdo visual e concorrência digital, sem validar saturação atual.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 2,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "4b304c4e-01a8-51dc-b0dd-8fa2f5ca2d41"
    },
    {
      "id": "1f7eb67b-8f29-53f6-a038-d090ba82c837",
      "notes": "Fontes aproveitadas: Veículos e Transportes.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida.",
      "item_key": "evidence_limitations",
      "priority": 3,
      "is_active": true,
      "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 4,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "0de38fe8-16ad-575f-8508-bdbb6bf50076"
    },
    {
      "id": "1f913f93-b53a-5948-bf92-9594d3832e61",
      "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Utilidades do Lar. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "digital_maturity",
      "priority": 2,
      "is_active": true,
      "item_text": "A observação de 2025 sugere maturidade digital variável.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 2,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "f19a300b-6d9d-5ecd-8cab-6f890d10d413"
    },
    {
      "id": "1fc509e3-6e73-59af-959e-52e9cf723324",
      "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Loja de Informática. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "digital_maturity",
      "priority": 2,
      "is_active": true,
      "item_text": "O acervo histórico associa descoberta digital a pesquisa de produtos.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 2,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "33cbabb9-1844-50da-b1a3-47d554182249"
    },
    {
      "id": "2018d2bc-fb9d-5ed3-95be-e5e842f83310",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Spa. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "communication_opportunity",
      "priority": 2,
      "is_active": true,
      "item_text": "Apresentar estrutura, serviços e condições reais; experiência premium ou benefício terapêutico não é presumido.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 3,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "840bc8f9-a341-53c7-8ce8-c31fa516b9fc"
    },
    {
      "id": "20cc1990-888b-510b-b8a1-24bbd7a49515",
      "notes": "Acervo do titular: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; recorte: Contadores. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "communication_opportunity",
      "priority": 2,
      "is_active": true,
      "item_text": "Clarificar escopo e atendimento; especialização e agilidade só quando confirmadas, sem prometer economia tributária.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 3,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "39c4cb19-e78f-508d-a78e-88ec8352af47"
    },
    {
      "id": "21881e18-4719-5412-b14b-a7ca34ec99b3",
      "notes": "Acervo do titular: Veículos e Transportes.pdf, p.1, 2025-06-26; recorte: Concessionárias de carros. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "digital_maturity",
      "priority": 2,
      "is_active": true,
      "item_text": "A pesquisa histórica cita sites, CRM e anúncios.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 2,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "0de38fe8-16ad-575f-8508-bdbb6bf50076"
    },
    {
      "id": "22d76f1a-16ef-53a6-a3bf-0ecccba322fb",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Fisioterapia. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "market_overview",
      "priority": 2,
      "is_active": true,
      "item_text": "O material trata de acompanhamento fisioterapêutico, sem validar volume de profissionais ou efeitos de tratamento.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 1,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "68aea8e0-d763-5597-850e-f294df298fd8"
    },
    {
      "id": "24153fa6-cda1-5a57-b325-9588ff23a6fb",
      "notes": "Acervo do titular: Imobiliário Construção.pdf, p.1, 2025-06-26; recorte: Energia Solar. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "communication_opportunity",
      "priority": 2,
      "is_active": true,
      "item_text": "Explicar avaliação e etapas reais do projeto; economia, retorno, homologação e garantias dependem do caso e não são promessas gerais.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 3,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "902d26ac-62c0-5b9c-b4e8-e5915fc64566"
    },
    {
      "id": "27b65fb4-f6ab-59d9-92ac-a3f36122763b",
      "notes": "Acervo do titular: Veículos e Transportes.pdf, p.1, 2025-06-26; recorte: Concessionárias de lanchas. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "communication_opportunity",
      "priority": 2,
      "is_active": true,
      "item_text": "Apresentar embarcações e serviços reais; disponibilidade, especificações e condições exigem confirmação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 3,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "c2f09d80-1f32-546b-a6ff-a1e4091cee1d"
    },
    {
      "id": "2963b3d2-8ab7-5f49-ab7c-350869d45949",
      "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Loja de Sapatos. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "market_overview",
      "priority": 2,
      "is_active": true,
      "item_text": "O acervo aborda varejo de calçados, sem validar crescimento ou margem atuais.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 1,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "2c88749f-ab50-563b-9525-b67103b77ada"
    },
    {
      "id": "2b3e3e1b-52a5-5b08-8000-fd0eab837e90",
      "notes": "Acervo do titular: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; recorte: Supermercados. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "market_overview",
      "priority": 2,
      "is_active": true,
      "item_text": "O documento descreve operação de volume e mix de compras, sem sustentar margens ou porte de uma loja específica.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 1,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "d3254254-c82c-5732-9ed1-dd66270b8a20"
    },
    {
      "id": "2bc86bb4-cc27-52d4-8986-cd6ee8663220",
      "notes": "Acervo do titular: Imobiliário Construção.pdf, p.1, 2025-06-26; recorte: Material de Construção (Indústria). Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "market_overview",
      "priority": 2,
      "is_active": true,
      "item_text": "O documento distingue fabricação e fornecimento em lotes do comércio varejista, sem validar indicadores industriais atuais.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 1,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "b48f71c3-50a1-57f5-8661-b3239735fde1"
    },
    {
      "id": "2c0ce177-1dab-5da1-a7ed-a2a0250c47ea",
      "notes": "Fontes aproveitadas: Serviços Profissionais Consultoria.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida.",
      "item_key": "evidence_limitations",
      "priority": 3,
      "is_active": true,
      "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 4,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "16278d0f-7f85-5222-bd62-9e57d491a537"
    },
    {
      "id": "2dcebcb6-9213-5bd4-9c39-76e7231f5f5a",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Nutricionistas. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "communication_opportunity",
      "priority": 2,
      "is_active": true,
      "item_text": "Comunicar formato de acompanhamento confirmado; não apresentar prescrição, resultado ou promessa individual.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 3,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "16a2416c-d5c9-5356-983b-f354ce2eca08"
    },
    {
      "id": "30baaa22-03fd-51d2-ba4a-1990e2098604",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Nutricionistas. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "digital_maturity",
      "priority": 2,
      "is_active": true,
      "item_text": "A pesquisa histórica destaca conteúdo orgânico e adoção variável de anúncios.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 2,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "16a2416c-d5c9-5356-983b-f354ce2eca08"
    },
    {
      "id": "30d08cf6-48ba-552e-801d-26a090b1039a",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Spa. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "digital_maturity",
      "priority": 2,
      "is_active": true,
      "item_text": "A observação histórica cita conteúdo visual e parcerias.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 2,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "840bc8f9-a341-53c7-8ce8-c31fa516b9fc"
    },
    {
      "id": "32334a44-b3c0-5241-beda-d271f58776b6",
      "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Utilidades do Lar. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "communication_opportunity",
      "priority": 2,
      "is_active": true,
      "item_text": "Organizar categorias de produtos e conveniência real; preço e disponibilidade precisam estar confirmados.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 3,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "f19a300b-6d9d-5ecd-8cab-6f890d10d413"
    },
    {
      "id": "33396142-0e8c-5ea3-9602-400808fc5f39",
      "notes": "Fontes aproveitadas: Imobiliário Construção.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida.",
      "item_key": "evidence_limitations",
      "priority": 3,
      "is_active": true,
      "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 4,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "66abf9c2-3920-5f7d-ac9e-9a686342858f"
    },
    {
      "id": "3343f56a-3a7d-54f3-b6b3-7b2e1acab2a7",
      "notes": "Fontes aproveitadas: Fitnes e Esportes.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida.",
      "item_key": "evidence_limitations",
      "priority": 3,
      "is_active": true,
      "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 4,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "f8294826-4ab6-5c42-88ea-ccb5e33bd839"
    },
    {
      "id": "335f4d84-fc2c-5d0f-a61a-c973e40fe6cd",
      "notes": "Acervo do titular: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; recorte: Cafeterias. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "digital_maturity",
      "priority": 2,
      "is_active": true,
      "item_text": "O acervo cita presença visual em redes e construção de marca em 2025, sem comprovar a situação de uma cafeteria atual.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 2,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "e26e900b-8fe5-5ec8-b62a-6e0986a887bf"
    },
    {
      "id": "372bdf78-2113-52ca-8289-6d5470ea82bb",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Odontologia. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "digital_maturity",
      "priority": 2,
      "is_active": true,
      "item_text": "O acervo histórico menciona busca e conteúdo de profissionais.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 2,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "342a642b-8fd5-5d14-a68f-ae15ad108b4a"
    },
    {
      "id": "3cf945f3-f03c-53d8-bde4-4d9cdd4e025b",
      "notes": "Acervo do titular: Imobiliário Construção.pdf, p.1, 2025-06-26; recorte: Imobiliárias. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "market_overview",
      "priority": 2,
      "is_active": true,
      "item_text": "O material trata de intermediação de imóveis e concorrência local; crescimento de vendas e comissões são históricos não validados.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 1,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "1faa0522-effd-52bb-80de-8967130856f9"
    },
    {
      "id": "3da66b63-d2f1-5037-a7bf-2f66ac82977d",
      "notes": "Acervo do titular: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; recorte: Arquitetos. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "digital_maturity",
      "priority": 2,
      "is_active": true,
      "item_text": "A leitura de 2025 cita portfólio visual e descoberta local.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 2,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "3c675b4d-43d4-52da-a2dc-eba41130917d"
    },
    {
      "id": "3dbf5f9d-a9ab-5411-b605-c186c7d6919f",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Médicos (Consultórios). Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "communication_opportunity",
      "priority": 2,
      "is_active": true,
      "item_text": "Esclarecer atendimento e acesso à consulta; qualificações e publicidade precisam de verificação própria antes de uso.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 3,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "d5bf615a-deb7-55a2-8832-a9f1b22a659b"
    },
    {
      "id": "3e338aaa-2c70-54af-8144-b6281f745bb0",
      "notes": "Acervo do titular: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; recorte: Padarias. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "market_overview",
      "priority": 2,
      "is_active": true,
      "item_text": "O material relaciona panificação a compras frequentes, lanches e operação local, sem comprovar expansão atual.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 1,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "a2409fde-422d-52d3-83e6-71f9a1dc4604"
    },
    {
      "id": "3f779ba9-7846-5835-baa8-d1d45eaaa368",
      "notes": "Fontes aproveitadas: Varejo e Comércio Local 2.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida.",
      "item_key": "evidence_limitations",
      "priority": 3,
      "is_active": true,
      "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 4,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "2c88749f-ab50-563b-9525-b67103b77ada"
    },
    {
      "id": "400225a7-38ba-5bf9-adbe-81dd5eacf622",
      "notes": "Fontes aproveitadas: Varejo e Comércio Local 1.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida.",
      "item_key": "evidence_limitations",
      "priority": 3,
      "is_active": true,
      "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 4,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "cfa04ae3-d989-5a72-a155-84d4f96f9fb0"
    },
    {
      "id": "421653da-eb41-5b3d-a0f1-c7b6cf7b616a",
      "notes": "Acervo do titular: Educação.pdf, p.1, 2025-06-25; recorte: Faculdades Privadas. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "digital_maturity",
      "priority": 2,
      "is_active": true,
      "item_text": "O quadro de 2025 menciona anúncios, inbound e CRM, sem aferição atual.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 2,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "1bc90f27-db13-5b45-b180-cb12cedc0bb0"
    },
    {
      "id": "4330a693-01c8-5ec1-a270-67c8226ea044",
      "notes": "Acervo do titular: Fitnes e Esportes.pdf, p.1, 2025-06-26; recorte: Academias de Ginástica. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "digital_maturity",
      "priority": 2,
      "is_active": true,
      "item_text": "A leitura de 2025 descreve contraste entre redes estruturadas e pequenas operações com divulgação básica.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 2,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "f8294826-4ab6-5c42-88ea-ccb5e33bd839"
    },
    {
      "id": "4489dfaa-7824-5600-bda7-79966a3c7ffa",
      "notes": "Fontes aproveitadas: Educação.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida.",
      "item_key": "evidence_limitations",
      "priority": 3,
      "is_active": true,
      "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 4,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "1bc90f27-db13-5b45-b180-cb12cedc0bb0"
    },
    {
      "id": "454859f3-3a90-53e7-a141-9ac39d449a53",
      "notes": "Fontes aproveitadas: Educação.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida.",
      "item_key": "evidence_limitations",
      "priority": 3,
      "is_active": true,
      "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 4,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "03e6c2a3-493b-5601-bf29-db4c8c97bf21"
    },
    {
      "id": "45900b9c-b332-5793-a45c-6e571a81a5c3",
      "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Loja de Sapatos. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "digital_maturity",
      "priority": 2,
      "is_active": true,
      "item_text": "O quadro de 2025 enfatiza comunicação visual e social.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 2,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "2c88749f-ab50-563b-9525-b67103b77ada"
    },
    {
      "id": "47ae0662-4f66-585b-9670-1641668d11e1",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Clínicas Médicas. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "digital_maturity",
      "priority": 2,
      "is_active": true,
      "item_text": "O acervo de 2025 descreve sites, conteúdo e estratégias variadas.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 2,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "d5c0e5ab-875f-52c8-afb4-a0facb0b2a48"
    },
    {
      "id": "486ee5bd-32f3-5779-915a-ff0a13f6a7de",
      "notes": "Acervo do titular: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; recorte: Padarias. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "digital_maturity",
      "priority": 2,
      "is_active": true,
      "item_text": "O acervo descreve adoção digital desigual e aprendizado de redes e aplicativos, hipótese histórica a conferir.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 2,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "a2409fde-422d-52d3-83e6-71f9a1dc4604"
    },
    {
      "id": "4cfd6b6c-d2da-5b11-ba3e-b329b0b3bd9b",
      "notes": "Acervo do titular: Educação.pdf, p.1, 2025-06-25; recorte: Escolas de Idiomas. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "communication_opportunity",
      "priority": 2,
      "is_active": true,
      "item_text": "Comunicar modalidades e objetivos de aprendizagem confirmados; método, certificação e evolução individual exigem comprovação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 3,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "2518abd5-c761-50d2-b29a-cf12f3a4b29e"
    },
    {
      "id": "4e01c64b-3448-5a9c-8b45-c0d892a72afb",
      "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Joalheria. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "communication_opportunity",
      "priority": 2,
      "is_active": true,
      "item_text": "Apresentar peças e informações verificadas; autenticidade, material e certificação exigem prova.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 3,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "2e4a461d-27a6-57c0-a0d0-2283d8f379f3"
    },
    {
      "id": "4eae0e9f-4381-5111-b4a5-37cfd9252efc",
      "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Bateria de Carro. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "market_overview",
      "priority": 2,
      "is_active": true,
      "item_text": "O quadro cobre comércio de baterias automotivas, distinto de produto isolado por haver loja explicitada na lista.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 1,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "c0b7e6ce-81be-534d-94ff-487dfe9e5b96"
    },
    {
      "id": "503525fb-86c5-544c-8274-5b6d4fd3a53c",
      "notes": "Acervo do titular: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; recorte: Contadores. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "market_overview",
      "priority": 2,
      "is_active": true,
      "item_text": "O material descreve atendimento contábil recorrente e concorrência, sem validar faturamento ou retenção.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 1,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "39c4cb19-e78f-508d-a78e-88ec8352af47"
    },
    {
      "id": "50364ccd-4e0e-5cbc-96f2-9965c23b1cbe",
      "notes": "Fontes aproveitadas: Educação.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida.",
      "item_key": "evidence_limitations",
      "priority": 3,
      "is_active": true,
      "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 4,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "05d666b4-ad53-53fc-bbaf-87ddab20269f"
    },
    {
      "id": "503af7d4-dae3-5ce6-a060-83a5c3f70698",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Farmácia. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "market_overview",
      "priority": 2,
      "is_active": true,
      "item_text": "O quadro diferencia redes e farmácias independentes, sem validar margens ou faturamento atual.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 1,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "63e12d86-2f4f-5ff7-ace8-8c2a8b98f676"
    },
    {
      "id": "509090b0-823f-5d04-9f71-3532fc865635",
      "notes": "Acervo do titular: Hotelaria e Turismo.pdf, p.1, 2025-06-26; recorte: Agências de Turismo. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "digital_maturity",
      "priority": 2,
      "is_active": true,
      "item_text": "A leitura de 2025 destaca busca, conteúdo e relacionamento digital, com diferenças entre operações.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 2,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "575b18e9-de6f-5a5a-99f1-3607b20c89ec"
    },
    {
      "id": "50a586a0-710a-5d3e-8f3a-e378a1a7f257",
      "notes": "Acervo do titular: Fitnes e Esportes.pdf, p.1, 2025-06-26; recorte: Academias de Artes Marciais. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "communication_opportunity",
      "priority": 2,
      "is_active": true,
      "item_text": "Explicar modalidades e públicos efetivamente atendidos; reputação, conquistas e aula experimental dependem de comprovação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 3,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "c593f1ec-5f4f-531f-9070-80b4441eef28"
    },
    {
      "id": "50c9e9b3-bd6e-5732-89e1-2ed8ee349751",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Depilação a Laser. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "communication_opportunity",
      "priority": 2,
      "is_active": true,
      "item_text": "Se a clínica confirmar a oferta, esclarecer avaliação e condições reais; eficácia, segurança e resultado não são garantias gerais.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 6,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "41b7e4f9-ed34-50f4-b208-e83a9204a1e2"
    },
    {
      "id": "50e9455d-bffe-5599-85b4-e68575a9dbda",
      "notes": "Fontes aproveitadas: Hotelaria e Turismo.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida.",
      "item_key": "evidence_limitations",
      "priority": 3,
      "is_active": true,
      "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 4,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "575b18e9-de6f-5a5a-99f1-3607b20c89ec"
    },
    {
      "id": "53601b45-4ffa-503c-9d1b-255784f1efe2",
      "notes": "Acervo do titular: Imobiliário Construção.pdf, p.1, 2025-06-26; recorte: Imobiliárias. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "digital_maturity",
      "priority": 2,
      "is_active": true,
      "item_text": "A pesquisa cita portais, redes e necessidade de organização de dados, como observações de 2025.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 2,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "1faa0522-effd-52bb-80de-8967130856f9"
    },
    {
      "id": "53711982-1951-51e6-ade4-4e3072090e5d",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Clínica de Estética. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "market_overview",
      "priority": 2,
      "is_active": true,
      "item_text": "O acervo descreve clínicas e serviços estéticos; volume de procedimentos e rentabilidade não foram validados.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 1,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "41b7e4f9-ed34-50f4-b208-e83a9204a1e2"
    },
    {
      "id": "53ae43c1-b050-50ee-94a9-9b85dac5e629",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Clínicas Médicas. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "communication_opportunity",
      "priority": 2,
      "is_active": true,
      "item_text": "Organizar especialidades, agenda e canais reais de atendimento; preço, convênio e estrutura só com confirmação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 3,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "d5c0e5ab-875f-52c8-afb4-a0facb0b2a48"
    },
    {
      "id": "53be5e30-9a8a-5aa4-a429-b6c1885c7ede",
      "notes": "Acervo do titular: Hotelaria e Turismo.pdf, p.1, 2025-06-26; recorte: Agências de Turismo. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "communication_opportunity",
      "priority": 2,
      "is_active": true,
      "item_text": "Explicar planejamento, atendimento e condições reais dos pacotes; especialização e assistência diferenciadas exigem confirmação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 3,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "575b18e9-de6f-5a5a-99f1-3607b20c89ec"
    },
    {
      "id": "54b4631e-9bd3-50ce-8fec-0fd7bf0c1018",
      "notes": "Acervo do titular: Veículos e Transportes.pdf, p.1, 2025-06-26; recorte: Empresas de mudanças. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "digital_maturity",
      "priority": 2,
      "is_active": true,
      "item_text": "A observação de 2025 cita indicação e descoberta local com digitalização desigual.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 2,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "d45cc27f-701b-54bc-aaa4-6de93152dfb9"
    },
    {
      "id": "59929fbb-3a71-5f7f-b48c-35987fc0f6be",
      "notes": "Acervo do titular: Hotelaria e Turismo.pdf, p.1, 2025-06-26; recorte: Hotéis (Hotelaria). Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "communication_opportunity",
      "priority": 2,
      "is_active": true,
      "item_text": "Esclarecer acomodação, localização e condições reais de reserva; reservas diretas e experiência são possibilidades condicionais.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 3,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "e6b25ac2-0744-5938-adcf-85aa3029b1fc"
    },
    {
      "id": "5a913add-ccf4-5944-b3f1-a0c9fd6eec02",
      "notes": "Acervo do titular: Educação.pdf, p.1, 2025-06-25; recorte: Escolas de Música. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "market_overview",
      "priority": 2,
      "is_active": true,
      "item_text": "O quadro trata de ensino musical para públicos diversos, sem indicadores atuais sustentados.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 1,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "03e6c2a3-493b-5601-bf29-db4c8c97bf21"
    },
    {
      "id": "5ab38254-6c99-548d-a474-0c110beb86b8",
      "notes": "Fontes aproveitadas: Varejo e Comércio Local 1.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida.",
      "item_key": "evidence_limitations",
      "priority": 3,
      "is_active": true,
      "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 4,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "6fdb3f17-1fb2-5759-948c-09966870e3e8"
    },
    {
      "id": "5bb73957-5fea-58bc-8cf6-6bccb1c168a0",
      "notes": "Fontes aproveitadas: Hotelaria e Turismo.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida.",
      "item_key": "evidence_limitations",
      "priority": 3,
      "is_active": true,
      "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 4,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "1034feee-11ae-5479-ad86-1b91d9571916"
    },
    {
      "id": "5c2f7566-2a04-5fb1-baa2-c6797cf62b1a",
      "notes": "Acervo do titular: Veículos e Transportes.pdf, p.1, 2025-06-26; recorte: Oficinas mecânicas. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "communication_opportunity",
      "priority": 2,
      "is_active": true,
      "item_text": "Esclarecer serviços e agendamento confirmados; capacidade técnica, prazo e diagnóstico não podem ser presumidos.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 3,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "de373e04-827e-5c85-82ea-f4e7009cb97e"
    },
    {
      "id": "5c6e66a3-bf01-54a8-86de-92986b2213bc",
      "notes": "Fontes aproveitadas: Varejo e Comércio Local 1.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida.",
      "item_key": "evidence_limitations",
      "priority": 3,
      "is_active": true,
      "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 4,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "85d331a2-c4ff-51fa-9a4e-26b99e724824"
    },
    {
      "id": "5cd64430-8f50-5f50-bd99-69dc32f9880d",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Harmonização Facial. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "communication_opportunity",
      "priority": 2,
      "is_active": true,
      "item_text": "Informar apenas atuação e atendimento confirmados; resultado, habilitação e publicidade exigem verificação própria.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 3,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "4b304c4e-01a8-51dc-b0dd-8fa2f5ca2d41"
    },
    {
      "id": "5d7c11cf-b4d6-5a06-b9af-1f4ed2722362",
      "notes": "Acervo do titular: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; recorte: Pet Shops. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "market_overview",
      "priority": 2,
      "is_active": true,
      "item_text": "O material descreve consumo recorrente e competição entre negócios pet, sem validar crescimento atual.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 1,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "3ce5e2fc-4531-5035-8eec-c98571997872"
    },
    {
      "id": "5e413f1c-4769-5e71-a672-2ad824bce8bb",
      "notes": "Acervo do titular: Fitnes e Esportes.pdf, p.1, 2025-06-26; recorte: Academias de Ginástica. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "market_overview",
      "priority": 2,
      "is_active": true,
      "item_text": "O acervo diferencia aquisição e retenção de alunos em academias generalistas, sem validar expansão ou margens atuais.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 1,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "f8294826-4ab6-5c42-88ea-ccb5e33bd839"
    },
    {
      "id": "5ebedfe9-45ca-5bde-9465-205c96e6ee4e",
      "notes": "Acervo do titular: Imobiliário Construção.pdf, p.1, 2025-06-26; recorte: Lojas de Material (Varejo). Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "digital_maturity",
      "priority": 2,
      "is_active": true,
      "item_text": "A observação de 2025 sugere digitalização desigual de lojas locais.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 2,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "c530d2ac-d0f5-5644-9126-8e4df34f0521"
    },
    {
      "id": "5feb7257-970a-5001-adf6-1c9f270f4996",
      "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Joalheria. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "market_overview",
      "priority": 2,
      "is_active": true,
      "item_text": "O quadro trata de joias e decisão de compra por confiança e apresentação, sem validar margens ou crescimento.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 1,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "2e4a461d-27a6-57c0-a0d0-2283d8f379f3"
    },
    {
      "id": "604588c8-18b3-5a1d-b1d3-576fbff9dbef",
      "notes": "Acervo do titular: Educação.pdf, p.1, 2025-06-25; recorte: Colégios (Fundamental/Médio). Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "digital_maturity",
      "priority": 2,
      "is_active": true,
      "item_text": "A observação histórica aponta adoção digital variável entre instituições.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 2,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "05d666b4-ad53-53fc-bbaf-87ddab20269f"
    },
    {
      "id": "633e3fa9-70a2-5c81-892b-d2256d4a5073",
      "notes": "Fontes aproveitadas: Hotelaria e Turismo.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida.",
      "item_key": "evidence_limitations",
      "priority": 3,
      "is_active": true,
      "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 4,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "e6b25ac2-0744-5938-adcf-85aa3029b1fc"
    },
    {
      "id": "649016a4-d7f2-5098-b9ef-6c6b0c801bde",
      "notes": "Fontes aproveitadas: Varejo e Comércio Local 2.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida.",
      "item_key": "evidence_limitations",
      "priority": 3,
      "is_active": true,
      "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 4,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "2e4a461d-27a6-57c0-a0d0-2283d8f379f3"
    },
    {
      "id": "654c68fd-d0c8-519b-ab94-133b6b23d3ad",
      "notes": "Acervo do titular: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; recorte: Corretores de Imóveis (Imobiliário). Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "market_overview",
      "priority": 2,
      "is_active": true,
      "item_text": "A análise específica cobre corretores de imóveis; não generalizar para outras corretagens nem mudar sua hierarquia.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 1,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "16278d0f-7f85-5222-bd62-9e57d491a537"
    },
    {
      "id": "662fc8da-b893-532b-802d-08b417f85ab2",
      "notes": "Acervo do titular: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; recorte: Consultorias Empresariais. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "communication_opportunity",
      "priority": 2,
      "is_active": true,
      "item_text": "Explicar problemas atendidos e método real; casos e resultados só com prova e autorização.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 3,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "c043fb2c-c712-5425-898a-d77c4ae00008"
    },
    {
      "id": "664b1432-e718-5ea1-8de0-6db8ac40be52",
      "notes": "Fontes aproveitadas: Varejo e Comércio Local 2.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida.",
      "item_key": "evidence_limitations",
      "priority": 3,
      "is_active": true,
      "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 4,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "f893c55c-9d56-5079-badc-0e0f9bb7ea4f"
    },
    {
      "id": "6689b9f8-24e2-531f-9164-1c6888b58beb",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Odontologia. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "market_overview",
      "priority": 2,
      "is_active": true,
      "item_text": "O material descreve serviços odontológicos e concorrência, sem transformar procedimento específico em categoria nova.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 1,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "342a642b-8fd5-5d14-a68f-ae15ad108b4a"
    },
    {
      "id": "678c635e-c322-5d4c-a6dc-e6ce1aa3587b",
      "notes": "Acervo do titular: Educação.pdf, p.1, 2025-06-25; recorte: Faculdades Privadas. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "communication_opportunity",
      "priority": 2,
      "is_active": true,
      "item_text": "Organizar cursos, formas de ingresso e informação institucional verificável; não prometer empregabilidade ou resultado.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 3,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "1bc90f27-db13-5b45-b180-cb12cedc0bb0"
    },
    {
      "id": "67a50833-26a6-566e-b5b5-b491c1ef8285",
      "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Loja de Sapatos. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "communication_opportunity",
      "priority": 2,
      "is_active": true,
      "item_text": "Mostrar modelos e numeração disponíveis; conforto, troca e entrega exigem informação real.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 3,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "2c88749f-ab50-563b-9525-b67103b77ada"
    },
    {
      "id": "680e6f62-ce2e-503b-938a-bf44a0bdcada",
      "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Joalheria. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "digital_maturity",
      "priority": 2,
      "is_active": true,
      "item_text": "O acervo de 2025 enfatiza marca e conteúdo visual.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 2,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "2e4a461d-27a6-57c0-a0d0-2283d8f379f3"
    },
    {
      "id": "6823c76b-82a6-5818-9ad5-4e38924a3614",
      "notes": "Acervo do titular: Imobiliário Construção.pdf, p.1, 2025-06-26; recorte: Construtoras/Incorporadoras. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "market_overview",
      "priority": 2,
      "is_active": true,
      "item_text": "O acervo aborda empreendimentos e lançamentos; indicadores de vendas e projeções não são referência atual.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 1,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "66abf9c2-3920-5f7d-ac9e-9a686342858f"
    },
    {
      "id": "68b7f6f1-7f9c-5529-8865-94d693f5f39d",
      "notes": "Acervo do titular: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; recorte: Lojas de Iluminação. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "digital_maturity",
      "priority": 2,
      "is_active": true,
      "item_text": "A leitura histórica indica adoção digital desigual.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 2,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "0a8d7814-ed9b-5a9f-babd-5be9142a1c62"
    },
    {
      "id": "6c7be112-706f-5c21-ac70-ef4e538332ac",
      "notes": "Fontes aproveitadas: Varejo e Comércio Local 2.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida.",
      "item_key": "evidence_limitations",
      "priority": 3,
      "is_active": true,
      "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 4,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "cfa009ea-1284-52fb-bf51-124737060a6d"
    },
    {
      "id": "70355fc9-1029-5dcb-b5e8-13ea7c876f39",
      "notes": "Acervo do titular: Fitnes e Esportes.pdf, p.1, 2025-06-26; recorte: Academias de Ginástica. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "communication_opportunity",
      "priority": 2,
      "is_active": true,
      "item_text": "Clarificar modalidades e planos reais, facilitar visita e matrícula; resultados físicos e retenção não podem ser prometidos.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 3,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "f8294826-4ab6-5c42-88ea-ccb5e33bd839"
    },
    {
      "id": "7090dfc7-2eb9-519d-a302-a2a190c01686",
      "notes": "Fontes aproveitadas: Saúde e Bem-estar.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida.",
      "item_key": "evidence_limitations",
      "priority": 3,
      "is_active": true,
      "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 4,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "f959b397-71a7-5196-ac68-603f6ae44d05"
    },
    {
      "id": "70b558c9-f80f-570e-9249-080f7498b2a9",
      "notes": "Acervo do titular: Hotelaria e Turismo.pdf, p.1, 2025-06-26; recorte: Hotéis (Hotelaria). Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "market_overview",
      "priority": 2,
      "is_active": true,
      "item_text": "A pesquisa distingue distribuição por intermediários e reservas diretas; a retomada econômica descrita pertence ao período histórico.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 1,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "e6b25ac2-0744-5938-adcf-85aa3029b1fc"
    },
    {
      "id": "70bfb81d-df2e-5bea-8d87-3bea080cc0dd",
      "notes": "Acervo do titular: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; recorte: Pet Shops. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "digital_maturity",
      "priority": 2,
      "is_active": true,
      "item_text": "A pesquisa de 2025 cita conteúdo e ampliação de canais digitais.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 2,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "3ce5e2fc-4531-5035-8eec-c98571997872"
    },
    {
      "id": "71004606-54bf-5ff4-bf37-42591498ebd5",
      "notes": "Acervo do titular: Hotelaria e Turismo.pdf, p.1, 2025-06-26; recorte: Agências de Turismo. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "market_overview",
      "priority": 2,
      "is_active": true,
      "item_text": "O acervo descreve heterogeneidade entre agências e concorrência com vendas online, sem atribuir porte a uma agência particular.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 1,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "575b18e9-de6f-5a5a-99f1-3607b20c89ec"
    },
    {
      "id": "71b2ea8c-c74f-5c53-80c3-9db1d6a60f9f",
      "notes": "Acervo do titular: Educação.pdf, p.1, 2025-06-25; recorte: Colégios (Fundamental/Médio). Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "market_overview",
      "priority": 2,
      "is_active": true,
      "item_text": "O quadro reúne educação básica e diferenças entre escolas, sem separar artificialmente cada etapa em nicho.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 1,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "05d666b4-ad53-53fc-bbaf-87ddab20269f"
    },
    {
      "id": "73a8602e-657d-54bb-bd6a-41be7dac1630",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Depilação a Laser. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "digital_maturity",
      "priority": 2,
      "is_active": true,
      "item_text": "A pesquisa de 2025 cita campanhas e captação digital para esse serviço.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 5,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "41b7e4f9-ed34-50f4-b208-e83a9204a1e2"
    },
    {
      "id": "74109068-e74f-5e30-bbf4-77d19d0bbe0a",
      "notes": "Fontes aproveitadas: Serviços Profissionais Consultoria.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida.",
      "item_key": "evidence_limitations",
      "priority": 3,
      "is_active": true,
      "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 4,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "3c675b4d-43d4-52da-a2dc-eba41130917d"
    },
    {
      "id": "75b4325a-6867-56f0-bcb1-112a4fb1a5aa",
      "notes": "Acervo do titular: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; recorte: Escritórios de Investimento. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "digital_maturity",
      "priority": 2,
      "is_active": true,
      "item_text": "A pesquisa histórica cita educação, conteúdo e relacionamento digital.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 2,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "a438c7b8-abbd-5df4-ac1c-0e00308ac29f"
    },
    {
      "id": "76495d97-fb4d-522a-a467-6c863c388165",
      "notes": "Fontes aproveitadas: Varejo e Comércio Local 1.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida.",
      "item_key": "evidence_limitations",
      "priority": 3,
      "is_active": true,
      "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 4,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "0a8d7814-ed9b-5a9f-babd-5be9142a1c62"
    },
    {
      "id": "7908a332-adce-5c19-9b4b-f896c3c4ccf7",
      "notes": "Acervo do titular: Educação.pdf, p.1, 2025-06-25; recorte: Cursinhos (Vestibular/Concurso). Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "market_overview",
      "priority": 2,
      "is_active": true,
      "item_text": "O material descreve captação ligada a ciclos de exames e concursos, sem validar demanda atual.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 1,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "1e07f094-a81f-530d-a4fc-5a39a357c6dc"
    },
    {
      "id": "79957af5-74cc-5853-8e97-a3e31c6dba9a",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Salão de Beleza. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "communication_opportunity",
      "priority": 2,
      "is_active": true,
      "item_text": "Mostrar serviços, agenda e trabalhos com autorização; personalização e experiência dependem da operação real.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 3,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "f959b397-71a7-5196-ac68-603f6ae44d05"
    },
    {
      "id": "79b49315-66ab-51dc-b784-623cb4a0cddd",
      "notes": "Fontes aproveitadas: Educação.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida.",
      "item_key": "evidence_limitations",
      "priority": 3,
      "is_active": true,
      "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 4,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "04ba8fb4-f897-5d96-bb4c-15af859a13f8"
    },
    {
      "id": "7a673962-8245-586a-9d34-a662c923f4c7",
      "notes": "Acervo do titular: Educação.pdf, p.1, 2025-06-25; recorte: Escolas de Natação. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "digital_maturity",
      "priority": 2,
      "is_active": true,
      "item_text": "O material de 2025 sugere digitalização inicial em parte das escolas.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 2,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "04ba8fb4-f897-5d96-bb4c-15af859a13f8"
    },
    {
      "id": "7ac1579f-f905-520a-a35d-c07f4adfc453",
      "notes": "Fontes aproveitadas: Serviços Profissionais Consultoria.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida.",
      "item_key": "evidence_limitations",
      "priority": 3,
      "is_active": true,
      "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 4,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "39c4cb19-e78f-508d-a78e-88ec8352af47"
    },
    {
      "id": "7adef79d-ab90-5afb-8e77-8a4abec63f13",
      "notes": "Acervo do titular: Veículos e Transportes.pdf, p.1, 2025-06-26; recorte: Lojas de pneus. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "communication_opportunity",
      "priority": 2,
      "is_active": true,
      "item_text": "Facilitar busca por especificação e orçamento; compatibilidade, instalação e estoque precisam de verificação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 3,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "be721a6d-b5c1-5087-a221-cebd855380a3"
    },
    {
      "id": "7b02351b-ffa2-5500-8deb-f8bdafa00103",
      "notes": "Acervo do titular: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; recorte: Escritórios de Investimento. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "market_overview",
      "priority": 2,
      "is_active": true,
      "item_text": "O acervo trata de assessoria de investimentos e relacionamento; não valida crescimento, comissões ou retorno.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 1,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "a438c7b8-abbd-5df4-ac1c-0e00308ac29f"
    },
    {
      "id": "7cab6fa4-48a8-5b19-ba39-d47a7696c799",
      "notes": "Acervo do titular: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; recorte: Restaurantes/Bares. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "communication_opportunity",
      "priority": 2,
      "is_active": true,
      "item_text": "Explorar informação clara de cardápio, horários, localização e canais de pedido; diferenciação por experiência ou atendimento só quando confirmada.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 3,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "2abf9c49-a1ca-5def-8a5e-552739f51eb5"
    },
    {
      "id": "7d65c29f-0039-54e0-99b8-33f94f268516",
      "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Bateria de Carro. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "communication_opportunity",
      "priority": 2,
      "is_active": true,
      "item_text": "Facilitar localização e consulta de compatibilidade; estoque, instalação e urgência só com confirmação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 3,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "c0b7e6ce-81be-534d-94ff-487dfe9e5b96"
    },
    {
      "id": "7da3bfbc-ab4c-52d9-bdcd-8fc7e454a0a6",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Hospitais. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "communication_opportunity",
      "priority": 2,
      "is_active": true,
      "item_text": "Esclarecer serviços e acesso confirmados; acreditação, equipe e diferenciais clínicos exigem prova.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 3,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "106aab43-8724-516f-8ef4-7513d564eb5f"
    },
    {
      "id": "7dabd762-0640-5ac0-bed5-94c4da8ccfca",
      "notes": "Fontes aproveitadas: Alimentação e Gastronomia.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida.",
      "item_key": "evidence_limitations",
      "priority": 3,
      "is_active": true,
      "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 4,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "28266a9f-faf0-583f-bac7-ee7fdb9fc79a"
    },
    {
      "id": "804b07b8-66a3-5763-b0b8-326a7895f323",
      "notes": "Fontes aproveitadas: Varejo e Comércio Local 2.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida.",
      "item_key": "evidence_limitations",
      "priority": 3,
      "is_active": true,
      "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 4,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "f19a300b-6d9d-5ecd-8cab-6f890d10d413"
    },
    {
      "id": "8165cc17-9ca9-57a0-b67b-c2fbe085bd0b",
      "notes": "Acervo do titular: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; recorte: Móveis Planejados. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "market_overview",
      "priority": 2,
      "is_active": true,
      "item_text": "A análise trata de projetos sob medida e decisão de compra com orçamento, sem validar rentabilidade.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 1,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "6fdb3f17-1fb2-5759-948c-09966870e3e8"
    },
    {
      "id": "8246cbee-8e7e-5b36-8e14-fd5475b8330a",
      "notes": "Acervo do titular: Educação.pdf, p.1, 2025-06-25; recorte: Escolas de Natação. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "market_overview",
      "priority": 2,
      "is_active": true,
      "item_text": "A pesquisa aborda ensino de natação com alcance local, sem comprovar escassez atual de concorrentes.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 1,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "04ba8fb4-f897-5d96-bb4c-15af859a13f8"
    },
    {
      "id": "825e2ea0-4af9-5f23-9c02-a7c9373daa74",
      "notes": "Acervo do titular: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; recorte: Móveis Planejados. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "communication_opportunity",
      "priority": 2,
      "is_active": true,
      "item_text": "Mostrar projetos autorizados e etapas reais do orçamento; personalização, prazo e garantia só se comprovados.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 3,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "6fdb3f17-1fb2-5759-948c-09966870e3e8"
    },
    {
      "id": "82bd24ff-c163-5e00-9e57-2dfebbdcc946",
      "notes": "Acervo do titular: Educação.pdf, p.1, 2025-06-25; recorte: Escolas de Idiomas. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "market_overview",
      "priority": 2,
      "is_active": true,
      "item_text": "O acervo trata de aprendizagem de idiomas e concorrência entre escolas e franquias.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 1,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "2518abd5-c761-50d2-b29a-cf12f3a4b29e"
    },
    {
      "id": "84fe203e-03dd-547a-bbb4-24b0098714b1",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Clínica de Estética. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "communication_opportunity",
      "priority": 2,
      "is_active": true,
      "item_text": "Apresentar procedimentos e atendimento efetivamente disponíveis; não prometer resultado ou atribuir credenciais não verificadas.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 3,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "41b7e4f9-ed34-50f4-b208-e83a9204a1e2"
    },
    {
      "id": "85098785-b1e2-5c28-99be-396f299c12ce",
      "notes": "Fontes aproveitadas: Alimentação e Gastronomia.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida.",
      "item_key": "evidence_limitations",
      "priority": 3,
      "is_active": true,
      "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 4,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "2abf9c49-a1ca-5def-8a5e-552739f51eb5"
    },
    {
      "id": "85b09c2f-ec3d-5ab5-a639-e78ce2170174",
      "notes": "Acervo do titular: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; recorte: Supermercados. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "communication_opportunity",
      "priority": 2,
      "is_active": true,
      "item_text": "Apresentar ofertas vigentes, localização e opções reais de compra; conveniência e entrega são possibilidades condicionais.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 3,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "d3254254-c82c-5732-9ed1-dd66270b8a20"
    },
    {
      "id": "86eebe16-b6a1-563a-b217-8181ad5a8d41",
      "notes": "Fontes aproveitadas: Veículos e Transportes.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida.",
      "item_key": "evidence_limitations",
      "priority": 3,
      "is_active": true,
      "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 4,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "be721a6d-b5c1-5087-a221-cebd855380a3"
    },
    {
      "id": "86f50cfa-9cc0-5161-8b3c-b900481c294d",
      "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Cama, Mesa e Banho. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "communication_opportunity",
      "priority": 2,
      "is_active": true,
      "item_text": "Apresentar composição, medidas e linhas reais; qualidade superior e procedência exigem comprovação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 3,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "6b17c125-7bdb-5415-996b-185af1d5e22c"
    },
    {
      "id": "88f98569-18c8-5359-a710-364c84e38785",
      "notes": "Acervo do titular: Educação.pdf, p.1, 2025-06-25; recorte: Escolas de Idiomas. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "digital_maturity",
      "priority": 2,
      "is_active": true,
      "item_text": "O quadro histórico cita investimento em divulgação digital por parte das redes.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 2,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "2518abd5-c761-50d2-b29a-cf12f3a4b29e"
    },
    {
      "id": "890e4ac6-b343-5d61-bcd6-169a4f1d3609",
      "notes": "Fontes aproveitadas: Saúde e Bem-estar.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida.",
      "item_key": "evidence_limitations",
      "priority": 3,
      "is_active": true,
      "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 4,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "63e12d86-2f4f-5ff7-ace8-8c2a8b98f676"
    },
    {
      "id": "891c4cc5-fb32-52e1-b01d-3db5d7d26f53",
      "notes": "Fontes aproveitadas: Alimentação e Gastronomia.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida.",
      "item_key": "evidence_limitations",
      "priority": 3,
      "is_active": true,
      "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 4,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "a2409fde-422d-52d3-83e6-71f9a1dc4604"
    },
    {
      "id": "89600a82-2adb-5e6e-92ab-d7307e8f0849",
      "notes": "Fontes aproveitadas: Varejo e Comércio Local 2.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida.",
      "item_key": "evidence_limitations",
      "priority": 3,
      "is_active": true,
      "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 4,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "c0b7e6ce-81be-534d-94ff-487dfe9e5b96"
    },
    {
      "id": "8972dd13-b892-53ce-976f-edae5fa2993b",
      "notes": "Acervo do titular: Imobiliário Construção.pdf, p.1, 2025-06-26; recorte: Empresas de Engenharia. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "market_overview",
      "priority": 2,
      "is_active": true,
      "item_text": "A análise descreve serviços técnicos e contratos entre empresas, sem sustentar margens ou quantidade atual de prestadores.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 1,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "c1c9a4b6-60ca-511e-a343-a7f028d93c1f"
    },
    {
      "id": "8bf00175-960c-5751-8a4f-7366a999bb89",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Fisioterapia. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "digital_maturity",
      "priority": 2,
      "is_active": true,
      "item_text": "A leitura histórica cita indicação, parcerias e conteúdo informativo.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 2,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "68aea8e0-d763-5597-850e-f294df298fd8"
    },
    {
      "id": "8d8e268a-1808-5d5a-a242-96d080eea6b1",
      "notes": "Fontes aproveitadas: Fitnes e Esportes.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida.",
      "item_key": "evidence_limitations",
      "priority": 3,
      "is_active": true,
      "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 4,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "4247708e-6cb0-5be0-bbac-77d36eb3ec37"
    },
    {
      "id": "8da0c046-94e2-5d65-9893-dbb897ba6aa8",
      "notes": "Fontes aproveitadas: Imobiliário Construção.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida.",
      "item_key": "evidence_limitations",
      "priority": 3,
      "is_active": true,
      "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 4,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "902d26ac-62c0-5b9c-b4e8-e5915fc64566"
    },
    {
      "id": "8eff368e-64bb-5108-ae4a-f55eeaeb76d6",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Depilação a Laser. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "market_overview",
      "priority": 2,
      "is_active": true,
      "item_text": "O material analisa um procedimento como especialização de clínica estética, sem criar categoria de oferta.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 4,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "41b7e4f9-ed34-50f4-b208-e83a9204a1e2"
    },
    {
      "id": "91fde768-6815-5be4-804d-e0f3d73be3de",
      "notes": "Acervo do titular: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; recorte: Supermercados. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "digital_maturity",
      "priority": 2,
      "is_active": true,
      "item_text": "A leitura histórica sugere maturidade desigual, com redes sociais e entrega em parte das operações.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 2,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "d3254254-c82c-5732-9ed1-dd66270b8a20"
    },
    {
      "id": "92d52236-3a82-5068-991a-e17e41d7c7d6",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Clínica de Estética. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "digital_maturity",
      "priority": 2,
      "is_active": true,
      "item_text": "O quadro de 2025 cita divulgação visual e redes sociais.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 2,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "41b7e4f9-ed34-50f4-b208-e83a9204a1e2"
    },
    {
      "id": "9408d795-fabf-581d-bfa9-abc24ee231d4",
      "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Óticas. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "communication_opportunity",
      "priority": 2,
      "is_active": true,
      "item_text": "Explicar opções e atendimento verificáveis; não inferir diagnóstico, condição clínica ou eficácia individual.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 3,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "997272c5-ec44-5398-82d9-1cf7f2cc8d80"
    },
    {
      "id": "95399b11-c468-5984-a808-529c795299c0",
      "notes": "Acervo do titular: Imobiliário Construção.pdf, p.1, 2025-06-26; recorte: Material de Construção (Indústria). Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "digital_maturity",
      "priority": 2,
      "is_active": true,
      "item_text": "A pesquisa histórica cita comunicação institucional e técnica entre empresas.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 2,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "b48f71c3-50a1-57f5-8661-b3239735fde1"
    },
    {
      "id": "977f35da-8346-5643-b47f-64f2feb3db3e",
      "notes": "Acervo do titular: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; recorte: Pet Shops. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "communication_opportunity",
      "priority": 2,
      "is_active": true,
      "item_text": "Organizar produtos e serviços reais; conveniência e fidelização são possibilidades, sem inferir cuidados veterinários.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 3,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "3ce5e2fc-4531-5035-8eec-c98571997872"
    },
    {
      "id": "97ffbe68-cc7c-5fc0-8d2c-7010abb572dc",
      "notes": "Fontes aproveitadas: Varejo e Comércio Local 2.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida.",
      "item_key": "evidence_limitations",
      "priority": 3,
      "is_active": true,
      "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 4,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "6b17c125-7bdb-5415-996b-185af1d5e22c"
    },
    {
      "id": "98d48695-a648-518e-8d94-bfe6ac461b9c",
      "notes": "Acervo do titular: Veículos e Transportes.pdf, p.1, 2025-06-26; recorte: Lojas de pneus. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "market_overview",
      "priority": 2,
      "is_active": true,
      "item_text": "A análise cobre comércio de pneus; o valor original de um jogo com unidade monetária inconsistente foi omitido, assim como os demais indicadores sem fonte rastreável.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 1,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "be721a6d-b5c1-5087-a221-cebd855380a3"
    },
    {
      "id": "9916cd34-0b6a-514f-a378-bbcf5a4a034f",
      "notes": "Acervo do titular: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; recorte: Contadores. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "digital_maturity",
      "priority": 2,
      "is_active": true,
      "item_text": "O acervo de 2025 cita uso de redes e mensagens com profissionalização desigual.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 2,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "39c4cb19-e78f-508d-a78e-88ec8352af47"
    },
    {
      "id": "9a8e51d9-5592-5662-ac65-4559bdfe688c",
      "notes": "Acervo do titular: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; recorte: Cafeterias. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "communication_opportunity",
      "priority": 2,
      "is_active": true,
      "item_text": "Explorar ambiente, cardápio e ocasião de visita confirmados; qualidade especial ou experiência diferenciada exige evidência do negócio.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 3,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "e26e900b-8fe5-5ec8-b62a-6e0986a887bf"
    },
    {
      "id": "9d9ba7f3-fe56-556a-a1aa-de344b05bfa3",
      "notes": "Acervo do titular: Educação.pdf, p.1, 2025-06-25; recorte: Escolas de Música. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "digital_maturity",
      "priority": 2,
      "is_active": true,
      "item_text": "O acervo descreve exploração parcial do digital em 2025.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 2,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "03e6c2a3-493b-5601-bf29-db4c8c97bf21"
    },
    {
      "id": "9e04fcfc-b560-512d-8012-f17728bed287",
      "notes": "Acervo do titular: Imobiliário Construção.pdf, p.1, 2025-06-26; recorte: Energia Solar. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "digital_maturity",
      "priority": 2,
      "is_active": true,
      "item_text": "O acervo de 2025 menciona busca, conteúdo e geração de contatos em canais digitais.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 2,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "902d26ac-62c0-5b9c-b4e8-e5915fc64566"
    },
    {
      "id": "9f71cca0-9866-599f-a4c1-c5d7a268657c",
      "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Loja de Informática. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "market_overview",
      "priority": 2,
      "is_active": true,
      "item_text": "O quadro descreve comércio de informática sem comprovar ticket, margens ou estabilidade atuais.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 1,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "33cbabb9-1844-50da-b1a3-47d554182249"
    },
    {
      "id": "a00dc417-6e1e-5c25-a452-4a81ba159fb3",
      "notes": "Acervo do titular: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; recorte: Confeitarias. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "communication_opportunity",
      "priority": 2,
      "is_active": true,
      "item_text": "Organizar catálogo e pedidos por ocasião; personalização, prazo e provas visuais dependem de capacidade e autorização reais.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 3,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "28266a9f-faf0-583f-bac7-ee7fdb9fc79a"
    },
    {
      "id": "a0b599e2-fe49-5f31-8546-8a960b337546",
      "notes": "Fontes aproveitadas: Imobiliário Construção.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida.",
      "item_key": "evidence_limitations",
      "priority": 3,
      "is_active": true,
      "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 4,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "1faa0522-effd-52bb-80de-8967130856f9"
    },
    {
      "id": "a26b4925-f602-5fe7-ab31-fe2dd09b5dc6",
      "notes": "Acervo do titular: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; recorte: Escritórios de Investimento. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "communication_opportunity",
      "priority": 2,
      "is_active": true,
      "item_text": "Explicar serviço e público atendido com confirmação; não oferecer recomendação financeira ou prometer rentabilidade.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 3,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "a438c7b8-abbd-5df4-ac1c-0e00308ac29f"
    },
    {
      "id": "a3119aca-e185-5cf4-8ed4-21b757519efe",
      "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Loja de Colchão. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "digital_maturity",
      "priority": 2,
      "is_active": true,
      "item_text": "O quadro histórico associa canais digitais à geração de interessados.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 2,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "cfa009ea-1284-52fb-bf51-124737060a6d"
    },
    {
      "id": "a37b4e89-22e0-5682-a8de-0419805e9a12",
      "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Aluguel de Roupas. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "market_overview",
      "priority": 2,
      "is_active": true,
      "item_text": "A análise trata de locação com sazonalidade e ocasiões, sem criar categoria por gênero ou evento.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 1,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "f893c55c-9d56-5079-badc-0e0f9bb7ea4f"
    },
    {
      "id": "a3bd497a-c4e6-51c2-b553-8eb13543bd41",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Nutricionistas. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "market_overview",
      "priority": 2,
      "is_active": true,
      "item_text": "O material relaciona nutrição a acompanhamento, saúde preventiva e fitness; não comprova demanda atual.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 1,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "16a2416c-d5c9-5356-983b-f354ce2eca08"
    },
    {
      "id": "a3c4f5a7-4e88-5bb8-9b45-c2038a86a667",
      "notes": "Fontes aproveitadas: Saúde e Bem-estar.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida.",
      "item_key": "evidence_limitations",
      "priority": 3,
      "is_active": true,
      "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 4,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "342a642b-8fd5-5d14-a68f-ae15ad108b4a"
    },
    {
      "id": "a474a4d4-660e-5d49-a48f-cc7d81338488",
      "notes": "Fontes aproveitadas: Alimentação e Gastronomia.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida.",
      "item_key": "evidence_limitations",
      "priority": 3,
      "is_active": true,
      "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 4,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "e26e900b-8fe5-5ec8-b62a-6e0986a887bf"
    },
    {
      "id": "a6b8ccd0-aab2-531a-bf64-39a03d695ad3",
      "notes": "Acervo do titular: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; recorte: Lojas de Roupa. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "communication_opportunity",
      "priority": 2,
      "is_active": true,
      "item_text": "Apresentar coleção e disponibilidade reais; estilo, atendimento e integração de canais são possibilidades condicionais.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 3,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "85d331a2-c4ff-51fa-9a4e-26b99e724824"
    },
    {
      "id": "a8398363-fca7-5b3f-97fc-c0f21acd43b4",
      "notes": "Acervo do titular: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; recorte: Padarias. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "communication_opportunity",
      "priority": 2,
      "is_active": true,
      "item_text": "Comunicar mix real, horários e conveniência local; destacar encomendas ou produção própria somente se o negócio confirmar.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 3,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "a2409fde-422d-52d3-83e6-71f9a1dc4604"
    },
    {
      "id": "a913676b-72e6-5439-826c-e3171e403ce4",
      "notes": "Fontes aproveitadas: Educação.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida.",
      "item_key": "evidence_limitations",
      "priority": 3,
      "is_active": true,
      "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 4,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "2518abd5-c761-50d2-b29a-cf12f3a4b29e"
    },
    {
      "id": "a931b530-f0cf-5c95-a7f3-4be4cc41fca3",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Salão de Beleza. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "digital_maturity",
      "priority": 2,
      "is_active": true,
      "item_text": "A pesquisa de 2025 cita portfólio em redes e relacionamento por mensagens.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 2,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "f959b397-71a7-5196-ac68-603f6ae44d05"
    },
    {
      "id": "aa0f97bf-d4b3-5687-81fc-975316b1f1e0",
      "notes": "Acervo do titular: Educação.pdf, p.1, 2025-06-25; recorte: Escolas de Natação. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "communication_opportunity",
      "priority": 2,
      "is_active": true,
      "item_text": "Esclarecer turmas, faixas atendidas e agendamento; estrutura, segurança e qualificação só com informação confirmada.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 3,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "04ba8fb4-f897-5d96-bb4c-15af859a13f8"
    },
    {
      "id": "aaede3a6-3954-57d9-8a4c-a461c1d15625",
      "notes": "Acervo do titular: Imobiliário Construção.pdf, p.1, 2025-06-26; recorte: Empresas de Engenharia. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "communication_opportunity",
      "priority": 2,
      "is_active": true,
      "item_text": "Explicar escopo técnico e evidências de projetos autorizadas; certificações, responsabilidade técnica e capacidade não são presumidas.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 3,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "c1c9a4b6-60ca-511e-a343-a7f028d93c1f"
    },
    {
      "id": "abb26317-5464-5d3d-a724-4628e3dfa276",
      "notes": "Acervo do titular: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; recorte: Lojas de Móveis. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "communication_opportunity",
      "priority": 2,
      "is_active": true,
      "item_text": "Organizar produtos e medidas verificadas; entrega, montagem e estoque dependem de confirmação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 3,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "095dab3e-8153-5d04-8b60-ddf2a901e195"
    },
    {
      "id": "ae16fe84-5319-58b5-bf8c-267ce4edcc2f",
      "notes": "Acervo do titular: Fitnes e Esportes.pdf, p.1, 2025-06-26; recorte: Boxes de CrossFit. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "communication_opportunity",
      "priority": 2,
      "is_active": true,
      "item_text": "Mostrar estrutura e acompanhamento confirmados; preservar uso correto de marcas e não prometer desempenho individual.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 3,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "4247708e-6cb0-5be0-bbac-77d36eb3ec37"
    },
    {
      "id": "ae7d49a1-8d3b-555f-bcf5-010037d841c0",
      "notes": "Fontes aproveitadas: Veículos e Transportes.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida.",
      "item_key": "evidence_limitations",
      "priority": 3,
      "is_active": true,
      "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 4,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "c2f09d80-1f32-546b-a6ff-a1e4091cee1d"
    },
    {
      "id": "af371107-844e-5ba3-a5eb-3435bb3043af",
      "notes": "Acervo do titular: Veículos e Transportes.pdf, p.1, 2025-06-26; recorte: Lojas de pneus. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "digital_maturity",
      "priority": 2,
      "is_active": true,
      "item_text": "A pesquisa histórica diferencia grandes canais online e divulgação local de pequenas lojas.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 2,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "be721a6d-b5c1-5087-a221-cebd855380a3"
    },
    {
      "id": "b0724fb5-d94d-562a-9b6c-f5911ae94203",
      "notes": "Acervo do titular: Veículos e Transportes.pdf, p.1, 2025-06-26; recorte: Oficinas mecânicas. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "market_overview",
      "priority": 2,
      "is_active": true,
      "item_text": "O material trata de manutenção automotiva e recorrência, sem validar quantidade ou margens atuais.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 1,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "de373e04-827e-5c85-82ea-f4e7009cb97e"
    },
    {
      "id": "b171c9eb-c897-505d-880f-d5564f41854f",
      "notes": "Acervo do titular: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; recorte: Restaurantes/Bares. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "market_overview",
      "priority": 2,
      "is_active": true,
      "item_text": "O acervo descreve concorrência por movimento local, consumo no estabelecimento e entregas, com necessidade de recorrência.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 1,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "2abf9c49-a1ca-5def-8a5e-552739f51eb5"
    },
    {
      "id": "b27a059a-2fa2-50e7-b0b8-c7dc15bc1046",
      "notes": "Fontes aproveitadas: Imobiliário Construção.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida.",
      "item_key": "evidence_limitations",
      "priority": 3,
      "is_active": true,
      "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 4,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "b48f71c3-50a1-57f5-8661-b3239735fde1"
    },
    {
      "id": "b39898b6-c834-54dd-9319-c5750ac13eaf",
      "notes": "Fontes aproveitadas: Serviços Profissionais Consultoria.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida.",
      "item_key": "evidence_limitations",
      "priority": 3,
      "is_active": true,
      "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 4,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "a438c7b8-abbd-5df4-ac1c-0e00308ac29f"
    },
    {
      "id": "b4dfb87b-ccbf-5cba-9e32-de3eaa4a3767",
      "notes": "Fontes aproveitadas: Saúde e Bem-estar.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida.",
      "item_key": "evidence_limitations",
      "priority": 3,
      "is_active": true,
      "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 7,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "41b7e4f9-ed34-50f4-b208-e83a9204a1e2"
    },
    {
      "id": "b718e3a2-268e-50e9-8fee-80224d460423",
      "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Loja de Informática. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "communication_opportunity",
      "priority": 2,
      "is_active": true,
      "item_text": "Facilitar comparação e orçamento de itens reais; suporte ou manutenção só quando confirmados.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 3,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "33cbabb9-1844-50da-b1a3-47d554182249"
    },
    {
      "id": "b9ca4acd-d2f8-5a4f-8830-19aafb355842",
      "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Loja de Colchão. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "market_overview",
      "priority": 2,
      "is_active": true,
      "item_text": "O material descreve compra de maior consideração, sem validar ticket ou retorno de anúncios.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 1,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "cfa009ea-1284-52fb-bf51-124737060a6d"
    },
    {
      "id": "ba14f325-72e7-52b8-9834-336289b2497b",
      "notes": "Acervo do titular: Hotelaria e Turismo.pdf, p.1, 2025-06-26; recorte: Motéis (Motelaria). Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "market_overview",
      "priority": 2,
      "is_active": true,
      "item_text": "O material aborda hospedagem de curta permanência e reposicionamento de imagem, sem validar crescimento ou orçamento atual.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 1,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "1034feee-11ae-5479-ad86-1b91d9571916"
    },
    {
      "id": "ba2dbaec-bee3-54c1-955a-0e58e11de1a2",
      "notes": "Fontes aproveitadas: Imobiliário Construção.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida.",
      "item_key": "evidence_limitations",
      "priority": 3,
      "is_active": true,
      "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 4,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "c530d2ac-d0f5-5644-9126-8e4df34f0521"
    },
    {
      "id": "bfae781b-0c21-5949-b10f-feb70d56fc9f",
      "notes": "Fontes aproveitadas: Serviços Profissionais Consultoria.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida.",
      "item_key": "evidence_limitations",
      "priority": 3,
      "is_active": true,
      "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 4,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "f77ed02c-86e8-5f5b-afc6-d1a1188febb4"
    },
    {
      "id": "c1264783-a6d5-5b94-8525-079428375c8f",
      "notes": "Acervo do titular: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; recorte: Lojas de Roupa. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "digital_maturity",
      "priority": 2,
      "is_active": true,
      "item_text": "A pesquisa histórica enfatiza presença visual em redes.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 2,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "85d331a2-c4ff-51fa-9a4e-26b99e724824"
    },
    {
      "id": "c18de1b6-90a6-55e5-967d-5c475b39d238",
      "notes": "Fontes aproveitadas: Saúde e Bem-estar.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida.",
      "item_key": "evidence_limitations",
      "priority": 3,
      "is_active": true,
      "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 4,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "840bc8f9-a341-53c7-8ce8-c31fa516b9fc"
    },
    {
      "id": "c22319ac-0edd-5508-9861-13c23faca9cd",
      "notes": "Acervo do titular: Educação.pdf, p.1, 2025-06-25; recorte: Cursinhos (Vestibular/Concurso). Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "communication_opportunity",
      "priority": 2,
      "is_active": true,
      "item_text": "Explicar calendário e preparação oferecida; aprovações, índices ou garantias só com prova específica e autorização.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 3,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "1e07f094-a81f-530d-a4fc-5a39a357c6dc"
    },
    {
      "id": "c25c591a-1e54-5e78-96d8-f7f3db254f29",
      "notes": "Acervo do titular: Imobiliário Construção.pdf, p.1, 2025-06-26; recorte: Lojas de Material (Varejo). Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "market_overview",
      "priority": 2,
      "is_active": true,
      "item_text": "O quadro trata do varejo para obras e reformas, distinto de fabricação de materiais.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 1,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "c530d2ac-d0f5-5644-9126-8e4df34f0521"
    },
    {
      "id": "c40d4a9c-73f7-5eb4-a8a2-0303a737469d",
      "notes": "Acervo do titular: Fitnes e Esportes.pdf, p.1, 2025-06-26; recorte: Boxes de CrossFit. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "market_overview",
      "priority": 2,
      "is_active": true,
      "item_text": "O acervo relaciona treino e comunidade a recorrência; números de boxes e margens não foram validados.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 1,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "4247708e-6cb0-5be0-bbac-77d36eb3ec37"
    },
    {
      "id": "c4708b98-5166-547b-858f-a70ca5b1eeb7",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Harmonização Facial. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "market_overview",
      "priority": 2,
      "is_active": true,
      "item_text": "A pesquisa cobre harmonização facial e procedimentos contextuais; preservada a categoria existente.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 1,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "4b304c4e-01a8-51dc-b0dd-8fa2f5ca2d41"
    },
    {
      "id": "c88d6c11-ac04-5df5-a599-3c3052ef31ca",
      "notes": "Fontes aproveitadas: Veículos e Transportes.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida.",
      "item_key": "evidence_limitations",
      "priority": 3,
      "is_active": true,
      "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 4,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "d45cc27f-701b-54bc-aaa4-6de93152dfb9"
    },
    {
      "id": "c9a5c432-6d12-551e-985b-a4a844af5fcf",
      "notes": "Acervo do titular: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; recorte: Restaurantes/Bares. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "digital_maturity",
      "priority": 2,
      "is_active": true,
      "item_text": "A pesquisa de 2025 cita redes sociais, aplicativos de entrega e fidelização; a intensidade de uso não foi aferida agora.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 2,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "2abf9c49-a1ca-5def-8a5e-552739f51eb5"
    },
    {
      "id": "cb5bda02-187a-54a9-a974-f2fef245b4d3",
      "notes": "Acervo do titular: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; recorte: Maquiagem/Perfumaria. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "digital_maturity",
      "priority": 2,
      "is_active": true,
      "item_text": "O material de 2025 cita conteúdo visual e integração de vendas físicas e online.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 2,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "cfa04ae3-d989-5a72-a155-84d4f96f9fb0"
    },
    {
      "id": "cdba7b91-3d42-5cf7-8f36-e8e9616e950a",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Hospitais. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "digital_maturity",
      "priority": 2,
      "is_active": true,
      "item_text": "O acervo histórico cita comunicação institucional e agendamento em parte do setor.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 2,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "106aab43-8724-516f-8ef4-7513d564eb5f"
    },
    {
      "id": "cf1d4434-57e2-537d-950d-ae277df8ff45",
      "notes": "Acervo do titular: Imobiliário Construção.pdf, p.1, 2025-06-26; recorte: Construtoras/Incorporadoras. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "communication_opportunity",
      "priority": 2,
      "is_active": true,
      "item_text": "Organizar informação verificável sobre projetos, etapas e canais de atendimento; prazos, financiamento e entrega não podem ser inferidos.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 3,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "66abf9c2-3920-5f7d-ac9e-9a686342858f"
    },
    {
      "id": "cf95388a-4d54-5bf3-b7bd-6af753cedb95",
      "notes": "Acervo do titular: Fitnes e Esportes.pdf, p.1, 2025-06-26; recorte: Academias de Artes Marciais. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "digital_maturity",
      "priority": 2,
      "is_active": true,
      "item_text": "O material descreve indicação e conteúdo comunitário como caminhos de divulgação de 2025.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 2,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "c593f1ec-5f4f-531f-9070-80b4441eef28"
    },
    {
      "id": "cfe1e4b7-eb78-5a9b-be34-9c28c8827d21",
      "notes": "Fontes aproveitadas: Educação.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida.",
      "item_key": "evidence_limitations",
      "priority": 3,
      "is_active": true,
      "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 4,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "1e07f094-a81f-530d-a4fc-5a39a357c6dc"
    },
    {
      "id": "d07adc34-fe53-548c-9691-d41b963eaba9",
      "notes": "Fontes aproveitadas: Imobiliário Construção.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida.",
      "item_key": "evidence_limitations",
      "priority": 3,
      "is_active": true,
      "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 4,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "c1c9a4b6-60ca-511e-a343-a7f028d93c1f"
    },
    {
      "id": "d21a31d7-c80e-5d66-b05e-da3b5f6a6654",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Clínicas Médicas. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "market_overview",
      "priority": 2,
      "is_active": true,
      "item_text": "O quadro distingue modelos de clínicas e atendimento coletivo, sem igualar clínica a consultório individual.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 1,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "d5c0e5ab-875f-52c8-afb4-a0facb0b2a48"
    },
    {
      "id": "d2bf5428-7b73-5dbd-a81e-aba9572278b2",
      "notes": "Acervo do titular: Veículos e Transportes.pdf, p.1, 2025-06-26; recorte: Concessionárias de lanchas. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "digital_maturity",
      "priority": 2,
      "is_active": true,
      "item_text": "A leitura de 2025 cita sites especializados, eventos e divulgação segmentada.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 2,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "c2f09d80-1f32-546b-a6ff-a1e4091cee1d"
    },
    {
      "id": "d43c27d9-3134-557e-98d4-9e9e6ac308b7",
      "notes": "Acervo do titular: Imobiliário Construção.pdf, p.1, 2025-06-26; recorte: Lojas de Material (Varejo). Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "communication_opportunity",
      "priority": 2,
      "is_active": true,
      "item_text": "Facilitar consulta de produtos e orçamento; estoque, entrega e atendimento técnico somente quando confirmados.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 3,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "c530d2ac-d0f5-5644-9126-8e4df34f0521"
    },
    {
      "id": "d55f47bc-1508-5c10-b519-bb36bd555fbf",
      "notes": "Acervo do titular: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; recorte: Lojas de Iluminação. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "communication_opportunity",
      "priority": 2,
      "is_active": true,
      "item_text": "Explicar aplicações e especificações verificadas; consultoria técnica e projeto só quando realmente oferecidos.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 3,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "0a8d7814-ed9b-5a9f-babd-5be9142a1c62"
    },
    {
      "id": "d590e4c3-9543-5728-8ea2-e26497829019",
      "notes": "Acervo do titular: Veículos e Transportes.pdf, p.1, 2025-06-26; recorte: Concessionárias de carros. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "communication_opportunity",
      "priority": 2,
      "is_active": true,
      "item_text": "Organizar veículos e contato; estoque, financiamento e condição de venda não podem ser presumidos.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 3,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "0de38fe8-16ad-575f-8508-bdbb6bf50076"
    },
    {
      "id": "d8719718-c92d-51ca-abfe-699ca2595d54",
      "notes": "Acervo do titular: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; recorte: Lojas de Móveis. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "market_overview",
      "priority": 2,
      "is_active": true,
      "item_text": "O material cobre móveis de varejo, distinto do projeto sob medida.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 1,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "095dab3e-8153-5d04-8b60-ddf2a901e195"
    },
    {
      "id": "d90856fb-62aa-52f9-9c51-92a9cdc87d01",
      "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Loja de Colchão. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "communication_opportunity",
      "priority": 2,
      "is_active": true,
      "item_text": "Esclarecer características verificadas e condições de compra; benefício de saúde e garantia não são presumidos.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 3,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "cfa009ea-1284-52fb-bf51-124737060a6d"
    },
    {
      "id": "dc476a50-63b9-5c67-b566-6134f4fccc6f",
      "notes": "Fontes aproveitadas: Serviços Profissionais Consultoria.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida.",
      "item_key": "evidence_limitations",
      "priority": 3,
      "is_active": true,
      "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 4,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "c043fb2c-c712-5425-898a-d77c4ae00008"
    },
    {
      "id": "de34caf0-437b-5f50-968d-4ce044e55d97",
      "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Bateria de Carro. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "digital_maturity",
      "priority": 2,
      "is_active": true,
      "item_text": "A observação histórica sugere adoção digital inicial ou intermediária.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 2,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "c0b7e6ce-81be-534d-94ff-487dfe9e5b96"
    },
    {
      "id": "df7c5ac7-1634-5374-a4ce-3fb670f19f14",
      "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Cama, Mesa e Banho. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "market_overview",
      "priority": 2,
      "is_active": true,
      "item_text": "O quadro trata de varejo de têxteis domésticos, sem validar crescimento ou rentabilidade.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 1,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "6b17c125-7bdb-5415-996b-185af1d5e22c"
    },
    {
      "id": "dfe01272-9435-5842-b07b-7a4f257c7b00",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Spa. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "market_overview",
      "priority": 2,
      "is_active": true,
      "item_text": "O acervo trata de experiência de bem-estar e serviços, sem validar tamanho ou crescimento de mercado.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 1,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "840bc8f9-a341-53c7-8ce8-c31fa516b9fc"
    },
    {
      "id": "e05c9adc-dee2-55dd-8a2a-56d6cb4d86a3",
      "notes": "Acervo do titular: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; recorte: Arquitetos. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "communication_opportunity",
      "priority": 2,
      "is_active": true,
      "item_text": "Organizar projetos e processo de atendimento comprovados; autoria, imagens e especialização dependem de autorização e prova.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 3,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "3c675b4d-43d4-52da-a2dc-eba41130917d"
    },
    {
      "id": "e1f7a14c-8b5b-514f-92bf-e06e731a4673",
      "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Utilidades do Lar. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "market_overview",
      "priority": 2,
      "is_active": true,
      "item_text": "O documento aborda comércio de utilidades domésticas e variedade, sem sustentar margens atuais.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 1,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "f19a300b-6d9d-5ecd-8cab-6f890d10d413"
    },
    {
      "id": "e8336bc1-539f-5844-bdb2-8582bbeb93af",
      "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Cama, Mesa e Banho. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "digital_maturity",
      "priority": 2,
      "is_active": true,
      "item_text": "O acervo de 2025 cita abertura desigual a canais digitais.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 2,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "6b17c125-7bdb-5415-996b-185af1d5e22c"
    },
    {
      "id": "e8713c60-5ce0-5955-aad3-254b4f90b9fb",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Odontologia. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "communication_opportunity",
      "priority": 2,
      "is_active": true,
      "item_text": "Facilitar informação e agendamento; imagens, resultados e qualificações requerem validação e autorização próprias.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 3,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "342a642b-8fd5-5d14-a68f-ae15ad108b4a"
    },
    {
      "id": "e90ab9b2-d3a5-55a6-a10b-22c728287e90",
      "notes": "Acervo do titular: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; recorte: Consultorias Empresariais. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "market_overview",
      "priority": 2,
      "is_active": true,
      "item_text": "A pesquisa aborda projetos de eficiência e gestão para empresas; indicadores e projeções permanecem não validados.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 1,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "c043fb2c-c712-5425-898a-d77c4ae00008"
    },
    {
      "id": "ea101734-b82a-5567-a1c0-3a565e851a4b",
      "notes": "Fontes aproveitadas: Varejo e Comércio Local 1.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida.",
      "item_key": "evidence_limitations",
      "priority": 3,
      "is_active": true,
      "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 4,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "3ce5e2fc-4531-5035-8eec-c98571997872"
    },
    {
      "id": "eb8deeed-a8f1-5121-96ca-8547ab0bd2a9",
      "notes": "Fontes aproveitadas: Saúde e Bem-estar.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida.",
      "item_key": "evidence_limitations",
      "priority": 3,
      "is_active": true,
      "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 4,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "4b304c4e-01a8-51dc-b0dd-8fa2f5ca2d41"
    },
    {
      "id": "ed0d73fa-81ae-5ee2-b031-bacf04672f3d",
      "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Óticas. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "market_overview",
      "priority": 2,
      "is_active": true,
      "item_text": "O material aborda varejo óptico e recorrência, sem validar crescimento ou desempenho atual.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 1,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "997272c5-ec44-5398-82d9-1cf7f2cc8d80"
    },
    {
      "id": "ed3816fc-bc6d-507a-b0ca-a536225f72de",
      "notes": "Acervo do titular: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; recorte: Confeitarias. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "market_overview",
      "priority": 2,
      "is_active": true,
      "item_text": "O acervo destaca encomendas e ocasiões de consumo como contextos da confeitaria.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 1,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "28266a9f-faf0-583f-bac7-ee7fdb9fc79a"
    },
    {
      "id": "ed3e06ca-6814-5584-b774-3416c7f76fde",
      "notes": "Acervo do titular: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; recorte: Maquiagem/Perfumaria. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "market_overview",
      "priority": 2,
      "is_active": true,
      "item_text": "A pesquisa trata de varejo de cosméticos e perfumes, sem validar indicadores atuais do setor.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 1,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "cfa04ae3-d989-5a72-a155-84d4f96f9fb0"
    },
    {
      "id": "ed85bc68-38e8-5dee-a623-e2f24a1c10b9",
      "notes": "Fontes aproveitadas: Varejo e Comércio Local 1.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida.",
      "item_key": "evidence_limitations",
      "priority": 3,
      "is_active": true,
      "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 4,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "095dab3e-8153-5d04-8b60-ddf2a901e195"
    },
    {
      "id": "ee6966f2-a177-55e3-b75e-081dd3b5a64d",
      "notes": "Acervo do titular: Educação.pdf, p.1, 2025-06-25; recorte: Colégios (Fundamental/Médio). Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "communication_opportunity",
      "priority": 2,
      "is_active": true,
      "item_text": "Apresentar etapas atendidas, proposta pedagógica e canais de visita confirmados; não inferir qualidade de uma escola.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 3,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "05d666b4-ad53-53fc-bbaf-87ddab20269f"
    },
    {
      "id": "ee8d9587-66cd-5da2-8925-9bfe75dc15f6",
      "notes": "Acervo do titular: Hotelaria e Turismo.pdf, p.1, 2025-06-26; recorte: Motéis (Motelaria). Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "communication_opportunity",
      "priority": 2,
      "is_active": true,
      "item_text": "Comunicar privacidade e características verificadas das suítes e condições de uso; não presumir serviço, público ou padrão.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 3,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "1034feee-11ae-5479-ad86-1b91d9571916"
    },
    {
      "id": "eebcdff5-2f65-5596-9d1d-307e1c4762f2",
      "notes": "Acervo do titular: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; recorte: Cafeterias. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "market_overview",
      "priority": 2,
      "is_active": true,
      "item_text": "A análise específica cobre cafeterias e consumo de café; não comprova que toda lanchonete tenha o mesmo perfil.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 1,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "e26e900b-8fe5-5ec8-b62a-6e0986a887bf"
    },
    {
      "id": "ef076492-8b70-51a6-9d9e-677a277c55ed",
      "notes": "Acervo do titular: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; recorte: Advogados. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "digital_maturity",
      "priority": 2,
      "is_active": true,
      "item_text": "A pesquisa histórica destaca conteúdo institucional e reputação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 2,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "f77ed02c-86e8-5f5b-afc6-d1a1188febb4"
    },
    {
      "id": "f3c78e34-25db-5975-a4f8-505cd2b1d24f",
      "notes": "Acervo do titular: Educação.pdf, p.1, 2025-06-25; recorte: Faculdades Privadas. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "market_overview",
      "priority": 2,
      "is_active": true,
      "item_text": "A pesquisa cobre ensino superior privado e ciclos de captação; titularidade privada é contexto da análise, sem categoria adicional.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 1,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "1bc90f27-db13-5b45-b180-cb12cedc0bb0"
    },
    {
      "id": "f45dc329-ad61-5df4-81dc-1979eb249d33",
      "notes": "Acervo do titular: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; recorte: Lojas de Móveis. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "digital_maturity",
      "priority": 2,
      "is_active": true,
      "item_text": "A leitura de 2025 sugere combinação de visita física e pesquisa online.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 2,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "095dab3e-8153-5d04-8b60-ddf2a901e195"
    },
    {
      "id": "f5080911-1037-5a66-a525-59628cd57241",
      "notes": "Acervo do titular: Veículos e Transportes.pdf, p.1, 2025-06-26; recorte: Oficinas mecânicas. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "digital_maturity",
      "priority": 2,
      "is_active": true,
      "item_text": "A pesquisa histórica menciona descoberta local e redes em parte das oficinas.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 2,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "de373e04-827e-5c85-82ea-f4e7009cb97e"
    },
    {
      "id": "f5fc81bb-6896-508c-985b-3948768479b9",
      "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Aluguel de Roupas. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "digital_maturity",
      "priority": 2,
      "is_active": true,
      "item_text": "O material histórico destaca conteúdo visual e consulta de disponibilidade.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 2,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "f893c55c-9d56-5079-badc-0e0f9bb7ea4f"
    },
    {
      "id": "f6d86253-5ac5-549d-96a0-0e45596269b8",
      "notes": "Fontes aproveitadas: Fitnes e Esportes.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida.",
      "item_key": "evidence_limitations",
      "priority": 3,
      "is_active": true,
      "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 4,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "c593f1ec-5f4f-531f-9070-80b4441eef28"
    },
    {
      "id": "f9e43681-f55c-52a7-859e-f9673939173d",
      "notes": "Fontes aproveitadas: Saúde e Bem-estar.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida.",
      "item_key": "evidence_limitations",
      "priority": 3,
      "is_active": true,
      "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 4,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "d5c0e5ab-875f-52c8-afb4-a0facb0b2a48"
    },
    {
      "id": "fa3b6785-2505-53c0-b7f4-ae016ce14df8",
      "notes": "Acervo do titular: Educação.pdf, p.1, 2025-06-25; recorte: Escolas de Música. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "communication_opportunity",
      "priority": 2,
      "is_active": true,
      "item_text": "Apresentar instrumentos, modalidades e experiência dos professores quando confirmados; aula experimental é possibilidade, não oferta presumida.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 3,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "03e6c2a3-493b-5601-bf29-db4c8c97bf21"
    },
    {
      "id": "fa9263e5-d3c8-5a34-97ed-529f9cbb7e5e",
      "notes": "Acervo do titular: Educação.pdf, p.1, 2025-06-25; recorte: Cursinhos (Vestibular/Concurso). Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "digital_maturity",
      "priority": 2,
      "is_active": true,
      "item_text": "A pesquisa de 2025 atribui relevância à divulgação digital nos ciclos de matrícula.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 2,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "1e07f094-a81f-530d-a4fc-5a39a357c6dc"
    },
    {
      "id": "fd50bea3-d979-56fb-b266-19426c155af6",
      "notes": "Acervo do titular: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; recorte: Maquiagem/Perfumaria. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "communication_opportunity",
      "priority": 2,
      "is_active": true,
      "item_text": "Apresentar produtos e condições reais; procedência, marcas e aconselhamento não podem ser presumidos.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 3,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "cfa04ae3-d989-5a72-a155-84d4f96f9fb0"
    },
    {
      "id": "fdd988db-687e-5030-a29f-cf0ed17e1d04",
      "notes": "Acervo do titular: Fitnes e Esportes.pdf, p.1, 2025-06-26; recorte: Boxes de CrossFit. Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "digital_maturity",
      "priority": 2,
      "is_active": true,
      "item_text": "A pesquisa histórica enfatiza conteúdo de treinos e engajamento em redes.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 2,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "4247708e-6cb0-5be0-bbac-77d36eb3ec37"
    },
    {
      "id": "fe42b097-fb08-5e12-93bb-16c2375b49f6",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Médicos (Consultórios). Adaptação qualitativa histórica, não pesquisa atual. Indicadores de volume, crescimento, ticket e margem sem fonte primária rastreável por linha foram omitidos; hipóteses não descrevem empresa particular.",
      "item_key": "market_overview",
      "priority": 2,
      "is_active": true,
      "item_text": "A pesquisa cobre consultório e consulta, sem validar remuneração, crescimento ou especialidade de um profissional.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 1,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "d5bf615a-deb7-55a2-8832-a9f1b22a659b"
    },
    {
      "id": "fef7e990-0eae-57b7-9039-5bca72c967ac",
      "notes": "Fontes aproveitadas: Alimentação e Gastronomia.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida.",
      "item_key": "evidence_limitations",
      "priority": 3,
      "is_active": true,
      "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 4,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "d3254254-c82c-5732-9ed1-dd66270b8a20"
    },
    {
      "id": "ff14fdef-6d79-5448-b1fa-95a1114f990c",
      "notes": "Fontes aproveitadas: Saúde e Bem-estar.pdf. Nenhuma integração conversacional, pesquisa complementar de rotina ou afirmação particular de cliente foi produzida.",
      "item_key": "evidence_limitations",
      "priority": 3,
      "is_active": true,
      "item_text": "Lacuna para PB-B: aferir tendências e maturidade atuais e recuperar fontes primárias dos indicadores antes de uso como fatos presentes. Diferenciais, orçamento e resultados de empresa dependem de confirmação na Base de Comunicação.",
      "created_at": "2026-10-09T16:43:05.654531+00:00",
      "sort_order": 4,
      "updated_at": "2026-10-09T16:43:05.654531+00:00",
      "research_id": "68aea8e0-d763-5597-850e-f294df298fd8"
    }
  ],
  "changes": [
    {
      "id": "09b1ff14-7b29-5f71-b5f2-d843d39a7d76",
      "item_text": "Fonte histórica: Fitnes e Esportes.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro descreve milhares de escolas, interesse associado ao MMA/UFC e ampliação de públicos, incluindo mulheres, crianças e iniciantes. Cita 55% das academias paulistas com lutas, sem período/base próprios. Mensalidades de R$100–200, receita de R$10–30 mil/mês em escolas com mais de 100 alunos e margem de 15–25% são exemplos históricos. Equipamentos/eventos podem complementar receita; comunidade e permanência ajudam o valor do aluno, apesar do ticket modesto.",
      "notes": "Acervo do titular: Fitnes e Esportes.pdf, p.1, 2025-06-26; recorte: Academias de Artes Marciais; SHA-256 PDF: ebb01aadcce657ad78bfe4d38e37e002a33d308c007081c3d841bc79cf5867d9. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "cf95388a-4d54-5bf3-b7bd-6af753cedb95",
      "item_text": "Fonte histórica: Fitnes e Esportes.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Maturidade baixa: indicação e reputação do instrutor predominam; Instagram/Facebook mostram treinos e conquistas, com grupos comunitários e pouca mídia. Aula experimental segmentada localmente aparece como possibilidade; agência é mais comum em escolas grandes/franquias. Pequenas operações familiares/MEI podem precisar de orientação antes de serviços robustos.",
      "notes": "Acervo do titular: Fitnes e Esportes.pdf, p.1, 2025-06-26; recorte: Academias de Artes Marciais; SHA-256 PDF: ebb01aadcce657ad78bfe4d38e37e002a33d308c007081c3d841bc79cf5867d9. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "50a586a0-710a-5d3e-8f3a-e378a1a7f257",
      "item_text": "Fonte histórica: Fitnes e Esportes.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Hipótese estratégica: comunicar modalidades, instrutores e públicos efetivamente atendidos, construir prova autorizada da comunidade e facilitar consulta/aula experimental quando oferecida. Diferenciar formação e experiência comprovadas, com proposta gradual compatível com orçamento. Grandes escolas urbanas podem ser alvo distinto, mas não presumir verba, segurança, títulos ou resultado esportivo.",
      "notes": "Acervo do titular: Fitnes e Esportes.pdf, p.1, 2025-06-26; recorte: Academias de Artes Marciais; SHA-256 PDF: ebb01aadcce657ad78bfe4d38e37e002a33d308c007081c3d841bc79cf5867d9. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "5e413f1c-4769-5e71-a672-2ad824bce8bb",
      "item_text": "Fonte histórica: Fitnes e Esportes.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro estima cerca de 60 mil academias, R$20 bilhões/ano e frequência de 5% da população, sem períodos próprios para essas medidas; cita crescimento de 13–14% ao ano sem série. Mensalidades de R$100–150 no básico e acima de R$200 no premium, receita de R$15–120 mil/mês e margem de 10–20%, chegando a 30% em operações eficientes, mostram heterogeneidade. Recorrência e receitas extras de aulas/produtos coexistem; nenhum valor descreve uma academia particular.",
      "notes": "Acervo do titular: Fitnes e Esportes.pdf, p.1, 2025-06-26; recorte: Academias de Ginástica; SHA-256 PDF: ebb01aadcce657ad78bfe4d38e37e002a33d308c007081c3d841bc79cf5867d9. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "4330a693-01c8-5ec1-a270-67c8226ea044",
      "item_text": "Fonte histórica: Fitnes e Esportes.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Maturidade moderada: o quadro menciona 40% investindo até R$1 mil/mês em digital, sem base/período definidos. Google Meu Negócio, redes, influenciadores locais e e-mail aparecem; redes grandes usam equipes/agências, enquanto pequenas dependem do orgânico. Aquisição e retenção são problemas distintos.",
      "notes": "Acervo do titular: Fitnes e Esportes.pdf, p.1, 2025-06-26; recorte: Academias de Ginástica; SHA-256 PDF: ebb01aadcce657ad78bfe4d38e37e002a33d308c007081c3d841bc79cf5867d9. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "70355fc9-1029-5dcb-b5e8-13ea7c876f39",
      "item_text": "Fonte histórica: Fitnes e Esportes.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Hipótese estratégica: qualificar porte, ocupação, cancelamentos e investimento existente; combinar descoberta local, modalidades e planos comprovados com visita/matrícula e relacionamento de retenção. Diferenciar experiência e acompanhamento demonstráveis. O foco do autor em clientes com verba acima de R$8 mil é um critério de prospecção, não orçamento presumido nem garantia de retorno ou resultado físico.",
      "notes": "Acervo do titular: Fitnes e Esportes.pdf, p.1, 2025-06-26; recorte: Academias de Ginástica; SHA-256 PDF: ebb01aadcce657ad78bfe4d38e37e002a33d308c007081c3d841bc79cf5867d9. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "71004606-54bf-5ff4-bf37-42591498ebd5",
      "item_text": "Fonte histórica: Hotelaria e Turismo.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro cita cerca de 50 mil cadastros, sem período próprio, e distingue R$13,5 bilhões do turismo corporativo em 2023 de R$19,2 bilhões das operadoras de lazer em 2023: são recortes de mercado diferentes. Registra alta de 39% nas vendas de operadoras em 2023 e de 9% no turismo nacional em 2024. Pacotes de R$5–10 mil e exemplo de R$80 mil mensais numa pequena agência não esclarecem receita líquida versus volume vendido. Margem líquida de 12–30%, com referência de 20% em operação eficiente, é histórica e variável.",
      "notes": "Acervo do titular: Hotelaria e Turismo.pdf, p.1, 2025-06-26; recorte: Agências de Turismo; SHA-256 PDF: 25a0041b2f0ce6848cbcd950f26a94025c0fcbe0b0845cccfad160f0035f7817. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "509090b0-823f-5d04-9f71-3532fc865635",
      "item_text": "Fonte histórica: Hotelaria e Turismo.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Maturidade média: PMEs têm lacunas de presença online; SEO, Google Ads, Facebook/Instagram, WhatsApp, blogs e influenciadores apoiam conteúdo/ofertas. O texto menciona capacitação Google/Embratur de 35 mil empresas, sem período próprio. Agências maiores ou especializadas em luxo/corporativo podem contratar apoio; microagências preferem execução própria e treinamento por limitação de verba.",
      "notes": "Acervo do titular: Hotelaria e Turismo.pdf, p.1, 2025-06-26; recorte: Agências de Turismo; SHA-256 PDF: 25a0041b2f0ce6848cbcd950f26a94025c0fcbe0b0845cccfad160f0035f7817. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "53be5e30-9a8a-5aa4-a429-b6c1885c7ede",
      "item_text": "Fonte histórica: Hotelaria e Turismo.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Hipótese estratégica: segmentar pela especialização real e integrar inspiração, informação de viagem e atendimento qualificado, considerando ciclo e sazonalidade. Diferenciar curadoria e serviço comprovados; dimensionar marketing sobre a economia real, sem confundir preço de pacote com receita retida. Não presumir destinos, parceiros, disponibilidade, condições ou orçamento do cliente.",
      "notes": "Acervo do titular: Hotelaria e Turismo.pdf, p.1, 2025-06-26; recorte: Agências de Turismo; SHA-256 PDF: 25a0041b2f0ce6848cbcd950f26a94025c0fcbe0b0845cccfad160f0035f7817. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "a37b4e89-22e0-5682-a8de-0419805e9a12",
      "item_text": "Fonte histórica: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro de julho de 2025 indica locação de R$150 a R$3.000 ou mais, margem líquida de 30–60% e procura fortemente sazonal. Não define período ou método das estimativas. A economia combina valor por locação, disponibilidade e ocasiões; masculino, feminino e noivas permanecem contexto de atendimento, sem novas categorias.",
      "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Aluguel de Roupas; SHA-256 PDF: d2942178024ac97569ac4ab912e3dc06c3ee05260499dc02a2eb797a1ef58f97. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "f5fc81bb-6896-508c-985b-3948768479b9",
      "item_text": "Fonte histórica: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; conteúdo sem validação independente. Maturidade alta em contatos e apresentação visual e abertura alta a agência no quadro. A conclusão afirma forte entendimento do valor das campanhas, mas essa opinião histórica não comprova maturidade de toda operação nem canais específicos.",
      "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Aluguel de Roupas; SHA-256 PDF: d2942178024ac97569ac4ab912e3dc06c3ee05260499dc02a2eb797a1ef58f97. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "1165a33e-b528-5ce7-995e-f09a5fffe23d",
      "item_text": "Fonte histórica: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; conteúdo sem validação independente. Hipótese estratégica: conectar portfólio autorizado à consulta de disponibilidade, prova e reserva, planejando comunicação por ocasião/calendário real. Qualificar acervo, capacidade e sazonalidade antes de ampliar contatos. Ajuste, tamanhos, variedade, condições de locação e devolução precisam de confirmação; margem alta não garante verba ou retorno.",
      "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Aluguel de Roupas; SHA-256 PDF: d2942178024ac97569ac4ab912e3dc06c3ee05260499dc02a2eb797a1ef58f97. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "c40d4a9c-73f7-5eb4-a8a2-0303a737469d",
      "item_text": "Fonte histórica: Fitnes e Esportes.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro estima 900–1.000 boxes e crescimento de 5.900% entre 2013 e 2019; relata estabilização ou retração moderada após a pandemia, de modo que a expansão antiga não é tendência atual demonstrada. Mensalidade de R$250–300, receita de R$30–60 mil ou mais em boxes com 100–200 alunos e margem de 30–35% quando cheios são referências condicionais. Ponto de equilíbrio de 60 alunos e custo de R$20 mil/mês constituem cenário histórico, não regra operacional universal.",
      "notes": "Acervo do titular: Fitnes e Esportes.pdf, p.1, 2025-06-26; recorte: Boxes de CrossFit; SHA-256 PDF: ebb01aadcce657ad78bfe4d38e37e002a33d308c007081c3d841bc79cf5867d9. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "fdd988db-687e-5030-a29f-cf0ed17e1d04",
      "item_text": "Fonte histórica: Fitnes e Esportes.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Maturidade moderada/alta: Instagram/Facebook com WODs, vídeos e depoimentos, Google/Meta para aulas experimentais e grupos de WhatsApp/desafios para retenção. Boxes grandes e redes recorrem a agências/equipes; muitos donos já conhecem digital. A comunidade e a recorrência diferenciam o modelo, com custo fixo relevante.",
      "notes": "Acervo do titular: Fitnes e Esportes.pdf, p.1, 2025-06-26; recorte: Boxes de CrossFit; SHA-256 PDF: ebb01aadcce657ad78bfe4d38e37e002a33d308c007081c3d841bc79cf5867d9. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "ae16fe84-5319-58b5-bf8c-267ce4edcc2f",
      "item_text": "Fonte histórica: Fitnes e Esportes.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Hipótese estratégica: combinar marca/comunidade, busca local e conteúdo autorizado com captação para experiência real e acompanhamento de retenção. Qualificar ocupação e economia da operação antes de otimizar anúncios; uma campanha não resolve capacidade ou custo fixo. Confirmar aulas, profissionais, vínculo de marca e diferenciais; não prometer desempenho físico nem reproduzir o cenário de equilíbrio como garantia.",
      "notes": "Acervo do titular: Fitnes e Esportes.pdf, p.1, 2025-06-26; recorte: Boxes de CrossFit; SHA-256 PDF: ebb01aadcce657ad78bfe4d38e37e002a33d308c007081c3d841bc79cf5867d9. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "eebcdff5-2f65-5596-9d1d-307e1c4762f2",
      "item_text": "Fonte histórica: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro associa cafeterias ao crescimento da cultura de cafés premium entre jovens. Os R$36 bilhões de 2024 citados correspondem ao setor de café, não ao faturamento exclusivo de cafeterias; o consumo interno teria crescido 0,16% no início de 2024 apesar dos preços. Ticket de R$15–25 por pessoa e margem de 15–25% são referências históricas. A análise específica cobre cafeterias, sem generalização para lanchonetes.",
      "notes": "Acervo do titular: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; recorte: Cafeterias; SHA-256 PDF: aee99dbe347f7111f2cd54ca5cc1c85f61fdd0128ac43a3e92e9d9096f195c7a. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "335f4d84-fc2c-5d0f-a61a-c973e40fe6cd",
      "item_text": "Fonte histórica: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Maturidade alta em marca e Instagram orgânico, com mídia paga ainda pouco explorada nas pequenas operações. O documento descreve divulgação frequentemente feita pelos proprietários e maior disposição para apoio externo na expansão; marca visual forte não demonstra verba ou estrutura de agência.",
      "notes": "Acervo do titular: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; recorte: Cafeterias; SHA-256 PDF: aee99dbe347f7111f2cd54ca5cc1c85f61fdd0128ac43a3e92e9d9096f195c7a. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "9a8e51d9-5592-5662-ac65-4559bdfe688c",
      "item_text": "Fonte histórica: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Hipótese estratégica: apresentar ambiente, cardápio e ocasiões reais de visita, conectando descoberta local e conteúdo visual à frequência. Qualificar fase de expansão e capacidade antes de propor mídia ou profissionalização. Café especial, origem, experiência diferenciada e espaço de trabalho só são atributos comunicáveis se comprovados pelo estabelecimento.",
      "notes": "Acervo do titular: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; recorte: Cafeterias; SHA-256 PDF: aee99dbe347f7111f2cd54ca5cc1c85f61fdd0128ac43a3e92e9d9096f195c7a. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "53711982-1951-51e6-ade4-4e3072090e5d",
      "item_text": "Fonte histórica: Saúde e Bem-estar.pdf, p.1, 2025-06-25; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro de estética registra crescimento de 13,2% do setor de beleza em 2022 e cita aproximadamente 1,5 milhão de procedimentos por ano, sem delimitar com precisão o período desse volume. Indica ticket de R$200–500, faturamento de até R$200 mil/mês em operações grandes e margem de 30–60%. São referências do acervo, não parâmetros universais: porte, mix de procedimentos, custos e recorrência alteram a economia da clínica.",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Clínica de Estética; SHA-256 PDF: 56b892758bf9c02a22c2ae47223bffe9b41e5300b35a75224b77ea07046751d3. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "92d52236-3a82-5068-991a-e17e41d7c7d6",
      "item_text": "Fonte histórica: Saúde e Bem-estar.pdf, p.1, 2025-06-25; conteúdo sem validação independente. Adoção alta no quadro, com redes sociais, anúncios segmentados e influenciadores. A divulgação é visual e orientada à captação; concorrência e necessidade de diferenciação tornam conteúdo e processo comercial relevantes. A análise setorial não prova maturidade, verba ou procedimentos de uma clínica particular.",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Clínica de Estética; SHA-256 PDF: 56b892758bf9c02a22c2ae47223bffe9b41e5300b35a75224b77ea07046751d3. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "84fe203e-03dd-547a-bbb4-24b0098714b1",
      "item_text": "Fonte histórica: Saúde e Bem-estar.pdf, p.1, 2025-06-25; conteúdo sem validação independente. Hipótese estratégica: segmentar pela oferta efetiva e pelo perfil de atendimento, conectar conteúdo informativo, avaliação e acompanhamento comercial e diferenciar experiência, equipe e estrutura quando comprovadas. Qualificar porte e capacidade antes de dimensionar campanhas. Imagens, habilitação, resultados e publicidade dos procedimentos exigem verificação própria; não transformar exemplos setoriais em garantias de eficácia ou lucro.",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Clínica de Estética; SHA-256 PDF: 56b892758bf9c02a22c2ae47223bffe9b41e5300b35a75224b77ea07046751d3. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "8eff368e-64bb-5108-ae4a-f55eeaeb76d6",
      "item_text": "Fonte histórica: Saúde e Bem-estar.pdf, p.1, 2025-06-25; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O recorte de depilação a laser descreve pacotes acima de R$1 mil, pagamento antecipado e margem favorecida após o investimento inicial em equipamento. Menciona alcance inferior a 5% do público, sem base/período definidos, e projeta crescimento de 214% até 2036, chegando a R$30 bilhões: projeção feita no acervo de 2025, sem confirmação de realização. Expansão de franquias para o interior é uma tendência histórica relatada, não expansão atual comprovada.",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Depilação a Laser; SHA-256 PDF: 56b892758bf9c02a22c2ae47223bffe9b41e5300b35a75224b77ea07046751d3. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "73a8602e-657d-54bb-bd6a-41be7dac1630",
      "item_text": "Fonte histórica: Saúde e Bem-estar.pdf, p.1, 2025-06-25; conteúdo sem validação independente. Maturidade muito alta no quadro: anúncios e promoções geram leads para equipes comerciais, com muitas agências especializadas. A venda de pacotes e o uso de equipamento distinguem esse modelo de uma clínica estética genérica; aquisição, conversão e capacidade de atendimento precisam ser avaliadas em conjunto.",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Depilação a Laser; SHA-256 PDF: 56b892758bf9c02a22c2ae47223bffe9b41e5300b35a75224b77ea07046751d3. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "50c9e9b3-bd6e-5732-89e1-2ed8ee349751",
      "item_text": "Fonte histórica: Saúde e Bem-estar.pdf, p.1, 2025-06-25; conteúdo sem validação independente. Hipótese estratégica: se a clínica realmente oferecer depilação a laser, estruturar a comunicação de avaliação, condições de pacotes, atendimento e diferenciais comprovados, acompanhando o caminho do contato à contratação. Qualificar investimento em equipamento e capacidade comercial antes da mídia. Não apresentar projeções como receita disponível nem prometer eficácia, segurança ou resultado individual.",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Depilação a Laser; SHA-256 PDF: 56b892758bf9c02a22c2ae47223bffe9b41e5300b35a75224b77ea07046751d3. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "d21a31d7-c80e-5d66-b05e-da3b5f6a6654",
      "item_text": "Fonte histórica: Saúde e Bem-estar.pdf, p.1, 2025-06-25; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro atribui ao atendimento privado crescimento de 40% em cinco anos após a pandemia, sem fixar o início e o fim da série. Distingue clínicas populares de baixo ticket e alto volume de clínicas premium, com consulta de R$400 ou mais; o serviço particular é apresentado como mais rentável. O modelo popular depende de escala, enquanto o premium enfatiza valor percebido e marca.",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Clínicas Médicas; SHA-256 PDF: 56b892758bf9c02a22c2ae47223bffe9b41e5300b35a75224b77ea07046751d3. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "47ae0662-4f66-585b-9670-1641668d11e1",
      "item_text": "Fonte histórica: Saúde e Bem-estar.pdf, p.1, 2025-06-25; conteúdo sem validação independente. Maturidade média no quadro, com sites e marketing já presentes. A comunicação popular tende a destacar preço e acesso; a premium, marca e conteúdo. Tratar os dois modelos com a mesma oferta de marketing apaga diferenças de volume, posicionamento e processo de captação.",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Clínicas Médicas; SHA-256 PDF: 56b892758bf9c02a22c2ae47223bffe9b41e5300b35a75224b77ea07046751d3. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "53ae43c1-b050-50ee-94a9-9b85dac5e629",
      "item_text": "Fonte histórica: Saúde e Bem-estar.pdf, p.1, 2025-06-25; conteúdo sem validação independente. Hipótese estratégica: separar propostas por modelo e capacidade real: acesso, clareza de preços e agendamento para a clínica popular; posicionamento e informação sobre atendimento para a premium. Confirmar especialidades, equipe, convênios, unidades e preços antes de comunicar. Crescimento setorial e ticket histórico não comprovam demanda local, verba nem qualidade clínica.",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Clínicas Médicas; SHA-256 PDF: 56b892758bf9c02a22c2ae47223bffe9b41e5300b35a75224b77ea07046751d3. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "1bd88399-b0cc-57ee-b99f-0596a08f96b3",
      "item_text": "Fonte histórica: Veículos e Transportes.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro descreve 4,1–4,5 milhões de veículos/ano, cerca de 8.010 lojas e crescimento superior a 10% ao ano, sem individualizar períodos/série dessas referências. Ticket de aproximadamente R$150 mil para carros novos e margem líquida de 5–6% mostram alto valor com margem relativamente baixa, compensada por volume. O autor prioriza operações de porte, sem provar verba em todas as concessionárias.",
      "notes": "Acervo do titular: Veículos e Transportes.pdf, p.1, 2025-06-26; recorte: Concessionárias de carros; SHA-256 PDF: dde9d34ab21dd2bd00d9e60259bb1e1fdd1b5fc8796699e8f3c2059f5a63e4d6. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "21881e18-4719-5412-b14b-a7ca34ec99b3",
      "item_text": "Fonte histórica: Veículos e Transportes.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Maturidade alta: sites robustos, CRM integrado e investimento em Google e redes sociais para anúncios. O documento cita a digitalização destacada em cursos da Fenabrave; essa referência não é medição independente de adoção nem demonstra o processo de uma loja.",
      "notes": "Acervo do titular: Veículos e Transportes.pdf, p.1, 2025-06-26; recorte: Concessionárias de carros; SHA-256 PDF: dde9d34ab21dd2bd00d9e60259bb1e1fdd1b5fc8796699e8f3c2059f5a63e4d6. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "d590e4c3-9543-5728-8ea2-e26497829019",
      "item_text": "Fonte histórica: Veículos e Transportes.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Hipótese estratégica: integrar apresentação de veículos confirmados, captação, qualificação e acompanhamento comercial, diferenciando atendimento e condições comprovadas. Qualificar volume, margem, autonomia e estrutura existente antes de propor otimização. Estoque, preço, financiamento e disponibilidade precisam de confirmação; a referência do autor a clientes com verba de R$8 mil ou mais não é atributo presumido.",
      "notes": "Acervo do titular: Veículos e Transportes.pdf, p.1, 2025-06-26; recorte: Concessionárias de carros; SHA-256 PDF: dde9d34ab21dd2bd00d9e60259bb1e1fdd1b5fc8796699e8f3c2059f5a63e4d6. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "013ebc4c-ebad-51ee-9aa8-72f9cc35341e",
      "item_text": "Fonte histórica: Veículos e Transportes.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro registra 4,5 mil embarcações em 2020 e faturamento setorial de R$2 bilhões em 2021; dobrar volume e chegar a R$4 bilhões em 2025 são projeções históricas, sem confirmação de realização. Lanchas de lazer variam de centenas de milhares a dezenas de milhões de reais; o exemplo de iate de R$54 milhões não é ticket típico. Margens são descritas apenas como potencialmente altas no luxo, sem percentual comprovado.",
      "notes": "Acervo do titular: Veículos e Transportes.pdf, p.1, 2025-06-26; recorte: Concessionárias de lanchas; SHA-256 PDF: dde9d34ab21dd2bd00d9e60259bb1e1fdd1b5fc8796699e8f3c2059f5a63e4d6. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "d2bf5428-7b73-5dbd-a81e-aba9572278b2",
      "item_text": "Fonte histórica: Veículos e Transportes.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Maturidade média: sites especializados, eventos náuticos e anúncios Google/Meta para público de lazer coexistem com atendimento personalizado. O exemplo de custo por lead de R$12 em um revendedor de jetski é caso isolado, sem período/método próprios; não serve de referência garantida para venda de lanchas.",
      "notes": "Acervo do titular: Veículos e Transportes.pdf, p.1, 2025-06-26; recorte: Concessionárias de lanchas; SHA-256 PDF: dde9d34ab21dd2bd00d9e60259bb1e1fdd1b5fc8796699e8f3c2059f5a63e4d6. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "27b65fb4-f6ab-59d9-92ac-a3f36122763b",
      "item_text": "Fonte histórica: Veículos e Transportes.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Hipótese estratégica: segmentar público e tipo de embarcação reais, combinar apresentação técnica/visual autorizada com relacionamento personalizado e acompanhamento mais longo. Qualificar portfólio, região, decisores e capacidade antes da mídia. Não presumir estoque, manutenção, especificações, condições ou retorno; projeção setorial e caso de jetski não comprovam resultado de uma concessionária de lanchas.",
      "notes": "Acervo do titular: Veículos e Transportes.pdf, p.1, 2025-06-26; recorte: Concessionárias de lanchas; SHA-256 PDF: dde9d34ab21dd2bd00d9e60259bb1e1fdd1b5fc8796699e8f3c2059f5a63e4d6. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "ed3816fc-bc6d-507a-b0ca-a536225f72de",
      "item_text": "Fonte histórica: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro situa a confeitaria dentro da panificação: participação de cerca de 16% na receita e bolos estimados em R$15 bilhões/ano, sem período individualizado. Cita 83% atendendo por encomenda, também sem base/período definidos. Encomendas de centenas de reais contrastam com consumo de vitrine de R$15–30; margem de 10–20% varia com valor agregado. Ocasiões de consumo e capacidade de produção importam mais que tratar todas as vendas como balcão.",
      "notes": "Acervo do titular: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; recorte: Confeitarias; SHA-256 PDF: aee99dbe347f7111f2cd54ca5cc1c85f61fdd0128ac43a3e92e9d9096f195c7a. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "03e4716a-a422-50b7-b212-d51e96ae61ef",
      "item_text": "Fonte histórica: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Maturidade alta no quadro, apoiada em apelo visual, Instagram, WhatsApp e indicação online. O documento ressalta que muitas confeitarias são pequenas, com verba e volume menores que restaurantes; visibilidade não equivale a capacidade de contratar agência.",
      "notes": "Acervo do titular: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; recorte: Confeitarias; SHA-256 PDF: aee99dbe347f7111f2cd54ca5cc1c85f61fdd0128ac43a3e92e9d9096f195c7a. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "a00dc417-6e1e-5c25-a452-4a81ba159fb3",
      "item_text": "Fonte histórica: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Hipótese estratégica: organizar portfólio autorizado, ocasiões e processo de encomenda, esclarecendo personalização, prazos, retirada/entrega e capacidade quando confirmados. Planejar comunicação sazonal e pedidos antecipados conforme a operação. Bolos para casamento são contexto de oferta, sem nova categoria; não presumir atendimento a eventos, tamanho, disponibilidade ou diferenciais de ingredientes.",
      "notes": "Acervo do titular: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; recorte: Confeitarias; SHA-256 PDF: aee99dbe347f7111f2cd54ca5cc1c85f61fdd0128ac43a3e92e9d9096f195c7a. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "6823c76b-82a6-5818-9ad5-4e38924a3614",
      "item_text": "Fonte histórica: Imobiliário Construção.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro registra crescimento de 4,3% no PIB da construção em 2024, cerca de 400 mil unidades novas vendidas nesse ano e alta de 43% nas vendas do Minha Casa Minha Vida. Tickets de R$200 mil a mais de R$1 milhão variam por projeto. Margem líquida de 10–15% e exemplo de incorporadoras com 13,7% líquida/28% bruta são medidas distintas; orçamento de marketing de 2–5% do VGV é referência do acervo, não verba de uma empresa.",
      "notes": "Acervo do titular: Imobiliário Construção.pdf, p.1, 2025-06-26; recorte: Construtoras/Incorporadoras; SHA-256 PDF: 50f43b99ce6bc66d38dc2107de569eae3d20166af246c71772379dc2f2855941. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "1a105ccf-d58a-5bcb-a90f-385c673ff7df",
      "item_text": "Fonte histórica: Imobiliário Construção.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Maturidade alta: campanhas combinam Google, social, portais e CRM, com contratação frequente de agências e marketing ligado à venda de empreendimentos. A conclusão prioriza incorporadoras regionais médias que competem com grandes grupos; isso é segmentação comercial histórica, não prova de prontidão de qualquer construtora.",
      "notes": "Acervo do titular: Imobiliário Construção.pdf, p.1, 2025-06-26; recorte: Construtoras/Incorporadoras; SHA-256 PDF: 50f43b99ce6bc66d38dc2107de569eae3d20166af246c71772379dc2f2855941. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "cf1d4434-57e2-537d-950d-ae277df8ff45",
      "item_text": "Fonte histórica: Imobiliário Construção.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Hipótese estratégica: qualificar empreendimento, fase comercial, público, estoque e estrutura de atendimento; integrar divulgação e acompanhamento dos interessados e diferenciar atributos comprovados do projeto. Confirmar condições, documentação, prazos e disponibilidade antes de comunicar. VGV não é caixa disponível, margem bruta não é líquida e cenário setorial não garante venda ou retorno de campanha.",
      "notes": "Acervo do titular: Imobiliário Construção.pdf, p.1, 2025-06-26; recorte: Construtoras/Incorporadoras; SHA-256 PDF: 50f43b99ce6bc66d38dc2107de569eae3d20166af246c71772379dc2f2855941. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "e90ab9b2-d3a5-55a6-a10b-22c728287e90",
      "item_text": "Fonte histórica: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro estima 161 mil empresas e US$14,4 bilhões de mercado em 2021, com crescimento de 14% naquele ano. A alta de 50% até 2025 é projeção histórica, sem confirmação de realização. Projetos para PMEs são descritos em dezenas de milhares de reais e grandes contratos em milhões; valor intelectual e procura por eficiência/adaptação diferenciam o modelo, sem ticket ou margem uniformes.",
      "notes": "Acervo do titular: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; recorte: Consultorias Empresariais; SHA-256 PDF: e1689e90ec84e6bc4715b94220ec6953bc8470496c244a2b6ebae7e8f3909472. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "12573af5-58c8-5794-87c8-3d6128f9979d",
      "item_text": "Fonte histórica: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Maturidade moderada: consultorias completas usam conteúdo e newsletters, enquanto autônomos dependem mais de relacionamentos offline; o quadro cita 60% com newsletter e 83% dos autônomos apoiados no offline, sem base/período próprios. Blogs, LinkedIn, webinars e SEO/site aparecem como canais B2B; consultorias em expansão são alvo comercial condicional.",
      "notes": "Acervo do titular: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; recorte: Consultorias Empresariais; SHA-256 PDF: e1689e90ec84e6bc4715b94220ec6953bc8470496c244a2b6ebae7e8f3909472. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "662fc8da-b893-532b-802d-08b417f85ab2",
      "item_text": "Fonte histórica: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Hipótese estratégica: explicar problemas, método e escopo efetivamente atendidos, produzir conteúdo técnico e casos autorizados para apoiar decisões B2B mais longas e qualificar contatos por projeto. Diferenciar experiência comprovada, sem presumir clientes ou resultados. A projeção de mercado não demonstra demanda atual, verba ou retorno de uma consultoria particular.",
      "notes": "Acervo do titular: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; recorte: Consultorias Empresariais; SHA-256 PDF: e1689e90ec84e6bc4715b94220ec6953bc8470496c244a2b6ebae7e8f3909472. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "fe42b097-fb08-5e12-93bb-16c2375b49f6",
      "item_text": "Fonte histórica: Saúde e Bem-estar.pdf, p.1, 2025-06-25; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro menciona aproximadamente 500 mil médicos e expansão de clínicas populares. Contrasta consulta particular de R$300–600 com remuneração de cerca de R$60 por convênio; procedimentos podem ter valor maior. Descreve margem mais elevada no particular, sem percentual uniforme. Esse contraste de modelo e pagador é comercialmente mais útil que tratar todos os consultórios como equivalentes.",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Médicos (Consultórios); SHA-256 PDF: 56b892758bf9c02a22c2ae47223bffe9b41e5300b35a75224b77ea07046751d3. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "01cf5d4f-ad72-51e0-a1b7-098ca7db8c62",
      "item_text": "Fonte histórica: Saúde e Bem-estar.pdf, p.1, 2025-06-25; conteúdo sem validação independente. Maturidade média/alta no quadro: sites, SEO e anúncios aparecem em especialidades com competição por pacientes particulares. A intensidade varia com especialidade e faixa etária atendida; presença digital e dependência de convênios não podem ser inferidas para um médico individual.",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Médicos (Consultórios); SHA-256 PDF: 56b892758bf9c02a22c2ae47223bffe9b41e5300b35a75224b77ea07046751d3. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "3dbf5f9d-a9ab-5411-b605-c186c7d6919f",
      "item_text": "Fonte histórica: Saúde e Bem-estar.pdf, p.1, 2025-06-25; conteúdo sem validação independente. Hipótese estratégica: qualificar especialidade, modelo particular/convênio e capacidade de agenda antes da proposta; trabalhar descoberta por especialidade e localidade, informação sobre atendimento e contato para agendamento. Diferenciar acesso, equipe e experiência somente com dados confirmados, sem pressupor títulos, tratamentos ou prometer resultado clínico. A margem e o preço históricos não demonstram verba disponível do cliente.",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Médicos (Consultórios); SHA-256 PDF: 56b892758bf9c02a22c2ae47223bffe9b41e5300b35a75224b77ea07046751d3. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "654c68fd-d0c8-519b-ab94-133b6b23d3ad",
      "item_text": "Fonte histórica: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro cita mais de 630 mil corretores em 2024, aumento de 23% frente a 2023 e alta de 15% nas vendas de imóveis em 2024. Comissões brutas de 5–6% ilustram R$30 mil numa venda de R$500 mil, antes de custos e partilhas. A possibilidade de duas ou três vendas mensais é cenário, não renda recorrente garantida. A análise cobre corretagem imobiliária, sem equivalência com outras corretagens.",
      "notes": "Acervo do titular: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; recorte: Corretores de Imóveis (Imobiliário); SHA-256 PDF: e1689e90ec84e6bc4715b94220ec6953bc8470496c244a2b6ebae7e8f3909472. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "0a439c4f-02e6-5e32-a6b6-b5268ac2c5b2",
      "item_text": "Fonte histórica: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Maturidade muito alta: portais, Google Ads, Facebook/Instagram e WhatsApp; o quadro cita 85% valorizando resposta rápida no WhatsApp, sem base/período próprios. Estruturas maiores usam CRM, chatbots e IA, enquanto individuais se apoiam em redes e grupos. Captação, resposta e acompanhamento são etapas distintas.",
      "notes": "Acervo do titular: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; recorte: Corretores de Imóveis (Imobiliário); SHA-256 PDF: e1689e90ec84e6bc4715b94220ec6953bc8470496c244a2b6ebae7e8f3909472. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "0a04e266-7979-5adb-addb-a8e256208a25",
      "item_text": "Fonte histórica: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Hipótese estratégica: melhorar apresentação de imóveis confirmados, qualificação de interessados e continuidade do contato, diferenciando atuação e atendimento comprovados. Qualificar acesso ao estoque, autonomia e verba antes da campanha. Não presumir imóvel disponível, autorização de anúncio, financiamento, comissão líquida ou número de vendas de um corretor.",
      "notes": "Acervo do titular: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; recorte: Corretores de Imóveis (Imobiliário); SHA-256 PDF: e1689e90ec84e6bc4715b94220ec6953bc8470496c244a2b6ebae7e8f3909472. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "7908a332-adce-5c19-9b4b-f896c3c4ccf7",
      "item_text": "Fonte histórica: Educação.pdf, p.1, 2025-06-25; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro descreve demanda média/alta, porém cíclica, vinculada a vestibulares e concursos; aponta ticket de R$400–2.000 e margem de 15–25%, sem unidade temporal ou período próprios. A economia depende do calendário, da abertura de turmas e da renovação da captação, em vez de demanda uniforme durante todo o ano.",
      "notes": "Acervo do titular: Educação.pdf, p.1, 2025-06-25; recorte: Cursinhos (Vestibular/Concurso); SHA-256 PDF: fb9403295b3428205f0fd128ce0c7cf4f4fb83e2437faade03e1ebfcd05d1291. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "fa9263e5-d3c8-5a34-97ed-529f9cbb7e5e",
      "item_text": "Fonte histórica: Educação.pdf, p.1, 2025-06-25; conteúdo sem validação independente. Maturidade muito alta: o documento associa cada ciclo de matrícula a forte dependência de marketing e urgência comercial. A posição no ranking do autor e sua expectativa de retorno são hipóteses comerciais, não prova de retorno de campanhas ou resultados de uma escola.",
      "notes": "Acervo do titular: Educação.pdf, p.1, 2025-06-25; recorte: Cursinhos (Vestibular/Concurso); SHA-256 PDF: fb9403295b3428205f0fd128ce0c7cf4f4fb83e2437faade03e1ebfcd05d1291. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "c22319ac-0edd-5508-9861-13c23faca9cd",
      "item_text": "Fonte histórica: Educação.pdf, p.1, 2025-06-25; conteúdo sem validação independente. Hipótese estratégica: organizar campanhas e atendimento por exame, concurso e calendário efetivamente cobertos, explicando preparação, turmas e prazos reais. Diferenciar material, professores e acompanhamento somente quando demonstrados. Planejar verba e capacidade para os picos sazonais; não prometer aprovação, nota ou retorno financeiro nem publicar índices sem prova específica.",
      "notes": "Acervo do titular: Educação.pdf, p.1, 2025-06-25; recorte: Cursinhos (Vestibular/Concurso); SHA-256 PDF: fb9403295b3428205f0fd128ce0c7cf4f4fb83e2437faade03e1ebfcd05d1291. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "05832cd1-a85c-5bf3-a19c-f06978986376",
      "item_text": "Fonte histórica: Imobiliário Construção.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro registra alta de 41% na capacidade instalada em 2023, cerca de 800 mil instalações e 3,7 mil novos entrantes em 2024. Descreve procura residencial, comercial e rural, ticket residencial de R$20–30 mil e projetos comerciais acima de R$100 mil. Margem líquida de 15–20% e exemplo de R$3–5 mil de lucro residencial são referências condicionais, não resultado de toda venda nem garantia de que poucos leads pagarão mídia.",
      "notes": "Acervo do titular: Imobiliário Construção.pdf, p.1, 2025-06-26; recorte: Energia Solar; SHA-256 PDF: 50f43b99ce6bc66d38dc2107de569eae3d20166af246c71772379dc2f2855941. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "9e04fcfc-b560-512d-8012-f17728bed287",
      "item_text": "Fonte histórica: Imobiliário Construção.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Maturidade alta: Google Ads, SEO, redes sociais, conteúdo e anúncios segmentados já geram contatos, com agências especializadas. Muitos concorrentes novos precisam de conhecimento comercial/digital, segundo o autor; competição e ticket atraem prospecção, sem demonstrar demanda atual ou verba individual.",
      "notes": "Acervo do titular: Imobiliário Construção.pdf, p.1, 2025-06-26; recorte: Energia Solar; SHA-256 PDF: 50f43b99ce6bc66d38dc2107de569eae3d20166af246c71772379dc2f2855941. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "24153fa6-cda1-5a57-b325-9588ff23a6fb",
      "item_text": "Fonte histórica: Imobiliário Construção.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Hipótese estratégica: qualificar tipo de projeto, área atendida, capacidade técnica e processo comercial; diferenciar proposta e execução comprovadas e acompanhar contatos até orçamento/contratação. Ajustar a mídia à conversão e economia reais. Não prometer economia de energia, retorno do sistema, financiamento, lucro ou prazo sem dados específicos verificáveis do cliente.",
      "notes": "Acervo do titular: Imobiliário Construção.pdf, p.1, 2025-06-26; recorte: Energia Solar; SHA-256 PDF: 50f43b99ce6bc66d38dc2107de569eae3d20166af246c71772379dc2f2855941. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "8972dd13-b892-53ce-976f-edae5fa2993b",
      "item_text": "Fonte histórica: Imobiliário Construção.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro cita cerca de 139 mil empresas de serviços de engenharia, sem período próprio, em mercado B2B pulverizado associado a obras e infraestrutura. Contratos variam de laudos de R$5 mil a projetos de R$500 mil ou mais; margem líquida de 5–15% depende de escala e eficiência. Ganho comercial vem de contratos, não de volume de consumidores finais.",
      "notes": "Acervo do titular: Imobiliário Construção.pdf, p.1, 2025-06-26; recorte: Empresas de Engenharia; SHA-256 PDF: 50f43b99ce6bc66d38dc2107de569eae3d20166af246c71772379dc2f2855941. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "0ac87ec4-37ae-5662-8960-3ed68bb63e94",
      "item_text": "Fonte histórica: Imobiliário Construção.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Maturidade baixa: networking e licitações predominam; sites institucionais e LinkedIn têm mais presença que marketing ativo. Conteúdo e anúncios segmentados estão começando em parte do setor. O autor considera baixa a prontidão geral para agência, com possíveis exceções em empresas mais modernas; isso precisa ser qualificado.",
      "notes": "Acervo do titular: Imobiliário Construção.pdf, p.1, 2025-06-26; recorte: Empresas de Engenharia; SHA-256 PDF: 50f43b99ce6bc66d38dc2107de569eae3d20166af246c71772379dc2f2855941. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "aaede3a6-3954-57d9-8a4c-a461c1d15625",
      "item_text": "Fonte histórica: Imobiliário Construção.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Hipótese estratégica: apresentar especialidades, capacidade técnica e projetos autorizados para apoiar confiança e relacionamento B2B, usando conteúdo e prospecção compatíveis com o serviço. Qualificar ciclo, decisores e origem dos contratos antes de sugerir anúncios. Não presumir habilitação, portfólio, elegibilidade em licitação ou retorno rápido de mídia.",
      "notes": "Acervo do titular: Imobiliário Construção.pdf, p.1, 2025-06-26; recorte: Empresas de Engenharia; SHA-256 PDF: 50f43b99ce6bc66d38dc2107de569eae3d20166af246c71772379dc2f2855941. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "16cec7ec-c756-5084-a936-f0af9c1ff374",
      "item_text": "Fonte histórica: Veículos e Transportes.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro associa procura à mobilidade urbana e descreve mercado pulverizado, de pequenos a grandes prestadores, sem estatísticas consolidadas. A menção a dezenas de milhares de empresas não tem base/período próprios. Mudanças residenciais variam de poucas centenas a milhares de reais, com margens apenas qualificadas como médias e concorrência forte, sem percentual seguro.",
      "notes": "Acervo do titular: Veículos e Transportes.pdf, p.1, 2025-06-26; recorte: Empresas de mudanças; SHA-256 PDF: dde9d34ab21dd2bd00d9e60259bb1e1fdd1b5fc8796699e8f3c2059f5a63e4d6. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "54b4631e-9bd3-50ce-8fec-0fd7bf0c1018",
      "item_text": "Fonte histórica: Veículos e Transportes.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Maturidade baixa/média: indicação e panfletagem predominam; parte das empresas usa site básico e Google Ads local. A conclusão aponta negócios geralmente menores, com verba limitada e necessidade de educação sobre marketing, sem negar possibilidades em operações estruturadas.",
      "notes": "Acervo do titular: Veículos e Transportes.pdf, p.1, 2025-06-26; recorte: Empresas de mudanças; SHA-256 PDF: dde9d34ab21dd2bd00d9e60259bb1e1fdd1b5fc8796699e8f3c2059f5a63e4d6. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "1e0509b8-6f03-56be-a7b3-c85d9564306b",
      "item_text": "Fonte histórica: Veículos e Transportes.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Hipótese estratégica: trabalhar descoberta por localidade, escopo e orçamento claro, qualificando origem/destino e serviço realmente prestado. Diferenciar cuidados e processo comprovados e começar por ações compatíveis com capacidade e verba. Não presumir cobertura, embalagem, guarda-móveis, seguro, equipe ou disponibilidade; crescimento narrado não é série atual validada.",
      "notes": "Acervo do titular: Veículos e Transportes.pdf, p.1, 2025-06-26; recorte: Empresas de mudanças; SHA-256 PDF: dde9d34ab21dd2bd00d9e60259bb1e1fdd1b5fc8796699e8f3c2059f5a63e4d6. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "71b2ea8c-c74f-5c53-80c3-9db1d6a60f9f",
      "item_text": "Fonte histórica: Educação.pdf, p.1, 2025-06-25; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro reúne colégios de ensino fundamental e médio, com milhares de instituições, ticket de R$500–1.200 e margem de 10–20%, sem período próprio nem unidade temporal explícita do ticket. A demanda e a operação variam por escola; etapas atendidas são contextos da instituição, sem novas categorias.",
      "notes": "Acervo do titular: Educação.pdf, p.1, 2025-06-25; recorte: Colégios (Fundamental/Médio); SHA-256 PDF: fb9403295b3428205f0fd128ce0c7cf4f4fb83e2437faade03e1ebfcd05d1291. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "604588c8-18b3-5a1d-b1d3-576fbff9dbef",
      "item_text": "Fonte histórica: Educação.pdf, p.1, 2025-06-25; conteúdo sem validação independente. Adoção digital crescente e desigual no quadro: muitas escolas investem, mas a maturidade não é uniforme. A presença digital ajuda a apresentar a instituição e captar interessados, sem demonstrar por si só qualidade pedagógica ou capacidade de agência de uma escola.",
      "notes": "Acervo do titular: Educação.pdf, p.1, 2025-06-25; recorte: Colégios (Fundamental/Médio); SHA-256 PDF: fb9403295b3428205f0fd128ce0c7cf4f4fb83e2437faade03e1ebfcd05d1291. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "ee6966f2-a177-55e3-b75e-081dd3b5a64d",
      "item_text": "Fonte histórica: Educação.pdf, p.1, 2025-06-25; conteúdo sem validação independente. Hipótese estratégica: comunicar etapas, proposta pedagógica, rotina e estrutura comprovadas e facilitar contato e visita para famílias. Relacionar o trabalho ao calendário e à capacidade de matrícula reais, respeitando diferenças de porte. Não inferir segurança, desempenho escolar, diferenciais ou disponibilidade de vagas a partir do perfil setorial.",
      "notes": "Acervo do titular: Educação.pdf, p.1, 2025-06-25; recorte: Colégios (Fundamental/Médio); SHA-256 PDF: fb9403295b3428205f0fd128ce0c7cf4f4fb83e2437faade03e1ebfcd05d1291. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "82bd24ff-c163-5e00-9e57-2dfebbdcc946",
      "item_text": "Fonte histórica: Educação.pdf, p.1, 2025-06-25; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro estima cerca de 6 milhões de pessoas por ano buscando cursos, ticket de R$200–600 e margem de 20–30%. O ano da demanda e a unidade temporal do ticket não são especificados. Redes e franquias tornam o mercado competitivo; continuidade do aprendizado sustenta relacionamentos mais longos, mas não comprova retenção de uma escola particular.",
      "notes": "Acervo do titular: Educação.pdf, p.1, 2025-06-25; recorte: Escolas de Idiomas; SHA-256 PDF: fb9403295b3428205f0fd128ce0c7cf4f4fb83e2437faade03e1ebfcd05d1291. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "88f98569-18c8-5359-a710-364c84e38785",
      "item_text": "Fonte histórica: Educação.pdf, p.1, 2025-06-25; conteúdo sem validação independente. Maturidade alta: redes e franquias já trabalham o digital e o autor destaca orçamento recorrente de divulgação. A classificação como segundo nicho mais atraente é julgamento comercial de 2025, não ranking atual nem garantia de verba para toda escola. A disputa envolve captação e diferenciação entre ofertas percebidas como semelhantes.",
      "notes": "Acervo do titular: Educação.pdf, p.1, 2025-06-25; recorte: Escolas de Idiomas; SHA-256 PDF: fb9403295b3428205f0fd128ce0c7cf4f4fb83e2437faade03e1ebfcd05d1291. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "4cfd6b6c-d2da-5b11-ba3e-b329b0b3bd9b",
      "item_text": "Fonte histórica: Educação.pdf, p.1, 2025-06-25; conteúdo sem validação independente. Hipótese estratégica: segmentar por objetivo de aprendizagem e público efetivamente atendido, esclarecer modalidade, método e percurso real e melhorar a passagem do interesse à conversa de matrícula. Qualificar independentes e franquias separadamente, considerando autonomia local de marketing. Método exclusivo, certificação, prazo de fluência, preços e resultados de alunos exigem prova; não presumir esses atributos.",
      "notes": "Acervo do titular: Educação.pdf, p.1, 2025-06-25; recorte: Escolas de Idiomas; SHA-256 PDF: fb9403295b3428205f0fd128ce0c7cf4f4fb83e2437faade03e1ebfcd05d1291. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "5a913add-ccf4-5944-b3f1-a0c9fd6eec02",
      "item_text": "Fonte histórica: Educação.pdf, p.1, 2025-06-25; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro descreve público diverso e demanda média, com caráter de nicho local, ticket de R$200–400 e margem de 15–25%. Não informa período próprio ou unidade temporal do ticket. Instrumentos e formatos de ensino segmentam o atendimento, mas não demonstram quais modalidades uma escola oferece.",
      "notes": "Acervo do titular: Educação.pdf, p.1, 2025-06-25; recorte: Escolas de Música; SHA-256 PDF: fb9403295b3428205f0fd128ce0c7cf4f4fb83e2437faade03e1ebfcd05d1291. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "9d9ba7f3-fe56-556a-a1aa-de344b05bfa3",
      "item_text": "Fonte histórica: Educação.pdf, p.1, 2025-06-25; conteúdo sem validação independente. Maturidade baixa/média, com exploração apenas parcial do digital. O autor propõe oportunidade de presença local; essa leitura histórica não comprova domínio de uma praça nem retorno de anúncios.",
      "notes": "Acervo do titular: Educação.pdf, p.1, 2025-06-25; recorte: Escolas de Música; SHA-256 PDF: fb9403295b3428205f0fd128ce0c7cf4f4fb83e2437faade03e1ebfcd05d1291. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "fa3b6785-2505-53c0-b7f4-ae016ce14df8",
      "item_text": "Fonte histórica: Educação.pdf, p.1, 2025-06-25; conteúdo sem validação independente. Hipótese estratégica: organizar instrumentos, modalidades, perfis de aluno e experiência dos professores confirmados, com apresentação de aulas e caminho simples para consulta. Avaliar descoberta local e conteúdo demonstrativo autorizado, dimensionando a proposta ao porte da escola. Aula experimental, equipamento, método e evolução musical só podem ser apresentados se forem reais e demonstráveis.",
      "notes": "Acervo do titular: Educação.pdf, p.1, 2025-06-25; recorte: Escolas de Música; SHA-256 PDF: fb9403295b3428205f0fd128ce0c7cf4f4fb83e2437faade03e1ebfcd05d1291. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "8246cbee-8e7e-5b36-8e14-fd5475b8330a",
      "item_text": "Fonte histórica: Educação.pdf, p.1, 2025-06-25; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro descreve demanda local média, ticket de R$150–300 e margem de 12–20%, sem período próprio ou unidade temporal definida. A alegação de baixa concorrência é uma observação histórica do autor, que não comprova escassez em uma cidade específica.",
      "notes": "Acervo do titular: Educação.pdf, p.1, 2025-06-25; recorte: Escolas de Natação; SHA-256 PDF: fb9403295b3428205f0fd128ce0c7cf4f4fb83e2437faade03e1ebfcd05d1291. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "7a673962-8245-586a-9d34-a662c923f4c7",
      "item_text": "Fonte histórica: Educação.pdf, p.1, 2025-06-25; conteúdo sem validação independente. Maturidade baixa/média: parte das escolas está começando no digital. O autor vê oportunidade em cidades médias, mas sua expectativa de retorno é hipótese de prospecção, dependente de concorrência, procura e capacidade locais.",
      "notes": "Acervo do titular: Educação.pdf, p.1, 2025-06-25; recorte: Escolas de Natação; SHA-256 PDF: fb9403295b3428205f0fd128ce0c7cf4f4fb83e2437faade03e1ebfcd05d1291. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "aa0f97bf-d4b3-5687-81fc-975316b1f1e0",
      "item_text": "Fonte histórica: Educação.pdf, p.1, 2025-06-25; conteúdo sem validação independente. Hipótese estratégica: começar por descoberta local e informação clara sobre turmas, públicos, horários e agendamento efetivamente disponíveis; avaliar campanhas locais conforme capacidade e procura. Diferenciar estrutura e professores apenas com confirmação. Não presumir piscina, acessibilidade, qualificação, segurança ou prometer desenvolvimento e resultados.",
      "notes": "Acervo do titular: Educação.pdf, p.1, 2025-06-25; recorte: Escolas de Natação; SHA-256 PDF: fb9403295b3428205f0fd128ce0c7cf4f4fb83e2437faade03e1ebfcd05d1291. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "1475d816-3e25-5e6f-861b-7f8f121f38c0",
      "item_text": "Fonte histórica: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro descreve aproximadamente 1,3 milhão de advogados e 72% em atuação individual, sem período próprio, em mercado fragmentado e competitivo. Relata muitos com renda inferior a R$6 mil/mês e 5% acima de R$26 mil, sem delimitar base/período dessa distribuição. Honorários e contratos recorrentes variam por especialidade; renda profissional não equivale a faturamento, lucro ou verba do escritório.",
      "notes": "Acervo do titular: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; recorte: Advogados; SHA-256 PDF: e1689e90ec84e6bc4715b94220ec6953bc8470496c244a2b6ebae7e8f3909472. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "ef076492-8b70-51a6-9d9e-677a277c55ed",
      "item_text": "Fonte histórica: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Maturidade heterogênea: LinkedIn, Instagram, artigos, e-books e newsletters apoiam reputação; grandes escritórios usam também blogs e vídeos, com equipe ou agência especializada. Pequenos têm orçamento restrito. O acervo menciona limites éticos da OAB, sem oferecer verificação normativa atual.",
      "notes": "Acervo do titular: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; recorte: Advogados; SHA-256 PDF: e1689e90ec84e6bc4715b94220ec6953bc8470496c244a2b6ebae7e8f3909472. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "01338f0a-d5a6-5c4d-95b0-2f21481164ae",
      "item_text": "Fonte histórica: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Hipótese estratégica: comunicar atuação comprovada e informação institucional/educativa, reforçando reputação e relacionamento dentro das regras aplicáveis verificadas para o caso. Qualificar porte, especialidade e recursos antes de propor apoio externo. Não prometer êxito, atribuir casos/autoridade ao cliente ou tomar os limites citados em 2025 como parecer jurídico atualizado.",
      "notes": "Acervo do titular: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; recorte: Advogados; SHA-256 PDF: e1689e90ec84e6bc4715b94220ec6953bc8470496c244a2b6ebae7e8f3909472. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "04a159b8-8b90-51e7-8c63-53b8aafd4373",
      "item_text": "Fonte histórica: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro cita cerca de 212 mil profissionais registrados no CAU e 64% autônomos, sem período próprio; associa a procura à construção e a vendas imobiliárias com alta de 15% em 2024. Honorários de 3–5% do custo da obra ilustram R$13,5 mil em uma obra de R$450 mil; interiores aparecem em R$5–10 mil. A referência de metade com renda até três salários mínimos mostra heterogeneidade e não fixa renda nem orçamento de um escritório.",
      "notes": "Acervo do titular: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; recorte: Arquitetos; SHA-256 PDF: e1689e90ec84e6bc4715b94220ec6953bc8470496c244a2b6ebae7e8f3909472. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "3da66b63-d2f1-5037-a7bf-2f66ac82977d",
      "item_text": "Fonte histórica: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Maturidade moderada/alta em portfólio: Instagram, Pinterest, sites, fotos, tours virtuais e busca local/Google Ads. Pequenos dependem do orgânico e têm verba limitada; escritórios estabelecidos e premium podem ter maior abertura a agência. O percentual de 90% pesquisando online no texto não tem base/período próprios e não comprova conversão.",
      "notes": "Acervo do titular: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; recorte: Arquitetos; SHA-256 PDF: e1689e90ec84e6bc4715b94220ec6953bc8470496c244a2b6ebae7e8f3909472. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "e05c9adc-dee2-55dd-8a2a-56d6cb4d86a3",
      "item_text": "Fonte histórica: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Hipótese estratégica: organizar portfólio autorizado, autoria, processo de projeto e especialização comprovada, conectando inspiração à consulta/orçamento. Qualificar porte, projetos e capacidade antes da mídia. Honorários exemplificados são receita de projeto, não lucro; não presumir execução de obra, serviços, prazos ou resultados de valorização.",
      "notes": "Acervo do titular: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; recorte: Arquitetos; SHA-256 PDF: e1689e90ec84e6bc4715b94220ec6953bc8470496c244a2b6ebae7e8f3909472. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "7b02351b-ffa2-5500-8deb-f8bdafa00103",
      "item_text": "Fonte histórica: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro registra cerca de 17 mil assessores em 2021, triplicação em quatro anos e aproximadamente 1.100 escritórios, sem período próprio para esta contagem. Descreve remuneração anual de 0,6–1,5% do patrimônio assessorado: a conta de R$50 milhões sob assessoria a 1,5% gera R$750 mil/ano de comissões brutas, não lucro do escritório nem rendimento do investidor. Relacionamento de longo prazo e clientes de maior patrimônio sustentam valor por cliente.",
      "notes": "Acervo do titular: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; recorte: Escritórios de Investimento; SHA-256 PDF: e1689e90ec84e6bc4715b94220ec6953bc8470496c244a2b6ebae7e8f3909472. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "75b4325a-6867-56f0-bcb1-112a4fb1a5aa",
      "item_text": "Fonte histórica: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Maturidade alta e em evolução: equipes internas, conteúdo educativo, LinkedIn, inbound e eventos online apoiam aquisição além da cidade. O quadro vê espaço para parceiros especializados em estratégia e captação qualificada, sem demonstrar abertura ou verba de qualquer escritório individual.",
      "notes": "Acervo do titular: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; recorte: Escritórios de Investimento; SHA-256 PDF: e1689e90ec84e6bc4715b94220ec6953bc8470496c244a2b6ebae7e8f3909472. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "a26b4925-f602-5fe7-ab31-fe2dd09b5dc6",
      "item_text": "Fonte histórica: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Hipótese estratégica: apresentar escopo real de assessoria e público atendido, desenvolver conteúdo educativo verificável e qualificar interessados pelo serviço e relacionamento, sem recomendar investimentos nesta pesquisa. Diferenciar atendimento e especialização comprovados, considerando equipe interna e decisões de contratação. Não prometer rentabilidade, atribuir patrimônio sob assessoria ao cliente ou tratar comissão bruta como lucro.",
      "notes": "Acervo do titular: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; recorte: Escritórios de Investimento; SHA-256 PDF: e1689e90ec84e6bc4715b94220ec6953bc8470496c244a2b6ebae7e8f3909472. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "503525fb-86c5-544c-8274-5b6d4fd3a53c",
      "item_text": "Fonte histórica: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro cita aproximadamente 71,6 mil escritórios e cerca de 20 mil fechamentos em 2023, sugerindo consolidação, ao lado de relatos de crescimento de 15–30% ao ano sem série uniforme. Honorários mensais por cliente de R$667 em pequenas empresas e R$1.427 nas maiores ilustram receita recorrente. A conta de R$800 × 12 meses × 13 anos resulta em cerca de R$124 mil de receita bruta ao longo de um relacionamento hipotético: não é lucro nem retenção comprovada de um escritório.",
      "notes": "Acervo do titular: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; recorte: Contadores; SHA-256 PDF: e1689e90ec84e6bc4715b94220ec6953bc8470496c244a2b6ebae7e8f3909472. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "9916cd34-0b6a-514f-a378-bbcf5a4a034f",
      "item_text": "Fonte histórica: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Maturidade moderada e desigual: o quadro menciona 53% sem estratégia, 65% no Instagram e 55% no WhatsApp, sem base/período próprios. Escritórios digitais e inovadores diferem dos tradicionais; concorrência online e franquias pressionam posicionamento. Parte dos pequenos prefere fazer internamente ou tem verba limitada.",
      "notes": "Acervo do titular: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; recorte: Contadores; SHA-256 PDF: e1689e90ec84e6bc4715b94220ec6953bc8470496c244a2b6ebae7e8f3909472. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "20cc1990-888b-510b-b8a1-24bbd7a49515",
      "item_text": "Fonte histórica: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Hipótese estratégica: segmentar empresas atendidas e problemas contábeis reais, combinar conteúdo técnico e relacionamento com captação recorrente e destacar escopo/atendimento comprovados. Qualificar carteira, capacidade e receita recorrente antes de dimensionar serviços. Não prometer economia tributária, usar o exemplo de valor vitalício como receita certa nem atribuir especialização ou retenção ao cliente.",
      "notes": "Acervo do titular: Serviços Profissionais Consultoria.pdf, p.1, 2025-06-26; recorte: Contadores; SHA-256 PDF: e1689e90ec84e6bc4715b94220ec6953bc8470496c244a2b6ebae7e8f3909472. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "2bc86bb4-cc27-52d4-8986-cd6ee8663220",
      "item_text": "Fonte histórica: Imobiliário Construção.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro registra alta de 5,8% no faturamento da indústria em 2024 e de 5,5% na produção de insumos, após quedas anteriores. Descreve mercado dominado por grandes fabricantes/distribuidores, venda em lotes e contratos corporativos elevados, com margem líquida estimada de 5–15%. Ganho de participação e volume têm mais peso que margem unitária; esse recorte industrial não é varejo local.",
      "notes": "Acervo do titular: Imobiliário Construção.pdf, p.1, 2025-06-26; recorte: Material de Construção (Indústria); SHA-256 PDF: 50f43b99ce6bc66d38dc2107de569eae3d20166af246c71772379dc2f2855941. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "95399b11-c468-5984-a808-529c795299c0",
      "item_text": "Fonte histórica: Imobiliário Construção.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Maturidade moderada, voltada a marca e B2B: campanhas institucionais, conteúdo técnico, programas digitais de fidelidade, redes sociais e YouTube para demonstrar produtos. O contato com consumidor final costuma passar pelo varejo. Grandes decisões são centralizadas e parcerias duradouras; negócios menores têm presença discreta.",
      "notes": "Acervo do titular: Imobiliário Construção.pdf, p.1, 2025-06-26; recorte: Material de Construção (Indústria); SHA-256 PDF: 50f43b99ce6bc66d38dc2107de569eae3d20166af246c71772379dc2f2855941. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "10138ce1-9317-52ef-8a06-0ec7b560ff84",
      "item_text": "Fonte histórica: Imobiliário Construção.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Hipótese estratégica: apoiar especificação técnica, demonstração de aplicações e relacionamento com canais/profissionais, conforme produtos e públicos reais. Qualificar decisores, parceiros existentes e ciclo de contratação antes de oferecer serviços de agência local. Não presumir fabricação, distribuição, certificação ou capacidade; a categoria cadastrada permanece sem alteração.",
      "notes": "Acervo do titular: Imobiliário Construção.pdf, p.1, 2025-06-26; recorte: Material de Construção (Indústria); SHA-256 PDF: 50f43b99ce6bc66d38dc2107de569eae3d20166af246c71772379dc2f2855941. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "f3c78e34-25db-5975-a4f8-505cd2b1d24f",
      "item_text": "Fonte histórica: Educação.pdf, p.1, 2025-06-25; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro de ensino superior privado descreve demanda de milhões de alunos, tickets de R$800–2.500, excluindo medicina dessa referência, e margem líquida de 10–20%. Ciclos de ingresso e continuidade do aluno dão escala e recorrência ao modelo. Não há período próprio ou unidade temporal explícita para os tickets; não devem ser usados como mensalidade atual comprovada.",
      "notes": "Acervo do titular: Educação.pdf, p.1, 2025-06-25; recorte: Faculdades Privadas; SHA-256 PDF: fb9403295b3428205f0fd128ce0c7cf4f4fb83e2437faade03e1ebfcd05d1291. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "421653da-eb41-5b3d-a0f1-c7b6cf7b616a",
      "item_text": "Fonte histórica: Educação.pdf, p.1, 2025-06-25; conteúdo sem validação independente. Maturidade muito alta: inbound, anúncios e CRM já fazem parte da captação. A posição de destaque no ranking comercial do autor decorre de volume, recorrência e cultura de investimento; é opinião de prospecção do acervo, não comprovação de verba disponível em cada instituição.",
      "notes": "Acervo do titular: Educação.pdf, p.1, 2025-06-25; recorte: Faculdades Privadas; SHA-256 PDF: fb9403295b3428205f0fd128ce0c7cf4f4fb83e2437faade03e1ebfcd05d1291. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "678c635e-c322-5d4c-a6dc-e6ce1aa3587b",
      "item_text": "Fonte histórica: Educação.pdf, p.1, 2025-06-25; conteúdo sem validação independente. Hipótese estratégica: apoiar captação por curso e calendário de ingresso, integrar informação institucional e atendimento aos interessados e diferenciar proposta acadêmica comprovada. Qualificar decisores, capacidade comercial e investimento existente antes de oferecer serviços. Cursos, reconhecimento, condições de ingresso e resultados profissionais precisam de confirmação; não prometer matrícula ou empregabilidade.",
      "notes": "Acervo do titular: Educação.pdf, p.1, 2025-06-25; recorte: Faculdades Privadas; SHA-256 PDF: fb9403295b3428205f0fd128ce0c7cf4f4fb83e2437faade03e1ebfcd05d1291. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "503af7d4-dae3-5ce6-a060-83a5c3f70698",
      "item_text": "Fonte histórica: Saúde e Bem-estar.pdf, p.1, 2025-06-25; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro cita cerca de 92 mil farmácias e R$199 bilhões de mercado, sem ano individualizado; crescimento de 8–11% ao ano também não vem acompanhado de série. Ticket de R$50–100 e margem líquida de 2–5% nas redes ou 5–10% nas independentes evidenciam dependência de volume. O mix de cosméticos pode ampliar margem, sem representar o resultado de toda loja.",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Farmácia; SHA-256 PDF: 56b892758bf9c02a22c2ae47223bffe9b41e5300b35a75224b77ea07046751d3. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "1460e065-474c-5ec1-949b-010f592269f0",
      "item_text": "Fonte histórica: Saúde e Bem-estar.pdf, p.1, 2025-06-25; conteúdo sem validação independente. Maturidade desigual: redes têm canais digitais avançados, enquanto independentes usam Google Maps e posts básicos, com pouca mídia; delivery e aplicativos aparecem em estágio inicial nessas operações. Essa diferença afeta orçamento e prontidão para terceirizar marketing.",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Farmácia; SHA-256 PDF: 56b892758bf9c02a22c2ae47223bffe9b41e5300b35a75224b77ea07046751d3. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "1490907c-e4e1-54a7-8885-ece3f60897ce",
      "item_text": "Fonte histórica: Saúde e Bem-estar.pdf, p.1, 2025-06-25; conteúdo sem validação independente. Hipótese estratégica: trabalhar localização, horários, contato e conveniência real nas independentes e campanhas de mix/fidelização quando houver estrutura. Qualificar escala e margem antes de propor aquisição paga; entrega, disponibilidade e produtos precisam ser confirmados. Não presumir serviços clínicos nem comunicar eficácia de medicamentos a partir desta pesquisa setorial.",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Farmácia; SHA-256 PDF: 56b892758bf9c02a22c2ae47223bffe9b41e5300b35a75224b77ea07046751d3. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "22d76f1a-16ef-53a6-a3bf-0ecccba322fb",
      "item_text": "Fonte histórica: Saúde e Bem-estar.pdf, p.1, 2025-06-25; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro relaciona demanda ao envelhecimento e à reabilitação após a Covid e cita cerca de 240 mil profissionais, sem período próprio para essa contagem. Referências: R$100 por sessão ou R$300 por plano mensal, faturamento de R$10–20 mil/mês em pequenas clínicas e margem de 20–30%. A frequência do tratamento pode gerar continuidade, mas operação pequena limita verba absoluta.",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Fisioterapia; SHA-256 PDF: 56b892758bf9c02a22c2ae47223bffe9b41e5300b35a75224b77ea07046751d3. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "8bf00175-960c-5751-8a4f-7366a999bb89",
      "item_text": "Fonte histórica: Saúde e Bem-estar.pdf, p.1, 2025-06-25; conteúdo sem validação independente. Maturidade baixa/moderada: indicações e parcerias têm peso, redes sociais são mais informativas e poucos negócios investem em anúncios. A oportunidade descrita está na profissionalização gradual da descoberta local, sem supor que todas as clínicas já possuam estrutura comercial.",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Fisioterapia; SHA-256 PDF: 56b892758bf9c02a22c2ae47223bffe9b41e5300b35a75224b77ea07046751d3. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "1b51a5fe-d317-552c-8654-2322308d95fc",
      "item_text": "Fonte histórica: Saúde e Bem-estar.pdf, p.1, 2025-06-25; conteúdo sem validação independente. Hipótese estratégica: apresentar abordagens, equipe e percurso de atendimento confirmados; fortalecer busca local e relacionamento com parceiros e facilitar avaliação/agendamento. Ajustar a proposta à capacidade e ao orçamento da clínica, podendo começar por presença básica antes de mídia. Planos e continuidade devem refletir oferta real; não prometer recuperação ou atribuir especialidades ao cliente.",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Fisioterapia; SHA-256 PDF: 56b892758bf9c02a22c2ae47223bffe9b41e5300b35a75224b77ea07046751d3. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "c4708b98-5166-547b-858f-a70ca5b1eeb7",
      "item_text": "Fonte histórica: Saúde e Bem-estar.pdf, p.1, 2025-06-25; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro descreve procura de adultos jovens, combos de R$3–5 mil, insumos caros e recorrência potencial de reaplicação semestral. Esses valores e frequência são referências comerciais do acervo, não indicação clínica nem calendário individual. Botox figura como procedimento contextual da harmonização; maior ticket não assegura margem alta após insumos.",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Harmonização Facial; SHA-256 PDF: 56b892758bf9c02a22c2ae47223bffe9b41e5300b35a75224b77ea07046751d3. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "1ee13249-c813-5ebe-907d-d0221bdd2747",
      "item_text": "Fonte histórica: Saúde e Bem-estar.pdf, p.1, 2025-06-25; conteúdo sem validação independente. Maturidade muito alta no quadro, com Instagram, vídeos virais, fotos e anúncios segmentados. A concorrência por conteúdo é descrita como intensa, exigindo renovação criativa; essa avaliação de 2025 não comprova saturação atual de uma praça.",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Harmonização Facial; SHA-256 PDF: 56b892758bf9c02a22c2ae47223bffe9b41e5300b35a75224b77ea07046751d3. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "5cd64430-8f50-5f50-bd99-69dc32f9880d",
      "item_text": "Fonte histórica: Saúde e Bem-estar.pdf, p.1, 2025-06-25; conteúdo sem validação independente. Hipótese estratégica: diferenciar atendimento, qualificação e processo de avaliação comprovados, organizar informação sobre procedimentos realmente oferecidos e acompanhar contatos com clareza. Renovação de conteúdo pode apoiar aquisição e relacionamento, com autorização de imagens e verificação das regras aplicáveis. Não prometer resultados, presumir habilitação ou converter referência de reaplicação em recomendação ao paciente.",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Harmonização Facial; SHA-256 PDF: 56b892758bf9c02a22c2ae47223bffe9b41e5300b35a75224b77ea07046751d3. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "0934b6d1-b60d-52dc-ba90-333b691a9f94",
      "item_text": "Fonte histórica: Saúde e Bem-estar.pdf, p.1, 2025-06-25; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro aponta aproximadamente 7.500 hospitais, dos quais 63% privados, sem ano individualizado para essas contagens. Descreve receitas mensais na casa dos milhões em operações de porte, mas margem líquida de 5–10%, pressionada por custos elevados. Volume de atendimento e serviços especializados sustentam modelos distintos; receita alta não significa folga financeira proporcional.",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Hospitais; SHA-256 PDF: 56b892758bf9c02a22c2ae47223bffe9b41e5300b35a75224b77ea07046751d3. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "cdba7b91-3d42-5cf7-8f36-e8e9616e950a",
      "item_text": "Fonte histórica: Saúde e Bem-estar.pdf, p.1, 2025-06-25; conteúdo sem validação independente. Maturidade média no quadro; hospitais grandes já contam com marketing estruturado, voltado a reputação, marca e facilitação de agendamento. O documento diferencia essa estrutura das operações menores e não demonstra abertura generalizada à contratação de agência externa.",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Hospitais; SHA-256 PDF: 56b892758bf9c02a22c2ae47223bffe9b41e5300b35a75224b77ea07046751d3. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "7da3bfbc-ab4c-52d9-bdcd-8fc7e454a0a6",
      "item_text": "Fonte histórica: Saúde e Bem-estar.pdf, p.1, 2025-06-25; conteúdo sem validação independente. Hipótese estratégica: qualificar governança, decisores e serviços efetivamente disponíveis antes de oferecer apoio especializado a reputação, informação institucional e acesso ao atendimento. A diferenciação pode explorar estrutura e linhas assistenciais comprovadas, com conteúdo verificável e fluxos claros de contato. Não inferir acreditação, desfechos, disponibilidade ou capacidade de investimento a partir do porte setorial.",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Hospitais; SHA-256 PDF: 56b892758bf9c02a22c2ae47223bffe9b41e5300b35a75224b77ea07046751d3. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "70b558c9-f80f-570e-9249-080f7498b2a9",
      "item_text": "Fonte histórica: Hotelaria e Turismo.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro cita cerca de 10,6 mil hotéis e mercado brasileiro de US$8,6 bilhões em 2023. RevPAR teria subido 40% em 2023 frente a 2022; é receita por quarto disponível, distinta de ocupação ou diária média. A diária de R$390 refere-se a 2023 e varia por categoria. GOP de aproximadamente 37% da receita em 2022 é resultado operacional bruto, não margem líquida. A faixa operacional de 30–40% e a previsão de alta de 27% em investimentos, sem horizonte explícito, são referências do acervo, sem comprovação para um hotel específico.",
      "notes": "Acervo do titular: Hotelaria e Turismo.pdf, p.1, 2025-06-26; recorte: Hotéis (Hotelaria); SHA-256 PDF: 25a0041b2f0ce6848cbcd950f26a94025c0fcbe0b0845cccfad160f0035f7817. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "0d77c61d-a9ad-591e-b9ff-1fb8e4175060",
      "item_text": "Fonte histórica: Hotelaria e Turismo.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Maturidade moderada e heterogênea: redes maiores já exploram IA; pequenos hotéis ainda digitalizam. Booking e outras OTAs, site próprio, SEO/SEM/Google, redes e e-mail compõem a distribuição. A indicação de marketing em torno de 4–5% ou mais da receita nas operações médias/grandes é histórica e não prova orçamento individual. Reservas diretas e dependência de intermediários têm custos diferentes.",
      "notes": "Acervo do titular: Hotelaria e Turismo.pdf, p.1, 2025-06-26; recorte: Hotéis (Hotelaria); SHA-256 PDF: 25a0041b2f0ce6848cbcd950f26a94025c0fcbe0b0845cccfad160f0035f7817. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "59929fbb-3a71-5f7f-b48c-35987fc0f6be",
      "item_text": "Fonte histórica: Hotelaria e Turismo.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Hipótese estratégica: qualificar categoria, sazonalidade, canais e capacidade; melhorar apresentação e conversão do canal direto, relacionamento e distribuição para reduzir dependência de comissões quando isso for viável. Diferenciar localização, estrutura e experiência comprovadas, respeitando autonomia e parceiros de redes versus independentes. Não presumir ocupação, tarifa, verba, comodidades ou economia garantida com reservas diretas.",
      "notes": "Acervo do titular: Hotelaria e Turismo.pdf, p.1, 2025-06-26; recorte: Hotéis (Hotelaria); SHA-256 PDF: 25a0041b2f0ce6848cbcd950f26a94025c0fcbe0b0845cccfad160f0035f7817. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "3cf945f3-f03c-53d8-bde4-4d9cdd4e025b",
      "item_text": "Fonte histórica: Imobiliário Construção.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro estima 70 mil imobiliárias e crescimento de vendas de 20–30% ao ano em 2023–24. Comissão de aproximadamente 5% ilustra R$30 mil em imóvel de R$600 mil; não é lucro líquido. Margem líquida de 10–20% vem acompanhada de casos de 16% em vendas e 21% em locação, sem generalização possível. Crédito, concorrência e diferenças entre venda e locação condicionam a operação.",
      "notes": "Acervo do titular: Imobiliário Construção.pdf, p.1, 2025-06-26; recorte: Imobiliárias; SHA-256 PDF: 50f43b99ce6bc66d38dc2107de569eae3d20166af246c71772379dc2f2855941. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "53601b45-4ffa-503c-9d1b-255784f1efe2",
      "item_text": "Fonte histórica: Imobiliário Construção.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Maturidade moderada/crescente: portais, redes sociais e Google/Meta Ads, com lacunas em análise de dados e organização comercial. O quadro cita 34% buscando em redes/portais, sem base/período próprios. Imobiliárias já organizadas e que pagam portais são alvo comercial mais plausível que presumir verba em todas as operações locais.",
      "notes": "Acervo do titular: Imobiliário Construção.pdf, p.1, 2025-06-26; recorte: Imobiliárias; SHA-256 PDF: 50f43b99ce6bc66d38dc2107de569eae3d20166af246c71772379dc2f2855941. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "0bb532b6-88a0-572c-a87c-e46fcdf75bc7",
      "item_text": "Fonte histórica: Imobiliário Construção.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Hipótese estratégica: conectar portfólio autorizado, busca local, anúncios e atendimento com acompanhamento de contatos e leitura de resultados. Diferenciar especialização territorial, tipo de imóvel e serviço comprovados. Qualificar venda versus locação, estrutura e investimento existente; não inferir estoque, disponibilidade, financiamento ou orçamento a partir de comissão por venda.",
      "notes": "Acervo do titular: Imobiliário Construção.pdf, p.1, 2025-06-26; recorte: Imobiliárias; SHA-256 PDF: 50f43b99ce6bc66d38dc2107de569eae3d20166af246c71772379dc2f2855941. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "5feb7257-970a-5001-adf6-1c9f270f4996",
      "item_text": "Fonte histórica: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro de julho de 2025 cita ticket de R$500 a R$10.000 ou mais, margem líquida de 20–40% e crescimento de 5%, sem período próprio ou método da taxa. Valor elevado por venda e posicionamento de luxo exigem confiança e apresentação; não demonstram que todo varejista opere no mesmo padrão.",
      "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Joalheria; SHA-256 PDF: d2942178024ac97569ac4ab912e3dc06c3ee05260499dc02a2eb797a1ef58f97. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "680e6f62-ce2e-503b-938a-bf44a0bdcada",
      "item_text": "Fonte histórica: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; conteúdo sem validação independente. Maturidade alta em marca/luxo e abertura alta a agência no quadro. A conclusão prioriza produção visual e profissionalização, sem individualizar canais ou comprovar verba e equipe de uma joalheria.",
      "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Joalheria; SHA-256 PDF: d2942178024ac97569ac4ab912e3dc06c3ee05260499dc02a2eb797a1ef58f97. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "4e01c64b-3448-5a9c-8b45-c0d892a72afb",
      "item_text": "Fonte histórica: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; conteúdo sem validação independente. Hipótese estratégica: apresentar peças, materiais e história comprovados com imagens autorizadas e atendimento compatível com o posicionamento, apoiando consulta e relacionamento. Qualificar público, mix e processo de venda antes de campanhas. Autenticidade, certificação, exclusividade, procedência, estoque e garantia exigem prova específica; não presumir luxo ou alto orçamento.",
      "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Joalheria; SHA-256 PDF: d2942178024ac97569ac4ab912e3dc06c3ee05260499dc02a2eb797a1ef58f97. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "4eae0e9f-4381-5111-b4a5-37cfd9252efc",
      "item_text": "Fonte histórica: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro de julho de 2025 descreve mercado estável, ticket de R$300–800 e margem líquida de 15–25%, sem período próprio ou método. A conclusão considera o nicho menos imediato para agência e condiciona viabilidade a volume ou serviço agregado; isso não comprova que uma loja ofereça instalação ou atendimento emergencial.",
      "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Bateria de Carro; SHA-256 PDF: d2942178024ac97569ac4ab912e3dc06c3ee05260499dc02a2eb797a1ef58f97. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "de34caf0-437b-5f50-968d-4ce044e55d97",
      "item_text": "Fonte histórica: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; conteúdo sem validação independente. Maturidade baixa/média e abertura crescente a agência no quadro. Não são detalhados canais já utilizados, portanto descoberta local e busca por necessidade são possibilidades estratégicas, não fatos sobre adoção da loja.",
      "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Bateria de Carro; SHA-256 PDF: d2942178024ac97569ac4ab912e3dc06c3ee05260499dc02a2eb797a1ef58f97. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "7d65c29f-0039-54e0-99b8-33f94f268516",
      "item_text": "Fonte histórica: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; conteúdo sem validação independente. Hipótese estratégica: facilitar consulta de compatibilidade, localização e orçamento, qualificando volume e serviços efetivamente oferecidos antes de propor aquisição paga. Diferenciar conveniência, disponibilidade e atendimento somente com confirmação. Não presumir estoque, entrega, instalação, assistência 24 horas ou garantias; margem histórica não assegura verba.",
      "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Bateria de Carro; SHA-256 PDF: d2942178024ac97569ac4ab912e3dc06c3ee05260499dc02a2eb797a1ef58f97. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "2963b3d2-8ab7-5f49-ab7c-350869d45949",
      "item_text": "Fonte histórica: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro de julho de 2025 cita ticket de R$80–300, margem líquida de 10–25% e crescimento de 2,6%, sem período próprio ou método da taxa. A conclusão descreve potencial por volume e margem, acompanhado de forte competição. Mix, faixa de preço e frequência variam entre lojas.",
      "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Loja de Sapatos; SHA-256 PDF: d2942178024ac97569ac4ab912e3dc06c3ee05260499dc02a2eb797a1ef58f97. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "45900b9c-b332-5793-a45c-6e571a81a5c3",
      "item_text": "Fonte histórica: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; conteúdo sem validação independente. Maturidade média, com orientação visual/social, e abertura média a agência. O acervo não individualiza plataformas nem comprova que uma loja já possua venda digital; competição exige qualificação do posicionamento e da operação.",
      "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Loja de Sapatos; SHA-256 PDF: d2942178024ac97569ac4ab912e3dc06c3ee05260499dc02a2eb797a1ef58f97. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "67a50833-26a6-566e-b5b5-b491c1ef8285",
      "item_text": "Fonte histórica: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; conteúdo sem validação independente. Hipótese estratégica: apresentar modelos, ocasiões e numeração disponíveis com conteúdo visual real, conectando consulta à compra conforme canais existentes. Diferenciar curadoria e atendimento comprovados e dimensionar mídia pela economia do mix. Conforto, procedência, troca, entrega e estoque precisam de informação específica; não prometer benefício ou supor marca.",
      "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Loja de Sapatos; SHA-256 PDF: d2942178024ac97569ac4ab912e3dc06c3ee05260499dc02a2eb797a1ef58f97. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "df7c5ac7-1634-5374-a4ce-3fb670f19f14",
      "item_text": "Fonte histórica: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro de julho de 2025 apresenta ticket de R$100–300, margem líquida de 10–20% e crescimento de 3–5%, sem período próprio ou método da taxa. A conclusão descreve setor tradicional e competitivo; composição do mix e valor por compra importam para a viabilidade comercial.",
      "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Cama, Mesa e Banho; SHA-256 PDF: d2942178024ac97569ac4ab912e3dc06c3ee05260499dc02a2eb797a1ef58f97. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "e8336bc1-539f-5844-bdb2-8582bbeb93af",
      "item_text": "Fonte histórica: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; conteúdo sem validação independente. Maturidade e abertura a agência médias/altas no quadro. A avaliação de abertura não demonstra venda online, plataformas utilizadas ou verba de cada loja; o acervo não individualiza canais.",
      "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Cama, Mesa e Banho; SHA-256 PDF: d2942178024ac97569ac4ab912e3dc06c3ee05260499dc02a2eb797a1ef58f97. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "86f50cfa-9cc0-5161-8b3c-b900481c294d",
      "item_text": "Fonte histórica: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; conteúdo sem validação independente. Hipótese estratégica: apresentar linhas, composição, medidas e combinações reais, apoiando comparação e compra conforme canais disponíveis; avaliar comunicação visual e relacionamento diante da competição. Diferenciar curadoria e atendimento comprovados. Não presumir qualidade superior, material, procedência, entrega, estoque ou descontos; dimensionar campanhas pelo mix e margem efetivos.",
      "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Cama, Mesa e Banho; SHA-256 PDF: d2942178024ac97569ac4ab912e3dc06c3ee05260499dc02a2eb797a1ef58f97. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "b9ca4acd-d2f8-5a4f-8830-19aafb355842",
      "item_text": "Fonte histórica: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro de julho de 2025 indica ticket de R$800–3.000, margem líquida de 10–25% e crescimento de 5,1%, sem período próprio ou método da taxa. Ticket maior favorece análise por valor de venda, mas a afirmação de que poucos leads pagariam a campanha é hipótese comercial do autor, não resultado demonstrado.",
      "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Loja de Colchão; SHA-256 PDF: d2942178024ac97569ac4ab912e3dc06c3ee05260499dc02a2eb797a1ef58f97. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "a3119aca-e185-5cf4-8ed4-21b757519efe",
      "item_text": "Fonte histórica: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; conteúdo sem validação independente. Maturidade média/alta, orientada à geração de contatos, e boa abertura a agência. A conclusão destaca campanhas locais; não informa plataformas específicas nem prova estrutura comercial ou verba de uma loja.",
      "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Loja de Colchão; SHA-256 PDF: d2942178024ac97569ac4ab912e3dc06c3ee05260499dc02a2eb797a1ef58f97. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "d90856fb-62aa-52f9-9c51-92a9cdc87d01",
      "item_text": "Fonte histórica: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; conteúdo sem validação independente. Hipótese estratégica: apoiar comparação de medidas, materiais e condições verificadas, facilitar visita/orçamento e acompanhar interessados, qualificando conversão e margem antes de mídia. Diferenciar atendimento e oferta comprovados. Não presumir benefícios de saúde, certificação, testes, garantia, entrega ou estoque, nem assegurar retorno pelo ticket.",
      "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Loja de Colchão; SHA-256 PDF: d2942178024ac97569ac4ab912e3dc06c3ee05260499dc02a2eb797a1ef58f97. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "ed3e06ca-6814-5584-b774-3416c7f76fde",
      "item_text": "Fonte histórica: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro cita mercado de R$124 bilhões em 2021, crescimento de maquiagem de 26% em 2024 e projeção de cerca de 5% ao ano até 2026, sem comprovação de realização. Ticket de R$100 ou mais e margem líquida de 15–25% variam por produto e marca. Novidades, identidade de marca e integração de compras físicas/online dão contexto comercial ao varejo de beleza.",
      "notes": "Acervo do titular: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; recorte: Maquiagem/Perfumaria; SHA-256 PDF: 8d36e0640c8776d403e1c8bf58971633c10090ead76cb4ebf4a170b6d26d1dc0. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "cb5bda02-187a-54a9-a974-f2fef245b4d3",
      "item_text": "Fonte histórica: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Maturidade alta: branding, influenciadores e canais online/offline integrados são centrais. A conclusão vê abertura a redes sociais, e-commerce e fidelização, com renovação criativa frequente; trata-se de avaliação setorial histórica, não comprovação de verba de uma loja.",
      "notes": "Acervo do titular: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; recorte: Maquiagem/Perfumaria; SHA-256 PDF: 8d36e0640c8776d403e1c8bf58971633c10090ead76cb4ebf4a170b6d26d1dc0. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "fd50bea3-d979-56fb-b266-19426c155af6",
      "item_text": "Fonte histórica: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Hipótese estratégica: combinar apresentação de produtos reais, experiência e relacionamento, avaliando influenciadores locais e fidelização conforme operação/público. Diferenciar curadoria, procedência e atendimento comprovados. Não presumir marcas, autenticidade, disponibilidade, aconselhamento especializado ou benefícios de cosméticos; projeção setorial não é crescimento atual demonstrado.",
      "notes": "Acervo do titular: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; recorte: Maquiagem/Perfumaria; SHA-256 PDF: 8d36e0640c8776d403e1c8bf58971633c10090ead76cb4ebf4a170b6d26d1dc0. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "08ebb41d-49e4-5f88-90a0-d42cbbcbb4b1",
      "item_text": "Fonte histórica: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro situa iluminação como parte de materiais elétricos, sem estimativa própria de tamanho, e cita alta de cerca de 20% em volume em 2024. Ticket médio/alto varia muito por item, com margem líquida de 20–30% como referência. Mix e aplicação dos produtos diferenciam a compra, sem valor único por loja.",
      "notes": "Acervo do titular: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; recorte: Lojas de Iluminação; SHA-256 PDF: 8d36e0640c8776d403e1c8bf58971633c10090ead76cb4ebf4a170b6d26d1dc0. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "68b7f6f1-7f9c-5529-8865-94d693f5f39d",
      "item_text": "Fonte histórica: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Maturidade moderada e heterogênea, com presença online em crescimento. A conclusão aponta cultura tradicional e necessidade de educação em parte do setor; abertura à agência precisa ser verificada caso a caso.",
      "notes": "Acervo do titular: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; recorte: Lojas de Iluminação; SHA-256 PDF: 8d36e0640c8776d403e1c8bf58971633c10090ead76cb4ebf4a170b6d26d1dc0. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "d55f47bc-1508-5c10-b519-bb36bd555fbf",
      "item_text": "Fonte histórica: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Hipótese estratégica: apresentar aplicações, especificações e opções reais para apoiar comparação e consulta/orçamento, conectando descoberta digital à loja. Diferenciar atendimento técnico ou projeto apenas se oferecidos e comprovados. Confirmar compatibilidade, eficiência, estoque e instalação; não presumir serviços ou capacidade de investimento pela margem histórica.",
      "notes": "Acervo do titular: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; recorte: Lojas de Iluminação; SHA-256 PDF: 8d36e0640c8776d403e1c8bf58971633c10090ead76cb4ebf4a170b6d26d1dc0. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "9f71cca0-9866-599f-a4c1-c5d7a268657c",
      "item_text": "Fonte histórica: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro de julho de 2025 descreve mercado estável, ticket de R$250–800 e margem líquida de 8–15%. Não informa período próprio ou método dessas estimativas. Margem relativamente estreita, volume e possível recorrência condicionam a proposta comercial; venda de equipamentos não comprova prestação de assistência técnica.",
      "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Loja de Informática; SHA-256 PDF: d2942178024ac97569ac4ab912e3dc06c3ee05260499dc02a2eb797a1ef58f97. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "1fc509e3-6e73-59af-959e-52e9cf723324",
      "item_text": "Fonte histórica: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; conteúdo sem validação independente. Maturidade média, focada em busca, e abertura média a agência. A conclusão propõe oportunidade em cidades médias, sem prova de demanda local. O quadro não detalha plataformas; ações de busca são hipótese a testar, não canal já usado por uma loja particular.",
      "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Loja de Informática; SHA-256 PDF: d2942178024ac97569ac4ab912e3dc06c3ee05260499dc02a2eb797a1ef58f97. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "b718e3a2-268e-50e9-8fee-80224d460423",
      "item_text": "Fonte histórica: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; conteúdo sem validação independente. Hipótese estratégica: facilitar pesquisa, comparação e orçamento de produtos efetivos, avaliando descoberta local e busca por especificações. Qualificar mix, recorrência, volume e capacidade antes de mídia. Suporte, manutenção, instalação, compatibilidade e estoque dependem de confirmação; não assumir serviço agregado ou grande verba com base no ticket.",
      "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Loja de Informática; SHA-256 PDF: d2942178024ac97569ac4ab912e3dc06c3ee05260499dc02a2eb797a1ef58f97. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "c25c591a-1e54-5e78-96d8-f7f3db254f29",
      "item_text": "Fonte histórica: Imobiliário Construção.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro descreve cerca de 150 mil lojas e R$223 bilhões de faturamento em 2023, após retração, com retomada de 4–5% nas vendas em 2024. Reformas e obras sustentam demanda sensível a renda e crédito. Compras de R$100–500 podem alcançar milhares em obras maiores; margem líquida média de 15%, faixa de 10–17%, exige volume. Receita nacional não demonstra rentabilidade de uma loja.",
      "notes": "Acervo do titular: Imobiliário Construção.pdf, p.1, 2025-06-26; recorte: Lojas de Material (Varejo); SHA-256 PDF: 50f43b99ce6bc66d38dc2107de569eae3d20166af246c71772379dc2f2855941. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "5ebedfe9-45ca-5bde-9465-205c96e6ee4e",
      "item_text": "Fonte histórica: Imobiliário Construção.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Maturidade baixa/emergente entre lojas pequenas e médias: Facebook/Instagram, WhatsApp, Google Meu Negócio, marketplaces e anúncios regionais começam a ser usados. Redes grandes já têm e-commerce e marketing forte. A conclusão sugere educação e demonstração de valor nas operações locais, em vez de prontidão uniforme para agência.",
      "notes": "Acervo do titular: Imobiliário Construção.pdf, p.1, 2025-06-26; recorte: Lojas de Material (Varejo); SHA-256 PDF: 50f43b99ce6bc66d38dc2107de569eae3d20166af246c71772379dc2f2855941. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "d43c27d9-3134-557e-98d4-9e9e6ac308b7",
      "item_text": "Fonte histórica: Imobiliário Construção.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Hipótese estratégica: facilitar descoberta local, consulta de mix/orçamento e relacionamento com compradores de reformas e obras quando efetivamente atendidos. Diferenciar conveniência, entrega e atendimento comprovados e propor passos compatíveis com volume/margem. Não presumir estoque, preço, crédito, logística ou verba; separar loja varejista da fabricação industrial.",
      "notes": "Acervo do titular: Imobiliário Construção.pdf, p.1, 2025-06-26; recorte: Lojas de Material (Varejo); SHA-256 PDF: 50f43b99ce6bc66d38dc2107de569eae3d20166af246c71772379dc2f2855941. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "d8719718-c92d-51ca-abfe-699ca2595d54",
      "item_text": "Fonte histórica: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro estima R$100 bilhões de mercado em 2022 e crescimento de 4–5% em 2024. Ticket é descrito apenas como centenas de reais, com margem líquida de 15–20%. A compra de móveis de varejo permanece ligada à loja física e é distinta de projetos planejados sob medida; valores variam conforme o mix.",
      "notes": "Acervo do titular: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; recorte: Lojas de Móveis; SHA-256 PDF: 8d36e0640c8776d403e1c8bf58971633c10090ead76cb4ebf4a170b6d26d1dc0. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "f45dc329-ad61-5df4-81dc-1979eb249d33",
      "item_text": "Fonte histórica: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Maturidade moderada, com início de migração para e-commerce e dependência da visita física. A conclusão aponta necessidade de educação digital em parte do setor, sem prontidão uniforme para contratar agência.",
      "notes": "Acervo do titular: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; recorte: Lojas de Móveis; SHA-256 PDF: 8d36e0640c8776d403e1c8bf58971633c10090ead76cb4ebf4a170b6d26d1dc0. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "abb26317-5464-5d3d-a724-4628e3dfa276",
      "item_text": "Fonte histórica: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Hipótese estratégica: apoiar pesquisa prévia e visita com catálogo, medidas e informações verificadas, reduzindo dúvidas antes do orçamento/compra. Avaliar canais de venda e descoberta local conforme estrutura e logística. Entrega, montagem, estoque, materiais e condições precisam de confirmação; não presumir capacidade de e-commerce ou atribuir a economia de móveis planejados à loja genérica.",
      "notes": "Acervo do titular: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; recorte: Lojas de Móveis; SHA-256 PDF: 8d36e0640c8776d403e1c8bf58971633c10090ead76cb4ebf4a170b6d26d1dc0. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "98d48695-a648-518e-8d94-bfe6ac461b9c",
      "item_text": "Fonte histórica: Veículos e Transportes.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro cita cerca de 56 milhões de pneus/ano em 2022 e mercado maduro/estável com revendas e redes. Volume é central e o exemplo de grupo que planejava 10 milhões de pneus e R$5 bilhões anuais é projeção de empresa, não resultado do setor nem de uma loja. O preço de um jogo consta como 'R$1–3 mi', unidade inconsistente: preservado como lacuna, sem corrigir por inferência para mil ou milhão. Não há margem percentual segura.",
      "notes": "Acervo do titular: Veículos e Transportes.pdf, p.1, 2025-06-26; recorte: Lojas de pneus; SHA-256 PDF: dde9d34ab21dd2bd00d9e60259bb1e1fdd1b5fc8796699e8f3c2059f5a63e4d6. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "af371107-844e-5ba3-a5eb-3435bb3043af",
      "item_text": "Fonte histórica: Veículos e Transportes.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Maturidade alta nas redes, com e-commerce e anúncios intensivos; o acervo cita Pneu Store/Cantu como exemplo histórico. Pequenas lojas usam redes e SEO local. A prontidão comercial das redes difere de uma revenda pequena, mesmo num setor com grande volume.",
      "notes": "Acervo do titular: Veículos e Transportes.pdf, p.1, 2025-06-26; recorte: Lojas de pneus; SHA-256 PDF: dde9d34ab21dd2bd00d9e60259bb1e1fdd1b5fc8796699e8f3c2059f5a63e4d6. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "7adef79d-ab90-5afb-8e77-8a4abec63f13",
      "item_text": "Fonte histórica: Veículos e Transportes.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Hipótese estratégica: facilitar procura por especificação e orçamento, conectar descoberta local aos serviços reais e diferenciar atendimento comprovado; qualificar volume, mix e estrutura antes de dimensionar mídia. Compatibilidade, instalação, estoque e garantia dependem de confirmação. Não usar a unidade de preço inconsistente nem a projeção corporativa como ticket ou capacidade do cliente.",
      "notes": "Acervo do titular: Veículos e Transportes.pdf, p.1, 2025-06-26; recorte: Lojas de pneus; SHA-256 PDF: dde9d34ab21dd2bd00d9e60259bb1e1fdd1b5fc8796699e8f3c2059f5a63e4d6. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "0a7d00ef-b642-5778-b947-546f41f8aebe",
      "item_text": "Fonte histórica: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro cita mercado de R$265,8 bilhões em 2022, crescimento de aproximadamente 5% ao ano em 2023–24 e ticket de R$100–150. A faixa de 20–50% aparece na coluna de margem líquida, mas o próprio texto a chama de bruta; portanto, a natureza da margem é inconsistente e não permite conclusão de lucro líquido. Competição, variedade e renovação de oferta distinguem o varejo de moda.",
      "notes": "Acervo do titular: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; recorte: Lojas de Roupa; SHA-256 PDF: 8d36e0640c8776d403e1c8bf58971633c10090ead76cb4ebf4a170b6d26d1dc0. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "c1264783-a6d5-5b94-8525-079428375c8f",
      "item_text": "Fonte histórica: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Maturidade moderada/alta, com forte presença visual em redes sociais. A conclusão identifica pequenas lojas sem estratégia estruturada e possibilidades de venda integrada entre canais, anúncios segmentados e marketplaces, sem afirmar que toda loja já os utiliza ou dispõe de verba.",
      "notes": "Acervo do titular: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; recorte: Lojas de Roupa; SHA-256 PDF: 8d36e0640c8776d403e1c8bf58971633c10090ead76cb4ebf4a170b6d26d1dc0. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "a6b8ccd0-aab2-531a-bf64-39a03d695ad3",
      "item_text": "Fonte histórica: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Hipótese estratégica: organizar coleção, disponibilidade e público reais, conectar conteúdo visual a consulta/compra e avaliar integração entre loja e canais digitais conforme a operação. Diferenciar estilo, curadoria e atendimento comprovados. Qualificar capacidade e margem antes de dimensionar mídia; não presumir estoque, numeração, entrega, exclusividade ou lucro.",
      "notes": "Acervo do titular: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; recorte: Lojas de Roupa; SHA-256 PDF: 8d36e0640c8776d403e1c8bf58971633c10090ead76cb4ebf4a170b6d26d1dc0. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "e1f7a14c-8b5b-514f-92bf-e06e731a4673",
      "item_text": "Fonte histórica: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro de julho de 2025 cita ticket de R$30–70, margem líquida de 6–12% e crescimento de 3–5%, sem período próprio ou método. Baixo valor por compra e margem estreita tornam volume e mix relevantes. A conclusão condiciona viabilidade de agência a muito volume ou serviço agregado, sem comprovar essas condições numa loja.",
      "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Utilidades do Lar; SHA-256 PDF: d2942178024ac97569ac4ab912e3dc06c3ee05260499dc02a2eb797a1ef58f97. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "1f913f93-b53a-5948-bf92-9594d3832e61",
      "item_text": "Fonte histórica: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; conteúdo sem validação independente. Maturidade e abertura a agência baixas/médias. O quadro não detalha canais utilizados; pode haver necessidade de educação e passos básicos antes de campanhas mais caras, hipótese comercial derivada da combinação de maturidade e economia.",
      "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Utilidades do Lar; SHA-256 PDF: d2942178024ac97569ac4ab912e3dc06c3ee05260499dc02a2eb797a1ef58f97. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "32334a44-b3c0-5241-beda-d271f58776b6",
      "item_text": "Fonte histórica: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; conteúdo sem validação independente. Hipótese estratégica: organizar categorias, usos e conveniência reais, facilitar descoberta/localização e avaliar relacionamento para frequência conforme operação. Qualificar volume e capacidade de atendimento antes da mídia. Não presumir entrega, estoque, preço baixo, variedade ilimitada ou serviços; a proposta precisa caber na economia real da loja.",
      "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Utilidades do Lar; SHA-256 PDF: d2942178024ac97569ac4ab912e3dc06c3ee05260499dc02a2eb797a1ef58f97. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "ba14f325-72e7-52b8-9834-336289b2497b",
      "item_text": "Fonte histórica: Hotelaria e Turismo.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro descreve cerca de 5 mil motéis, R$4 bilhões anuais e 100 milhões de atendimentos/ano, sem períodos próprios. Modernização e reposicionamento de marca aparecem como tendências históricas para atrair novos públicos. Ticket de cerca de R$40, acima de R$100 no alto padrão, e margem de 20–40% em operações bem geridas dependem de rotatividade; o texto não esclarece uniformemente a natureza líquida dessa margem.",
      "notes": "Acervo do titular: Hotelaria e Turismo.pdf, p.1, 2025-06-26; recorte: Motéis (Motelaria); SHA-256 PDF: 25a0041b2f0ce6848cbcd950f26a94025c0fcbe0b0845cccfad160f0035f7817. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "111d05bf-3686-5ba0-95d5-08aa648bde4f",
      "item_text": "Fonte histórica: Hotelaria e Turismo.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Maturidade baixa/média: Instagram/Facebook, Guia de Motéis, Google local, parcerias, promoções e CRM começam a profissionalizar divulgação e relacionamento. O autor vê um setor menos atendido por agências e interesse crescente, sem comprovar contratação ou verba em qualquer operação.",
      "notes": "Acervo do titular: Hotelaria e Turismo.pdf, p.1, 2025-06-26; recorte: Motéis (Motelaria); SHA-256 PDF: 25a0041b2f0ce6848cbcd950f26a94025c0fcbe0b0845cccfad160f0035f7817. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "ee8d9587-66cd-5da2-8925-9bfe75dc15f6",
      "item_text": "Fonte histórica: Hotelaria e Turismo.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Hipótese estratégica: trabalhar descoberta local, informação de suítes/condições reais e posicionamento de experiência comprovado, com discrição no relacionamento. Qualificar padrão, rotatividade, horários e capacidade antes de definir campanhas. Não presumir público, privacidade operacional, comodidades ou promoções; reposicionamento setorial não demonstra atributos do cliente.",
      "notes": "Acervo do titular: Hotelaria e Turismo.pdf, p.1, 2025-06-26; recorte: Motéis (Motelaria); SHA-256 PDF: 25a0041b2f0ce6848cbcd950f26a94025c0fcbe0b0845cccfad160f0035f7817. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "8165cc17-9ca9-57a0-b67b-c2fbe085bd0b",
      "item_text": "Fonte histórica: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro descreve projetos sob medida de ticket muito alto, sem valor monetário único, como parcela do setor de móveis. Cita crescimento histórico de 7–10% ao ano, sem série definida, e previsão futura de cerca de 5%, sem horizonte explícito. Margem líquida estimada de 15–25% é referência, não lucro assegurado por projeto. A decisão envolve pesquisa e orçamento, com maior valor por venda.",
      "notes": "Acervo do titular: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; recorte: Móveis Planejados; SHA-256 PDF: 8d36e0640c8776d403e1c8bf58971633c10090ead76cb4ebf4a170b6d26d1dc0. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "09b5deb7-c73b-552a-a065-0df6c1e13e91",
      "item_text": "Fonte histórica: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Maturidade moderada: anúncios e redes sociais geram contatos; a conclusão cita Google, Instagram e blogs de decoração, com lacunas de exploração digital entre concorrentes. A expectativa de que uma venda cubra marketing é hipótese do autor, dependente de custos e conversão reais.",
      "notes": "Acervo do titular: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; recorte: Móveis Planejados; SHA-256 PDF: 8d36e0640c8776d403e1c8bf58971633c10090ead76cb4ebf4a170b6d26d1dc0. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "825e2ea0-4af9-5f23-9c02-a7c9373daa74",
      "item_text": "Fonte histórica: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Hipótese estratégica: usar portfólio autorizado, aplicações e processo de projeto para qualificar interessados e facilitar orçamento, distinguindo inspiração de intenção real de compra. Confirmar capacidade de projeto/execução e acompanhar contatos antes de ampliar mídia. Personalização, materiais, prazos e garantias precisam ser comprovados; não garantir retorno pela existência de ticket alto.",
      "notes": "Acervo do titular: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; recorte: Móveis Planejados; SHA-256 PDF: 8d36e0640c8776d403e1c8bf58971633c10090ead76cb4ebf4a170b6d26d1dc0. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "a3bd497a-c4e6-51c2-b553-8eb13543bd41",
      "item_text": "Fonte histórica: Saúde e Bem-estar.pdf, p.1, 2025-06-25; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro associa a procura à prevenção e ao público fitness e descreve cerca de 200 mil profissionais, com aumento de 22% em três anos; o fim dessa janela não é informado. Aponta consultas de R$100–300 e pacotes mensais que elevam o valor por cliente. Consultório próprio teria custo operacional baixo e margem alta, mas volume modesto: boa margem percentual não equivale a grande faturamento ou orçamento para agência.",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Nutricionistas; SHA-256 PDF: 56b892758bf9c02a22c2ae47223bffe9b41e5300b35a75224b77ea07046751d3. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "30baaa22-03fd-51d2-ba4a-1990e2098604",
      "item_text": "Fonte histórica: Saúde e Bem-estar.pdf, p.1, 2025-06-25; conteúdo sem validação independente. Maturidade moderada no quadro: Instagram orgânico e conteúdo educativo predominam, com pouco investimento em anúncios. Existem agências especializadas, mas o orçamento descrito é inferior ao de clínicas maiores. O relacionamento recorrente e o formato de acompanhamento ajudam a distinguir a venda de uma consulta isolada.",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Nutricionistas; SHA-256 PDF: 56b892758bf9c02a22c2ae47223bffe9b41e5300b35a75224b77ea07046751d3. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "2dcebcb6-9213-5bd4-9c39-76e7231f5f5a",
      "item_text": "Fonte histórica: Saúde e Bem-estar.pdf, p.1, 2025-06-25; conteúdo sem validação independente. Hipótese estratégica: organizar a comunicação em torno de acompanhamento e pacotes realmente oferecidos, explicando duração, atendimento e continuidade; combinar conteúdo educativo com descoberta local e conversão para consulta. Qualificar capacidade, receita recorrente e verba antes de propor mídia, em vez de presumir que a margem permita um contrato alto. Especialidade, credenciais, oferta e resultados pertencem ao cliente e precisam de confirmação; não prometer emagrecimento ou benefício clínico.",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Nutricionistas; SHA-256 PDF: 56b892758bf9c02a22c2ae47223bffe9b41e5300b35a75224b77ea07046751d3. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "6689b9f8-24e2-531f-9164-1c6888b58beb",
      "item_text": "Fonte histórica: Saúde e Bem-estar.pdf, p.1, 2025-06-25; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro cita mais de 400 mil dentistas e mercado de R$38 bilhões/ano, sem período específico dessas medidas; menciona crescimento de 13% ao ano na estética sem fixar a série. Tratamentos podem superar R$1 mil; clínicas aparecem com R$20–100 mil/mês de receita e margem líquida de 20–30%. Implantes e facetas são exemplos de serviços de maior valor, não categorias novas nem oferta presumida de todo consultório.",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Odontologia; SHA-256 PDF: 56b892758bf9c02a22c2ae47223bffe9b41e5300b35a75224b77ea07046751d3. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "372bdf78-2113-52ca-8289-6d5470ea82bb",
      "item_text": "Fonte histórica: Saúde e Bem-estar.pdf, p.1, 2025-06-25; conteúdo sem validação independente. Maturidade muito alta: anúncios para implantes e facetas, conteúdo social e muitas agências especializadas. A competição por tratamentos de maior ticket exige diferenciação e qualidade no atendimento aos interessados, em vez de pressupor que mais leads resolvam toda a operação.",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Odontologia; SHA-256 PDF: 56b892758bf9c02a22c2ae47223bffe9b41e5300b35a75224b77ea07046751d3. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "e8713c60-5ce0-5955-aad3-254b4f90b9fb",
      "item_text": "Fonte histórica: Saúde e Bem-estar.pdf, p.1, 2025-06-25; conteúdo sem validação independente. Hipótese estratégica: qualificar mix de serviços, capacidade, atendimento aos contatos e posicionamento antes da mídia; organizar conteúdo informativo e caminho para avaliação. Apresentar equipe, estrutura e especialidades comprovadas, evitando promessas de resultado e uso não autorizado de imagens. Ticket setorial não comprova faturamento, verba ou realização de qualquer procedimento pelo cliente.",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Odontologia; SHA-256 PDF: 56b892758bf9c02a22c2ae47223bffe9b41e5300b35a75224b77ea07046751d3. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "b0724fb5-d94d-562a-9b6c-f5911ae94203",
      "item_text": "Fonte histórica: Veículos e Transportes.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro estima aproximadamente 121 mil oficinas no Brasil, predominantemente pequenas, e R$128 bilhões anuais em gastos de manutenção, sem período próprio para essas medidas. Ticket médio de R$570 por atendimento e margem líquida de 5–10% mostram que volume e múltiplos serviços ao longo da vida do veículo importam. O tamanho nacional do mercado não demonstra faturamento nem verba de uma oficina.",
      "notes": "Acervo do titular: Veículos e Transportes.pdf, p.1, 2025-06-26; recorte: Oficinas mecânicas; SHA-256 PDF: dde9d34ab21dd2bd00d9e60259bb1e1fdd1b5fc8796699e8f3c2059f5a63e4d6. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "f5080911-1037-5a66-a525-59628cd57241",
      "item_text": "Fonte histórica: Veículos e Transportes.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Maturidade baixa: Google Meu Negócio e redes sociais aparecem, mas investimento formal em anúncios e SEO é limitado. A conclusão situa oficinas entre negócios menores, com restrição de orçamento e menor prontidão para agência que concessionárias/redes, apesar da oportunidade de profissionalização.",
      "notes": "Acervo do titular: Veículos e Transportes.pdf, p.1, 2025-06-26; recorte: Oficinas mecânicas; SHA-256 PDF: dde9d34ab21dd2bd00d9e60259bb1e1fdd1b5fc8796699e8f3c2059f5a63e4d6. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "5c2f7566-2a04-5fb1-baa2-c6797cf62b1a",
      "item_text": "Fonte histórica: Veículos e Transportes.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Hipótese estratégica: fortalecer descoberta local e informação sobre serviços reais, facilitar consulta/agendamento e relacionamento para manutenção recorrente, com ações focalizadas compatíveis com margem e capacidade. Diferenciar especialização, equipe e atendimento comprovados. Não presumir diagnóstico, marcas atendidas, certificação, prazos ou garantia; avaliar retorno com dados reais, sem prometer resultado.",
      "notes": "Acervo do titular: Veículos e Transportes.pdf, p.1, 2025-06-26; recorte: Oficinas mecânicas; SHA-256 PDF: dde9d34ab21dd2bd00d9e60259bb1e1fdd1b5fc8796699e8f3c2059f5a63e4d6. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "ed0d73fa-81ae-5ee2-b031-bacf04672f3d",
      "item_text": "Fonte histórica: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro de julho de 2025 indica ticket de R$300–800, margem líquida de 12–20% e crescimento de 8%, sem período próprio ou método para a taxa. A conclusão associa o nicho a recorrência e necessidade de diferenciação, sem comprovar frequência de recompra ou resultado atual de uma ótica.",
      "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Óticas; SHA-256 PDF: d2942178024ac97569ac4ab912e3dc06c3ee05260499dc02a2eb797a1ef58f97. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "142d35f8-07fa-5dd0-908e-561b9db35fad",
      "item_text": "Fonte histórica: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; conteúdo sem validação independente. Maturidade média/alta e abertura média/alta a agência no quadro; o autor considera que o setor já reconhece valor no digital. São avaliações qualitativas históricas, sem canais específicos detalhados nem prontidão demonstrada de uma loja.",
      "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Óticas; SHA-256 PDF: d2942178024ac97569ac4ab912e3dc06c3ee05260499dc02a2eb797a1ef58f97. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "9408d795-fabf-581d-bfa9-abc24ee231d4",
      "item_text": "Fonte histórica: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; conteúdo sem validação independente. Hipótese estratégica: diferenciar opções e atendimento comprovados, organizar informação sobre produtos e facilitar consulta/localização, avaliando ações digitais conforme público e operação. Qualificar mix e recorrência antes de dimensionar campanha. Não presumir exames, diagnóstico, profissionais de saúde, marcas, certificação ou benefícios clínicos; atributos pertencem ao cliente.",
      "notes": "Acervo do titular: Varejo e Comércio Local 2.pdf, p.1, 2025-07-03; recorte: Óticas; SHA-256 PDF: d2942178024ac97569ac4ab912e3dc06c3ee05260499dc02a2eb797a1ef58f97. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "3e338aaa-2c70-54af-8144-b6281f745bb0",
      "item_text": "Fonte histórica: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro cita aproximadamente 70 mil padarias, R$153 bilhões de faturamento em 2024 e 1 milhão de empregos, este sem período próprio. Registra alta de 10,9% na receita de 2024; a indicação de 17% de novas aberturas em 2025 não esclarece se é parcial ou projeção anual. Compras básicas de poucos reais coexistem com lanches/cafés de R$20 ou mais. Margem líquida de 5–12%, podendo chegar a 15%, reforça dependência de frequência e mix.",
      "notes": "Acervo do titular: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; recorte: Padarias; SHA-256 PDF: aee99dbe347f7111f2cd54ca5cc1c85f61fdd0128ac43a3e92e9d9096f195c7a. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "486ee5bd-32f3-5779-915a-ff0a13f6a7de",
      "item_text": "Fonte histórica: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Maturidade moderada: adoção de redes e aplicativos ainda em aprendizado. O documento diferencia microoperações familiares com pouca verba de padarias médias que competem com cafeterias e minimercados. Essa diferença orienta a qualificação comercial; não prova orçamento de um estabelecimento.",
      "notes": "Acervo do titular: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; recorte: Padarias; SHA-256 PDF: aee99dbe347f7111f2cd54ca5cc1c85f61fdd0128ac43a3e92e9d9096f195c7a. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "a8398363-fca7-5b3f-97fc-c0f21acd43b4",
      "item_text": "Fonte histórica: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Hipótese estratégica: trabalhar frequência, conveniência local e mix real, distinguindo compra cotidiana, lanches e encomendas quando existentes. Informar horários e produtos confirmados e testar comunicação compatível com volume e margem. Produção própria, frescor, entrega ou variedade só podem ser diferenciais com evidência; a expansão histórica não assegura demanda atual na praça.",
      "notes": "Acervo do titular: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; recorte: Padarias; SHA-256 PDF: aee99dbe347f7111f2cd54ca5cc1c85f61fdd0128ac43a3e92e9d9096f195c7a. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "5d7c11cf-b4d6-5a06-b9af-1f4ed2722362",
      "item_text": "Fonte histórica: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro cita R$75,4 bilhões de mercado em 2024 e crescimento de cerca de 10% nesse ano. Ticket de R$80–150 por visita, compras recorrentes e margem líquida de 10–15% ressaltam volume e lealdade, sem equivaler ao resultado de uma loja. Concorrência com grandes redes torna diferenciação local relevante.",
      "notes": "Acervo do titular: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; recorte: Pet Shops; SHA-256 PDF: 8d36e0640c8776d403e1c8bf58971633c10090ead76cb4ebf4a170b6d26d1dc0. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "70bfb81d-df2e-5bea-8d87-3bea080cc0dd",
      "item_text": "Fonte histórica: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Maturidade moderada: engajamento orgânico forte, com e-commerce e anúncios segmentados em adoção. A conclusão vê maior possibilidade comercial em pet shops médios que buscam competir com redes, com conteúdo e relacionamento de comunidade; não presume verba para todas as operações.",
      "notes": "Acervo do titular: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; recorte: Pet Shops; SHA-256 PDF: 8d36e0640c8776d403e1c8bf58971633c10090ead76cb4ebf4a170b6d26d1dc0. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "977f35da-8346-5643-b47f-64f2feb3db3e",
      "item_text": "Fonte histórica: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Hipótese estratégica: organizar produtos/serviços confirmados, facilitar recompra e relacionamento e diferenciar conveniência e atendimento comprovados. Avaliar conteúdo de comunidade, fidelização e canais digitais segundo capacidade e frequência real. Não inferir atendimento veterinário, saúde animal, entrega, assinatura ou mix; ticket recorrente não garante retorno de agência.",
      "notes": "Acervo do titular: Varejo e Comércio Local 1.pdf, p.1, 2025-06-26; recorte: Pet Shops; SHA-256 PDF: 8d36e0640c8776d403e1c8bf58971633c10090ead76cb4ebf4a170b6d26d1dc0. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "b171c9eb-c897-505d-880f-d5564f41854f",
      "item_text": "Fonte histórica: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro registra cerca de 300 mil estabelecimentos, faturamento setorial de R$416 bilhões em 2023 e aproximadamente 4,94 milhões de empregos, sem período próprio para a contagem de empregos. A alta de 3,3% para 2024 aparece como projeção, não resultado confirmado. Ticket em torno de R$20 por cliente varia com o tipo de negócio; margem de 5–10% e operações no equilíbrio mostram que movimento e receita não equivalem a grande lucro. Consumo no salão, delivery e recompra têm economias diferentes.",
      "notes": "Acervo do titular: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; recorte: Restaurantes/Bares; SHA-256 PDF: aee99dbe347f7111f2cd54ca5cc1c85f61fdd0128ac43a3e92e9d9096f195c7a. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "c9a5c432-6d12-551e-985b-a4a844af5fcf",
      "item_text": "Fonte histórica: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Adoção alta no quadro; o percentual de 46% que priorizaria marketing não tem base e período individualizados. Redes sociais, aplicativos de entrega e fidelização coexistem; a conclusão cita Google, Instagram, TikTok, fotos/vídeos de pratos, indicação e influenciadores gastronômicos. Visibilidade local e relacionamento ajudam a preencher mesas e gerar recorrência, sem retorno garantido.",
      "notes": "Acervo do titular: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; recorte: Restaurantes/Bares; SHA-256 PDF: aee99dbe347f7111f2cd54ca5cc1c85f61fdd0128ac43a3e92e9d9096f195c7a. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "7cab6fa4-48a8-5b19-ba39-d47a7696c799",
      "item_text": "Fonte histórica: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Hipótese estratégica: separar objetivos de ocupação em horários ociosos, pedidos por delivery e recompra; combinar descoberta local, apresentação real de pratos e experiência e relacionamento/fidelização quando disponíveis. Qualificar margem, capacidade, reputação e estrutura comercial antes de propor mídia, sobretudo entre operações médias/maiores. Cozinha, cardápio, entrega, promoções e diferenciais são fatos do cliente a confirmar; não presumir verba pela receita setorial.",
      "notes": "Acervo do titular: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; recorte: Restaurantes/Bares; SHA-256 PDF: aee99dbe347f7111f2cd54ca5cc1c85f61fdd0128ac43a3e92e9d9096f195c7a. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "18a445ed-6740-500f-bd3f-935615bf7273",
      "item_text": "Fonte histórica: Saúde e Bem-estar.pdf, p.1, 2025-06-25; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro situa os salões em um universo de aproximadamente 1,33 milhão de negócios de beleza, que não deve ser confundido com número exclusivo de salões. Indica ticket de cerca de R$90, acima de R$200 no premium, e margem de 10–20%. É um mercado pulverizado, dependente de volume, recorrência e recuperação de consumo; pequenos salões e redes têm capacidade comercial diferente.",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Salão de Beleza; SHA-256 PDF: 56b892758bf9c02a22c2ae47223bffe9b41e5300b35a75224b77ea07046751d3. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "a931b530-f0cf-5c95-a7f3-4be4cc41fca3",
      "item_text": "Fonte histórica: Saúde e Bem-estar.pdf, p.1, 2025-06-25; conteúdo sem validação independente. Maturidade moderada: Instagram como portfólio, WhatsApp para relacionamento e retenção e uso limitado de mídia paga entre pequenos negócios. Franquias investem mais. A visibilidade do trabalho e a agenda são centrais, mas o acervo não comprova ocupação nem orçamento de qualquer salão.",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Salão de Beleza; SHA-256 PDF: 56b892758bf9c02a22c2ae47223bffe9b41e5300b35a75224b77ea07046751d3. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "79957af5-74cc-5853-8e97-a3e31c6dba9a",
      "item_text": "Fonte histórica: Saúde e Bem-estar.pdf, p.1, 2025-06-25; conteúdo sem validação independente. Hipótese estratégica: conectar portfólio autorizado, serviços e preços confirmados ao agendamento e à recompra; diferenciar por equipe, experiência ou especialização demonstrável. Priorizar propostas compatíveis com capacidade e margem, qualificando redes e operações maiores separadamente do salão pequeno. Não atribuir técnica, prazo, resultado estético ou disponibilidade sem confirmação.",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Salão de Beleza; SHA-256 PDF: 56b892758bf9c02a22c2ae47223bffe9b41e5300b35a75224b77ea07046751d3. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "dfe01272-9435-5842-b07b-7a4f257c7b00",
      "item_text": "Fonte histórica: Saúde e Bem-estar.pdf, p.1, 2025-06-25; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro estima o mercado brasileiro em US$680 milhões e menciona crescimento global de 9% ao ano, sem informar períodos próprios; a taxa global não descreve o Brasil. O consumo é associado ao bem-estar e ao público A/B. Sessões ou pacotes são referidos em R$300–500, com margem de 15–25%; programas e assinaturas favorecem continuidade e experiências premium.",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Spa; SHA-256 PDF: 56b892758bf9c02a22c2ae47223bffe9b41e5300b35a75224b77ea07046751d3. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "30d08cf6-48ba-552e-801d-26a090b1039a",
      "item_text": "Fonte histórica: Saúde e Bem-estar.pdf, p.1, 2025-06-25; conteúdo sem validação independente. Maturidade moderada: Instagram, influenciadores e parcerias apoiam marca e experiência; spas de luxo investem mais. O documento distingue posicionamento premium de capacidade real de contratar marketing, que precisa ser apurada por operação.",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Spa; SHA-256 PDF: 56b892758bf9c02a22c2ae47223bffe9b41e5300b35a75224b77ea07046751d3. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "2018d2bc-fb9d-5ed3-95be-e5e842f83310",
      "item_text": "Fonte histórica: Saúde e Bem-estar.pdf, p.1, 2025-06-25; conteúdo sem validação independente. Hipótese estratégica: apresentar a experiência, os serviços e formatos de recorrência realmente oferecidos; usar conteúdo visual autorizado e parcerias compatíveis com o público. Diferenciar ambiente e atendimento comprovados, sem presumir luxo, assinatura ou benefícios de saúde. Qualificar capacidade de agenda e economia dos pacotes antes de definir investimento.",
      "notes": "Acervo do titular: Saúde e Bem-estar.pdf, p.1, 2025-06-25; recorte: Spa; SHA-256 PDF: 56b892758bf9c02a22c2ae47223bffe9b41e5300b35a75224b77ea07046751d3. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "2b3e3e1b-52a5-5b08-8000-fd0eab837e90",
      "item_text": "Fonte histórica: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Indicadores sem período próprio explicitado referem-se apenas ao quadro do acervo, não a estatísticas atuais comprovadas. O quadro cita aproximadamente 90 mil estabelecimentos, R$1 trilhão de faturamento em 2024, 3 milhões de empregos e participação de 9% no PIB, com período próprio não explicitado para as duas últimas medidas. Mercado maduro, com crescimento associado a PIB e inflação. Compras maiores acima de R$100 contrastam com conveniência de R$30–50; margens de 3–6% fazem volume e mix centrais.",
      "notes": "Acervo do titular: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; recorte: Supermercados; SHA-256 PDF: aee99dbe347f7111f2cd54ca5cc1c85f61fdd0128ac43a3e92e9d9096f195c7a. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "91fde768-6815-5be4-804d-e0f3d73be3de",
      "item_text": "Fonte histórica: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Maturidade baixa/média nas operações tradicionais, com WhatsApp, entrega e aplicativos em adoção desigual; grandes redes têm outra estrutura. A conclusão do autor sugere que apenas operações com escala podem comportar serviços mais robustos e muitas precisam de educação digital; não confirma orçamento mínimo para cada loja.",
      "notes": "Acervo do titular: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; recorte: Supermercados; SHA-256 PDF: aee99dbe347f7111f2cd54ca5cc1c85f61fdd0128ac43a3e92e9d9096f195c7a. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    },
    {
      "id": "85b09c2f-ec3d-5ab5-a639-e78ce2170174",
      "item_text": "Fonte histórica: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; conteúdo sem validação independente. Hipótese estratégica: relacionar comunicação de ofertas verificadas, conveniência e canais de compra a frequência e tamanho da cesta; priorizar mix e relacionamento quando houver capacidade. Qualificar volume, margem e operação antes da mídia. Estoque, preço, entrega, fidelização e abrangência são dados particulares a confirmar, sem inferir verba a partir do tamanho nacional do setor.",
      "notes": "Acervo do titular: Alimentação e Gastronomia.pdf, p.1, 2025-06-26; recorte: Supermercados; SHA-256 PDF: aee99dbe347f7111f2cd54ca5cc1c85f61fdd0128ac43a3e92e9d9096f195c7a. Correção editorial PB-A/E10.13 do conteúdo carregado no PR #1048. Descrição e indicadores históricos atribuídos ao acervo, sem validação independente; períodos não indicados não são inferidos. Avaliações de prontidão/rankings e projeções pertencem ao autor. Oportunidades são hipóteses estratégicas condicionais, não características de cliente; atualização factual cabe ao PB-B."
    }
  ]
}$payload$::jsonb;
 n integer;
begin
 if current_user <> 'postgres' then raise exception 'E10_13_EDITORIAL_ROLE'; end if;
 if jsonb_array_length(p->'before_items')<>243 or jsonb_array_length(p->'before_parents')<>60
  or jsonb_array_length(p->'changes')<>183 then raise exception 'E10_13_EDITORIAL_PAYLOAD_COUNT'; end if;
 if (select count(distinct x.id) from jsonb_to_recordset(p->'changes') x(id uuid))<>183
  or (select count(distinct x.id) from jsonb_to_recordset(p->'before_items') x(id uuid))<>243
  then raise exception 'E10_13_EDITORIAL_DUPLICATE'; end if;
 if exists (
  select 1 from jsonb_to_recordset(p->'changes') c(id uuid,item_text text,notes text)
  left join jsonb_populate_recordset(null::public.taxon_market_research_items,p->'before_items') b on b.id=c.id
  where b.id is null or b.item_key not in ('market_overview','digital_maturity','communication_opportunity')
   or nullif(btrim(c.item_text),'') is null or nullif(btrim(c.notes),'') is null
   or (c.item_text=b.item_text and c.notes is not distinct from b.notes)
 ) then raise exception 'E10_13_EDITORIAL_INVALID_CHANGE'; end if;
 if exists (
  select 1 from jsonb_populate_recordset(null::public.taxon_market_research,p->'before_parents') b
  left join public.taxon_market_research r on r.id=b.id
  where r.id is null or to_jsonb(r) is distinct from to_jsonb(b)
   or b.research_block<>'market_intelligence' or b.audience_scope<>'business_buyer'
   or b.version<>1 or b.status<>'active'
 ) then raise exception 'E10_13_EDITORIAL_PARENT_DRIFT'; end if;
 if exists (
  select 1 from jsonb_populate_recordset(null::public.taxon_market_research_items,p->'before_items') b
  left join public.taxon_market_research_items i on i.id=b.id
  where i.id is null or to_jsonb(i) is distinct from to_jsonb(b)
   or not exists (select 1 from jsonb_to_recordset(p->'before_parents') r(id uuid) where r.id=b.research_id)
 ) then raise exception 'E10_13_EDITORIAL_BEFORE_DRIFT'; end if;
 if (select md5(coalesce(string_agg((to_jsonb(t))::text,E'\n' order by t.id),'')) from public.business_taxons t where true) is distinct from p->'hashes'->>'taxons' then raise exception 'E10_13_EDITORIAL_TAXONS_DRIFT'; end if;
 if (select md5(coalesce(string_agg((to_jsonb(t))::text,E'\n' order by t.id),'')) from public.business_taxon_aliases t where true) is distinct from p->'hashes'->>'aliases' then raise exception 'E10_13_EDITORIAL_ALIASES_DRIFT'; end if;
 if (select md5(coalesce(string_agg((to_jsonb(t))::text,E'\n' order by t.id),'')) from public.taxon_market_research t where true) is distinct from p->'hashes'->>'parents' then raise exception 'E10_13_EDITORIAL_PARENTS_DRIFT'; end if;
 if (select md5(coalesce(string_agg((to_jsonb(t)-'item_text'-'notes')::text,E'\n' order by t.id),'')) from public.taxon_market_research_items t where true) is distinct from p->'hashes'->>'protected_items' then raise exception 'E10_13_EDITORIAL_PROTECTED_ITEMS_DRIFT'; end if;
 if (select md5(coalesce(string_agg((to_jsonb(t))::text,E'\n' order by t.id),'')) from public.taxon_market_research_items t where not exists (select 1 from jsonb_to_recordset(p->'changes') as c(id uuid) where c.id=t.id)) is distinct from p->'hashes'->>'untouched_items' then raise exception 'E10_13_EDITORIAL_UNTOUCHED_ITEMS_DRIFT'; end if;
 if (select md5(coalesce(string_agg((to_jsonb(t))::text,E'\n' order by t.id),'')) from public.taxon_market_research_items t where true) is distinct from p->'hashes'->>'items' then raise exception 'E10_13_EDITORIAL_ITEMS_DRIFT'; end if;
 update public.taxon_market_research_items i
 set item_text=c.item_text, notes=c.notes
 from jsonb_to_recordset(p->'changes') c(id uuid,item_text text,notes text)
 where i.id=c.id;
 get diagnostics n = row_count;
 if n<>183 then raise exception 'E10_13_EDITORIAL_UPDATE_COUNT: %',n; end if;
 if exists (
  select 1 from jsonb_to_recordset(p->'changes') c(id uuid,item_text text,notes text)
  left join public.taxon_market_research_items i on i.id=c.id
  where i.id is null or i.item_text is distinct from c.item_text or i.notes is distinct from c.notes
 ) then raise exception 'E10_13_EDITORIAL_AFTER_MISMATCH'; end if;
 if (select md5(coalesce(string_agg((to_jsonb(t))::text,E'\n' order by t.id),'')) from public.business_taxons t where true) is distinct from p->'hashes'->>'taxons' then raise exception 'E10_13_EDITORIAL_TAXONS_MUTATED'; end if;
 if (select md5(coalesce(string_agg((to_jsonb(t))::text,E'\n' order by t.id),'')) from public.business_taxon_aliases t where true) is distinct from p->'hashes'->>'aliases' then raise exception 'E10_13_EDITORIAL_ALIASES_MUTATED'; end if;
 if (select md5(coalesce(string_agg((to_jsonb(t))::text,E'\n' order by t.id),'')) from public.taxon_market_research t where true) is distinct from p->'hashes'->>'parents' then raise exception 'E10_13_EDITORIAL_PARENTS_MUTATED'; end if;
 if (select md5(coalesce(string_agg((to_jsonb(t)-'item_text'-'notes')::text,E'\n' order by t.id),'')) from public.taxon_market_research_items t where true) is distinct from p->'hashes'->>'protected_items' then raise exception 'E10_13_EDITORIAL_PROTECTED_ITEMS_MUTATED'; end if;
 if (select md5(coalesce(string_agg((to_jsonb(t))::text,E'\n' order by t.id),'')) from public.taxon_market_research_items t where not exists (select 1 from jsonb_to_recordset(p->'changes') as c(id uuid) where c.id=t.id)) is distinct from p->'hashes'->>'untouched_items' then raise exception 'E10_13_EDITORIAL_UNTOUCHED_ITEMS_MUTATED'; end if;
end
$editorial$;
select jsonb_build_object('updated_items',183,'reviewed_researches',60,
 'preserved_limitation_items',60,'preserved_legacy_items',379,
 'all_items',count(*),'after_items_md5',md5(string_agg(to_jsonb(i)::text,E'\n' order by i.id))) as editorial_receipt
from public.taxon_market_research_items i;
commit;
