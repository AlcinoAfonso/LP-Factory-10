# Revisão factual de readiness — E17.9.4

Data da observação: 08/09/2026.

Status: bloqueado antes da materialização de qualquer workflow, adapter ou `create_user`. A investigação foi somente leitura e não executou autenticação, mutação, consumo de mailbox ou chamada transacional do produto.

## Contexto observado

- Branch `codex-app/e17-9-autonomia-qa`, PR #914, sobre o plano-base v2 reconciliado com a decisão 3.31, Debate 08, aba `t.0`, revisão `ANLCKQlwRiGhWEqMKZmQQXY2cKZOfajqrN0r2h7pVMC8hW5bn-DxedOse4ytpi2LqYIeOews5BnGgHNGygOIQ8ZIK73zS0RgpeEkIU4Cjws`.
- Projeto Supabase hospedado `dpikmjgiteuafsbaubue`, estado `ACTIVE_HEALTHY`, confrontado pelo Supabase Plugin somente em leitura.
- A identidade institucional alvo ainda não existe em `auth.users`; portanto não há membership ativa, papel de gestão nem autoridade de plataforma associada.
- `ensure_first_account_for_current_user` é um boundary `SECURITY DEFINER` preexistente e allowlisted: exige `auth.uid()` não nulo, teve `PUBLIC` revogado e `EXECUTE` concedido a `authenticated`; seu escopo decorre dessas verificações e da implementação idempotente. `accounts` e `account_users` têm RLS habilitada, mas suas policies não limitam as operações internas dessa função.
- `v_account_commercial_entitlement_effective` existe no banco hospedado.
- A decisão 3.31 autoriza o GitHub Actions como superfície de consumo de `MAILBOX_EMAIL`, `MAILBOX_PASSWORD` e `SUPABASE_SECRET_KEY`, mas não autoriza transportar valores pelo Executor nem torna a capacidade operacional por intenção.
- A `main` remota contém somente `pipeline-docs-apply-report.yml`, `pipeline-supabase-apply-migrations.yml`, `pipeline-supabase-inspect.yml`, `security.yml` e `upgrade-next-16-1-1.yml`; não existe workflow QA confiável na branch padrão.
- Os repository secrets GitHub vigentes incluem `MAILBOX_EMAIL`, `MAILBOX_PASSWORD` e `SUPABASE_DB_URL_READONLY`, mas não `SUPABASE_SECRET_KEY`. O cadastro Vercel mantém `SUPABASE_SECRET_KEY` server-side e Preview/Production compartilham o mesmo Supabase/Auth, porém o valor sensível não pode ser extraído pelo CLI nem constitui resolução para GitHub Actions.
- `workflow_dispatch` só pode acionar um workflow presente na branch padrão. O head da PR #914 não pode executar com secrets, ser checkout/fetch de passo privilegiado nem fornecer artifact ou código executável ao workflow.

## Readiness por operação

