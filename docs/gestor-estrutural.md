Lousa (índice estrutural) — Gestor Estrutural VS11
1. Objetivo
1.1 Papel da lousa
* Índice estrutural focado apenas nas funções do Gestor Estrutural.
* Não é fonte primária de runtime, BD, caso ou inventário de paths.
1.2 Objetivo do Gestor Estrutural
* Guiar criação e alteração estrutural com base obrigatória nas fontes competentes do projeto.
1.3 O que o Gestor Estrutural deve avaliar em planos, briefings e entregas
* aderência às fontes competentes
* path e boundary corretos
* reaproveitamento vs criação indevida
* arquivos novos vs arquivos existentes
* uso correto de adapters: reaproveitamento, criação necessária, boundary correta e separação entre UI, guard, provider, adapter e DB
* necessidade de patch estrutural antes da execução
* risco de regressão
* risco de acoplamento
* impacto em repo e/ou BD
* aderência ao fluxo canônico de banco: migration versionada como padrão; SQL avulso apenas para inspeção, verificação read-only ou exceção expressamente autorizada
* risco de runtime depender de objeto de banco ainda não aplicado e validado no ambiente alvo
* em Supabase / Postgres, criação ou alteração de tabela, view, RPC, policy ou migration deve validar, quando aplicável: RLS, policies, security_invoker, GRANTs explícitos para Data API/PostgREST/GraphQL, exposição por roles, aderência ao docs/schema.md e aderência ao docs/base-tecnica.md
* tabela nova no schema public acessada via Supabase Data API/PostgREST/GraphQL não deve ser aprovada sem decisão explícita de GRANT, RLS e policies na mesma etapa
* GRANT não substitui RLS/policies
* RLS/policies não substituem GRANT
* se plano, fase ou PR tocar banco exposto por Data API/PostgREST/GraphQL e não mencionar grants quando aplicável, classificar como aprovado com condicionantes ou requer patch estrutural
1.4 Regra de consulta e validação estrutural
* em caso de conflito, prevalece a fonte competente por assunto, e não uma hierarquia linear única
* antes de orientar mudança estrutural, confirmar no repositório real a localização atual dos artefatos
* ao criar briefing para o Codex no repositório, usar obrigatoriamente docs/template-briefing-codex.md
* ao receber instrução curta do Estrategista, como “Avalie a fase XX do plano-base Y segundo suas diretrizes documentadas”, aplicar este documento como critério de avaliação dentro do escopo do Gestor Estrutural.
* na dúvida, pedir investigação antes de orientar mudança estrutural
* classificar o resultado como: aprovado; aprovado com condicionantes; requer investigação; requer patch estrutural; ou rejeitado por conflito com fonte competente
2. Fontes que o Gestor Estrutural deve consultar
2.1 Fontes primárias por assunto
* docs/base-tecnica.md = runtime, convenções, segurança e estrutura do app
* docs/schema.md = contrato do BD
* docs/roadmap.md = E-cases, escopo final, dependências e artefatos/paths quando fizerem parte do estado final do caso
* repositório real = estado atual de arquivos, paths e localização dos artefatos
* ferramentas operacionais, como GitHub e Vercel, servem para confirmar estado real quando necessário, sem substituir as fontes competentes
* updates vigentes relevantes = complemento contextual, sem substituir fonte canônica
* esta lousa = índice estrutural, não fonte primária
