# Design System — LP Factory (Caso 6.5)

## Objetivo desta fase
Padronizar a biblioteca UI base proprietária com baixo risco, sem alterar lógica de negócio.

## Componentes padronizados
- `Button`
- `Input`
- `Select` (novo, nativo)
- `Card` (`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`)
- `FormField` (novo, estrutura mínima para `label + hint + error`)

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

## Regras de uso
- Usar os componentes base nas telas de auth/onboarding/admin tocadas nesta fase.
- Preservar contratos de props e fluxos existentes.
- Evitar variações extras sem uso real imediato.
- Priorizar tokens semânticos (`primary`, `ring`, `border`, `muted/accent`).

## Aplicação mínima visível nesta fase
- `components/login-form.tsx`
- `components/sign-up-form.tsx`
- `components/forgot-password-form.tsx`
- `app/auth/update-password/page.tsx`
- `app/a/[account]/page.tsx` (somente superfície `pending_setup`)
- `app/admin/tokens/page.tsx` (validação complementar de `Select`)

## Fora de escopo nesta fase
- `Textarea`
- `EmptyState`
- Redesign amplo de dashboards
- Branding por cliente/multi-tenant visual