| Operação | Credenciais necessárias | Isolamento entre atores | Mailbox | Mecanismo autorizado existente | Pós-condição e fonte autoritativa | Resultado atual |
| --- | --- | --- | --- | --- | --- | --- |
| `signup` | URL/chave pública do Supabase e senha nova mantida fora do Executor | sessão própria do usuário e descarte verificável | não para emitir o signup; sim para aceitar usuário confirmado quando o projeto exigir confirmação | `supabase.auth.signUp` em `components/sign-up-form.tsx`, com redirect para `/auth/confirm` | usuário e estado de confirmação em Supabase Auth/`auth.users` | bloqueado pelo bootstrap ausente, `credential_resolution_unproven` e `session_isolation_unproven`; a confirmação também encontra `mailbox_consumer_missing` |
| `create_user` | `SUPABASE_SECRET_KEY`, resolvida sem exposição pelo GitHub Actions | proteção equivalente já existe no client administrativo: sem persistência, refresh ou detecção de sessão | não para criar usuário não confirmado; sim quando o critério exigir confirmação por e-mail | futuro `auth-admin.mjs` acionando `supabase.auth.admin.createUser` pelo mecanismo vigente, somente a partir de código confiável da `main` | usuário e estado de confirmação em Supabase Auth/`auth.users` | primeira capacidade candidata, bloqueada porque o workflow QA não existe na `main` e o secret não existe no GitHub Actions; nenhum adapter ou usuário é criado |
| `create_account` | sessão de usuário institucional autenticado | sessão exclusiva do próprio usuário | não; eventual obtenção anterior da sessão pode depender de e-mail | RPC `ensure_first_account_for_current_user`, consumida por `lib/access/adapters/accessContextAdapter.ts` | retorno da RPC, `accounts` e `account_users` | bloqueado pelo bootstrap ausente e porque a identidade e a sessão institucional não existem; credencial administrativa não é substituto permitido |
| `verify_entitlement` | sessão autenticada com acesso à conta | sessão exclusiva do ator consultado | não | `getCommercialEntitlementSignal` em `lib/commercial-entitlements/` | `v_account_commercial_entitlement_effective`, lida pelo boundary público | bloqueado pelo bootstrap ausente e pela ausência de usuário, conta, membership e sessão institucional |
| `invite` | sessão de owner/admin autorizada; internamente, configuração server-side já exigida pelo produto | sessão do gestor separada da futura sessão do convidado | não para criar membership pendente e emitir o convite; sim para aceitar a capacidade completa e continuar até `/auth/confirm` | `inviteAccountMember` em `lib/access/account-members/`, sem reprodução de regras | `account_users`, evento de canal `e11_account_member_invite_channel`, resposta sanitizada de emissão e, para aceite completo, Supabase Auth/mailbox/callback | bloqueado pelo bootstrap ausente, gestor/sessão inexistentes e `mailbox_consumer_missing` para o aceite completo |
| `confirm` | mensagem correlacionada, código/token invisível ao Executor e sessão/cookies isolados | sessão exclusiva do convidado, distinta da sessão do gestor | sim: `search`, `read` e `consume` | consumidor institucional autorizado combinado ao POST de `/auth/confirm` | Supabase Auth, sessão resultante e membership/lifecycle esperado | bloqueado pelo bootstrap ausente, `mailbox_consumer_missing`, `credential_resolution_unproven` e `session_isolation_unproven` |
| `recover` | identidade institucional, mensagem correlacionada, código/token e nova senha invisíveis ao Executor | sessão de recuperação exclusiva e descartável | não para solicitar recuperação; sim para concluir o fluxo real | `resetPasswordForEmail` em `components/forgot-password-form.tsx` e callback autorizado | Supabase Auth e sessão recuperada observada sem token/cookie bruto | bloqueado pelo bootstrap ausente: não há usuário, consumidor de mailbox, resolução de credenciais nem isolamento de sessão |
| `verify_role_state` | sessão autenticada do ator consultado | sessão exclusiva por ator | não | boundaries de `lib/access/`, `lib/admin/` e `lib/commercial-entitlements/` | `accounts`, `account_users`, RPCs de autoridade e view de entitlement sob RLS | bloqueado pelo bootstrap ausente e pela ausência de identidade, conta, membership e sessão institucional; leitura do estado ausente não substitui operação real |

## Conclusão operacional

A decisão 3.31 torna GitHub Actions a superfície autorizada para resolução de secrets da E17.9, mas essa autorização ainda não está operacional. A `main` não contém workflow QA confiável, `workflow_dispatch` não pode bootstrapar um workflow existente apenas no head da PR #914, o head da PR não pode executar com secrets e `SUPABASE_SECRET_KEY` ainda não existe como repository secret do GitHub Actions.

Portanto, nenhuma implementação de workflow, adapter ou `create_user` pode avançar no contrato atual de uma única PR. O readiness permanece fail-closed. Depois de um bootstrap autorizado e incorporado à `main`, `create_user` continua sendo a primeira capacidade candidata, com busca paginada idempotente, operação real, observação de `auth.users` e evidência sanitizada; isso não conclui fluxos dependentes de mailbox.

## Decisão humana necessária

Autorizar ou não a exceção ao contrato atual de uma única PR: concluir a PR #914 como checkpoint de bootstrap confiável, com E17.9.3 e o único workflow/job determinístico, sem execução privilegiada pré-merge; após merge humano na `main`, continuar E17.9.4–E17.9.6 em uma PR sucessora que execute exclusivamente o código confiável da branch padrão.

Se a exceção não for autorizada, E17.9.4 permanece bloqueada; não existe alternativa de infraestrutura autorizada no recorte atual. Nenhum adapter, fixture operacional, capability pronta ou usuário foi materializado, e a cadeia real `invite` → mailbox → `/auth/confirm` não foi substituída por estado final direto.
