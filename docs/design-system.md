# Design System — LP Factory (Caso 6.6)

## Objetivo desta fase
Padronizar a biblioteca UI base proprietária com baixo risco, sem alterar lógica de negócio.

## Componentes padronizados
- `Button`
- `Input`
- `Textarea` (novo, biblioteca base)
- `Select` (nativo)
- `Card` (`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`)
- `FormField` (estrutura mínima para `label + hint + error`)
- `FeedbackMessage` (novo, para `error | success | warning`)
- `EmptyState` (novo, estado vazio simples)
- `LoadingState` (novo, estado de carregamento simples)

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
- Observação: entra como componente de biblioteca sem uso obrigatório nesta rodada.

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
- Usar os componentes base nas telas de auth/onboarding/admin tocadas nesta fase.
- Preservar contratos de props e fluxos existentes.
- Evitar variações extras sem uso real imediato.
- Priorizar tokens semânticos (`primary`, `ring`, `border`, `muted/accent`, `destructive`, `state`).

## Aplicação mínima visível nesta fase
- `components/forgot-password-form.tsx`
  - sucesso migrado para `FeedbackMessage tone="success"`
- `app/auth/update-password/page.tsx`
  - aviso de ausência de token migrado para `FeedbackMessage tone="warning"`
- `app/a/[account]/page.tsx` (somente superfície `pending_setup`)
  - erro de formulário do server migrado para `FeedbackMessage tone="error"`
- `app/admin/tokens/page.tsx`
  - estado sem resultados migrado para `EmptyState`
- `app/a/[account]/loading.tsx`
  - loading migrado para `LoadingState`
- `components/login-form.tsx`
- `components/sign-up-form.tsx`

## Fora de escopo nesta fase
- Redesign amplo de dashboards
- Branding por cliente/multi-tenant visual
