Inventário do Repositório — LP Factory 10

Propósito: mapa completo e atualizado da estrutura do repositório.
Status: Documento complementar à Base Técnica (não normativo).
Última atualização: 15/11/2025

1. Estrutura Geral

src/
lib/
providers/
app/
components/
styles/
public/
middleware.ts
next.config.js
package.json

2. src/lib — Núcleo Técnico

src/lib/
access/
adapters/
accountAdapter.ts
accessContextAdapter.ts
contracts.ts
getAccessContext.ts
guards.ts
audit.ts
plan.ts
types.ts

admin/
adapters/
adminAdapter.ts
postSaleTokenAdapter.ts
contracts.ts
index.ts

types/
status.ts

supabase/
client.ts
server.ts
middleware.ts

Observação: somente arquivos dentro de access/adapters/ e admin/adapters/ podem tocar o DB.

3. src/providers

src/providers/
AccessProvider.tsx

4. src/app — Rotas (Next.js App Router)

src/app/
a/
[account]/
layout.tsx
page.tsx
actions.ts
home/
page.tsx

admin/
layout.tsx
tokens/
page.tsx

onboard/
page.tsx
actions.ts

auth/
login/page.tsx
forgot-password/page.tsx
update-password/page.tsx
confirm/route.ts
protected/page.tsx

api/
user/accounts/route.ts

5. src/components

src/components/
features/
account-switcher/
AccountSwitcher.tsx
AccountSwitcherTrigger.tsx
AccountSwitcherList.tsx
useAccountSwitcher.ts
useUserAccounts.ts

layout/
UserMenu.tsx

ui/
button.tsx
card.tsx
input.tsx
label.tsx
AlertBanner.tsx

admin/
CopyLinkButton.tsx

onboard/
OnboardForm.tsx

6. SULB (Supabase UI Library)

Arquivos autorizados a importar @supabase/*:
lib/supabase/client.ts
lib/supabase/middleware.ts
lib/supabase/server.ts
app/auth/confirm/route.ts
app/auth/update-password/page.tsx
app/auth/protected/page.tsx

7. Arquivos de Configuração

middleware.ts
next.config.js
package.json
postcss.config.js
tailwind.config.js
tsconfig.json
.env.example

8. Pastas Auxiliares

public/ – Assets estáticos
styles/ – Estilos globais
docs/ – Documentação interna

9. Regras do Inventário

Representa o snapshot atual da estrutura.

Não define regras, apenas descreve.

Atualizar quando novas rotas/adapters surgirem ou pastas mudarem.

10. Próxima Revisão

Revisão recomendada a cada milestone do projeto.
