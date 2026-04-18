# Design System — LP Factory

## Visão geral
Este documento consolida o estado atual do design system ao final do ciclo E6.4–E6.6, com foco em componentes base reutilizáveis, acessibilidade e consistência visual sem mudança de regra de negócio.

## Componentes padronizados
- `Button`
- `Input`
- `Textarea` (biblioteca base)
- `Select` (nativo)
- `Card` (`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`)
- `FormField` (estrutura mínima para `label + hint + error`)
- `FeedbackMessage` (para `error | success | warning`)
- `EmptyState` (estado vazio simples)
- `LoadingState` (estado de carregamento simples)

## API mínima esperada

### Button
- Arquivo: `components/ui/button.tsx`
- API: `ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>`
- Comportamento:
  - foco visível com `ring`
  - estado `disabled` consistente
  - hover semântico (`bg-primary/90`)

### Input
- Arquivo: `components/ui/input.tsx`
- API: `InputProps extends React.InputHTMLAttributes<HTMLInputElement>`
- Comportamento:
  - borda/token semântico (`border-input`, `background`)
  - placeholder semântico
  - foco visível e `disabled` consistente

### Textarea
- Arquivo: `components/ui/textarea.tsx`
- API: `TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement>`
- Implementação:
  - `forwardRef`
  - estilo compatível com `Input`
  - foco visível, placeholder e `disabled` consistentes
  - sem variants extras
- Observação: componente de biblioteca com adoção por demanda; não possui uso obrigatório em todas as telas.

### Select
- Arquivo: `components/ui/select.tsx`
- API: `SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement>`
- Implementação:
  - `forwardRef`
  - `<select>` nativo
  - sem dropdown custom/headless
  - foco visível, `disabled` e largura previsível (`w-full`)

### Card
- Arquivo: `components/ui/card.tsx`
- API preservada:
  - `Card`
  - `CardHeader`
  - `CardTitle`
  - `CardDescription`
  - `CardContent`
- Uso com tokens semânticos de borda/superfície.

### FormField
- Arquivo: `components/ui/form-field.tsx`
- Estrutura mínima:
  - `FormField` (container)
  - `FormFieldLabel`
  - `FormFieldHint`
  - `FormFieldError`
- Finalidade: padronizar acessibilidade e apresentação de campo sem virar framework de formulário.

### FeedbackMessage
- Arquivo: `components/ui/feedback-message.tsx`
- API mínima:
  - `tone: "error" | "success" | "warning"`
  - `children: React.ReactNode`
  - `className?: string`
- Comportamento:
  - usa tokens semânticos existentes
  - `role="alert"` quando `tone="error"`
  - suporte a anúncio não intrusivo para mensagens dinâmicas de sucesso/aviso
  - componente propositalmente simples (sem ícones obrigatórios)

### EmptyState
- Arquivo: `components/ui/empty-state.tsx`
- API mínima:
  - `title: string`
  - `description?: React.ReactNode`
  - `action?: React.ReactNode`
  - `className?: string`
- Comportamento:
  - sem ilustração
  - sem layout complexo

### LoadingState
- Arquivo: `components/ui/loading-state.tsx`
- API mínima:
  - `label?: string`
  - `className?: string`
- Comportamento:
  - loading leve e textual
  - sem spinner complexo
  - sem framework de skeleton

## Regras de uso
- Usar os componentes base nas superfícies ativas de auth/onboarding e dashboards conforme adoção incremental.
- Preservar contratos de props e fluxos existentes.
- Evitar variações extras sem uso real imediato.
- Priorizar tokens semânticos (`primary`, `ring`, `border`, `muted/accent`, `destructive`, `state`).

## Aplicação mínima visível atual
- `components/login-form.tsx`
- `components/sign-up-form.tsx`
- `components/forgot-password-form.tsx`
  - sucesso com `FeedbackMessage tone="success"`
- `app/auth/update-password/page.tsx`
  - aviso de ausência de token com `FeedbackMessage tone="warning"`
- `app/a/[account]/page.tsx` (superfície `pending_setup`)
  - erro de formulário do server com `FeedbackMessage tone="error"`
- `app/a/[account]/loading.tsx`
  - loading com `LoadingState`
- `app/admin/layout.tsx`
  - superfície administrativa mínima protegida
- `components/admin/AdminHeader.tsx`
  - header próprio do Admin com `LP Factory Administrativo`
- `components/admin/AdminUserMenu.tsx`
  - menu próprio do Admin com avatar por inicial, e-mail e logout

## Superfície administrativa mínima (E12.5.1)

- `components/admin/AdminHeader.tsx`
  - header próprio do Admin
  - exibe `LP Factory Administrativo`
  - não reutiliza o `Header` do Account Dashboard
  - não usa `AccountSwitcher`

- `components/admin/AdminUserMenu.tsx`
  - menu próprio do Admin
  - exibe avatar por inicial
  - exibe e-mail do usuário
  - expõe ação de logout
  - não reutiliza `UserMenu`
  - não inclui `Perfil`
  - não depende de contexto de conta

- `app/admin/layout.tsx`
  - aplica a moldura mínima da seção Admin
  - renderiza header administrativo + área principal neutra

## Fora de escopo atual
- Redesign amplo de dashboards
- Branding por cliente/multi-tenant visual
