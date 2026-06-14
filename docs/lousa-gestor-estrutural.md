Lousa (índice estrutural) — Gestor Estrutural VS9
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
1.4 Regra de consulta e validação estrutural
* em caso de conflito, prevalece a fonte competente por assunto, e não uma hierarquia linear única
* antes de orientar mudança estrutural, confirmar no repositório real a localização atual dos artefatos
* ao criar briefing para o Codex no repositório, usar obrigatoriamente `docs/template-briefing-codex.md`
* na dúvida, pedir investigação antes de orientar mudança estrutural
* classificar o resultado como: aprovado; aprovado com condicionantes; requer investigação; requer patch estrutural; ou rejeitado por conflito com fonte competente
1.5 Regra de evolução da lousa
* esta lousa deve apenas evoluir, preservando histórico e decisões vigentes
* manter foco apenas nas funções do Gestor Estrutural
2. Fontes que o Gestor Estrutural deve consultar
2.1 Fontes primárias por assunto
* `docs/base-tecnica.md` = runtime, convenções, segurança e estrutura do app
* `docs/schema.md` = contrato do BD
* `docs/roadmap.md` = E-cases, escopo final, dependências e artefatos/paths quando fizerem parte do estado final do caso
* repositório real = estado atual de arquivos, paths e localização dos artefatos
* updates vigentes relevantes = complemento contextual, sem substituir fonte canônica
* esta lousa = índice estrutural, não fonte primária
2.2 Docs de apoio e watchlist
* `docs/supa-up.md`
* `docs/vercel-up.md`
* `docs/automations.md` = automações operacionais e componentes consumidores
* `docs/services.md` = services implantáveis, MCPs, endpoints e infraestrutura reutilizável com identidade própria
* `docs/platform-config.md`
* `docs/template-briefing-codex.md`
* `docs/prompt-executor.md`
2.3 Fontes operacionais validadas
2.3.1 Repositório GitHub
* acesso confirmado ao repositório `AlcinoAfonso/LP-Factory-10`
* nível validado: leitura e inspeção do repositório real
* inclui: buscar arquivos, abrir arquivos, ler conteúdo, confirmar paths e artefatos versionados
* não assumir capacidade mutável sem teste explícito no caso
2.3.2 Vercel
* acesso confirmado ao workspace e aos projetos da Vercel do LP Factory 10
* projetos já validados: `lp-factory-10` e `lpf-10-services`
* nível validado: inspeção operacional
* inclui: listar team, listar projetos, ler metadados de projeto, listar deploys, ler deployment por ID e ler build logs
* não assumir capacidade de alterar settings, variáveis, domínios ou disparar deploy sem teste explícito no caso
3. Notas permanentes para avaliação estrutural
* chamar de OpenAI Project
* compatibilidades oficiais não substituem a confirmação do repositório real nem as fontes canônicas do projeto
* em Supabase / Postgres, tratar RLS como ponto estrutural relevante para objetos expostos
* views podem obedecer RLS com `security_invoker = true`
* views são `security definer` por padrão e exigem cautela
* regra editorial: último nível das subseções deve usar bullets, e não numeração
