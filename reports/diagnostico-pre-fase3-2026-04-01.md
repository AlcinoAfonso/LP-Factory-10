# Diagnóstico pré-Fase 3 — LP Factory 10
Data: 2026-04-01

## 1) Objetivo executado
Diagnóstico factual pré-Fase 3 (Partner + revisão de shared + massa real para boundary), sem implementação estrutural.

## 2) Fontes consultadas
- `docs/base-tecnica.md`
- `docs/roadmap.md`
- Código real do runtime (app/, lib/, components/, providers/, supabase/)
- `docs/schema.md` para validar o contrato de dados relacionado a Partner

## 3) Arquivos/grupos inspecionados
- Rotas e layouts: `app/a/**`, `app/admin/**`, `app/api/user/accounts/route.ts`
- Guards/gates: `app/a/_server/section-guard.ts`, `app/admin/_server/section-guard.ts`, `lib/access/guards.ts`
- Adapters/contratos/tipos: `lib/access/**`, `lib/admin/**`, `lib/types/status.ts`
- Componentes e providers reutilizados: `components/layout/**`, `components/features/account-switcher/**`, `components/ui/**`, `providers/AccessProvider.tsx`
- Camada de migrations SQL em `supabase/migrations/*`

## 4) Diagnóstico factual

### 4.1 Código Partner no runtime/módulos de suporte
- **Não há código Partner no runtime** (`app/`, `lib/`, `components/`, `providers/`) com rota/layout/guard/adapter/contract/component dedicado a Partner.
- A presença de Partner aparece **somente como contrato de dados/documentação** (`docs/roadmap.md`, `docs/schema.md`) e **não** como implementação no runtime.
- Também não há referência a Partner nas migrations versionadas em `supabase/migrations/*` (busca textual sem ocorrência).

### 4.2 Shared atual: real vs falso
- Há um bloco shared **real e neutro** (tokens UI, tipos canônicos e utilitários de contexto de acesso reutilizáveis).
- Há shared **falso/ambíguo**: módulos posicionados como genéricos mas fortemente acoplados ao contexto Account/Core atual (ex.: header com status de conta, switcher que assume `/a/[account]`, provider com import server-side desnecessário).

### 4.3 Massa real para boundary Partner
- Pelo critério de massa real do briefing, **não há massa suficiente** para iniciar boundary física de Partner.
- Motivo: inexistência de código Partner recorrente em pelo menos 2 grupos entre rotas/layouts/guards/adapters/contracts/componentes exclusivos.

## 5) Inventário de código Partner encontrado

### 5.1 Runtime e suporte de aplicação
- **Nenhum item encontrado**.

### 5.2 Contrato/documentação (não-runtime)
- `docs/roadmap.md`: E13 Partner Dashboard está planejado (não implementado).
- `docs/schema.md`: tabelas `partners` e `partner_accounts` descritas no contrato do DB.

## 6) Inventário de shared revisado (com potencial de revisão na Fase 3)

- `lib/types/status.ts` — tipos canônicos de status/roles usados transversalmente.
- `components/ui/*` — biblioteca UI base reutilizada por Auth, Account e Admin.
- `providers/AccessProvider.tsx` — provider/hook compartilhado de contexto de acesso.
- `components/layout/Header.tsx` e `components/layout/UserMenu.tsx` — componentes de layout usados em múltiplas superfícies.
- `components/features/account-switcher/*` + `app/api/user/accounts/route.ts` — bloco compartilhado de troca de conta.
- `lib/access/*` e `lib/admin/*` — módulos de domínio Core diferentes, mas com fronteira atual ainda próxima (compartilhamento parcial por guards).

## 7) Classificação item a item

| Path | Papel estrutural | Consumidores principais | Classificação | Motivo |
|---|---|---|---|---|
| `docs/roadmap.md` (E13) | Planejamento de Partner | Time de produto/arquitetura | ambíguo | Existe só no roadmap; não é código executável. |
| `docs/schema.md` (`partners`, `partner_accounts`) | Contrato de dados | DB/docs | ambíguo | Evidência de modelagem, sem massa de runtime. |
| `lib/types/status.ts` | Tipos canônicos transversais | `lib/access/*`, `lib/admin/*`, UI | shared real | Neutro, reutilizado por múltiplos domínios Core. |
| `components/ui/*` | Primitive UI cross-feature | Auth, Account, Admin | shared real | Componentes visuais sem regra de negócio de domínio. |
| `providers/AccessProvider.tsx` | Distribuição de AccessContext no client | `app/a/[account]/layout.tsx`, header, switcher | ambíguo | É compartilhado, porém hoje orientado ao fluxo Account. |
| `components/layout/Header.tsx` | Header comum | `/a/home`, `/a/[account]` | shared falso | Parece global, mas incorpora regra/status de conta. |
| `components/layout/UserMenu.tsx` | Menu do usuário | Header em áreas autenticadas | shared falso | Acopla account-switcher e rotas específicas de Core. |
| `components/features/account-switcher/*` | Troca de conta (client) | `UserMenu` | exclusivo do Core | Fluxo centrado em `/a/[account]`, sem neutralidade Partner/Admin genérica. |
| `app/api/user/accounts/route.ts` | API de contas do usuário | Account Switcher | exclusivo do Core | Endpoint específico do dashboard de contas do Core. |
| `app/a/**` | Rotas/layouts da área de conta | Usuário autenticado | exclusivo do Core | Núcleo do dashboard de conta (sem Partner). |
| `app/admin/**` | Rotas/layouts admin | Plataforma/admin | exclusivo do Core | Superfície administrativa Core (tokens pós-venda). |
| `lib/access/**` | Access context/gates/adapters de conta | `app/a/**`, header, API | exclusivo do Core | Regras de membership/account atuais do Core. |
| `lib/admin/**` | Domínio admin tokens e guardas | `app/admin/**`, `lib/access/guards.ts` | exclusivo do Core | Operação administrativa atual, sem escopo Partner. |
| `supabase/migrations/*` (estado atual) | Evolução SQL versionada | DB runtime | exclusivo do Core | Não há evidência de evolução Partner no conjunto versionado atual. |

## 8) Avaliação final
- **Fase 3 deve começar agora?** **não**.

## 9) O que falta para justificar a Fase 3
1. Massa real de código Partner em runtime (não só docs/schema), com recorrência.
2. Presença comprovada em ao menos 2 grupos (ex.: rotas + adapters, ou layouts + contracts).
3. Primeiro fluxo Partner completo mínimo (ex.: entrada + listagem + guard + contrato), para evitar boundary vazia.
4. Sinais de shared indevido com impacto real entre Core e Partner (atualmente há apenas candidatos, sem pressão de implementação Partner).

## 10) Checks executados e resultado
1. `npm ci` — OK
2. `npm run check` — OK (lint com warnings existentes; sem erro; typecheck ok)

## 11) Pendências
- Confirmar o primeiro caso funcional Partner que gere massa real de código executável.
- Após esse caso, reexecutar diagnóstico de boundaries com base no diff real.

## 12) Risco residual
- Antecipar boundary Partner sem massa real tende a gerar estrutura ociosa e aumentar custo de manutenção.
- Manter módulos “shared falsos” sem revisão futura pode elevar acoplamento quando Partner de fato entrar.

## 13) Status final
- **depende validação** (decisão de início da Fase 3 deve aguardar evidência de implementação Partner real).

## 14) Observação de natureza do caso
- Houve criação de artefato local deste relatório (`reports/diagnostico-pre-fase3-2026-04-01.md`); portanto, o caso deixa de ser diagnóstico 100% sem alteração de arquivos.
