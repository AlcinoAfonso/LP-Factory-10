# Design System — LP Factory

• Versão: v1.0.0
• Data: 26/08/2026

## Visão geral
Este documento define o contrato visual vigente do produto, com foco em componentes base reutilizáveis, acessibilidade e consistência visual sem mudança de regra de negócio.

## Residência e fundamentos visuais
- Este documento é a fonte canônica de identidade visual, tipografia, tokens, componentes, estados e superfícies do produto.
- A Base Técnica deve apenas referenciar este contrato quando uma regra visual afetar uma implementação; não deve reproduzir inventários ou valores visuais.
- A marca provisória permanece como wordmark textual “LP Factory” enquanto o asset oficial de logo não estiver versionado no repositório.
- A tipografia oficial da UI do dashboard é Inter via `next/font/google`, aplicada globalmente em `app/layout.tsx`; a configuração exata permanece canônica no código.
- Os tokens LP Factory estendem o padrão shadcn sem substituir seus tokens-base; nomes, valores, `content` e sombras permanecem canônicos em `tailwind.config.ts`.
- O remapeamento semântico de `primary`, `ring`, `border` e `accent` permanece contido em `app/globals.css`, sem redesign amplo das superfícies-base.
- O repositório real é a fonte do estado atual de arquivos, valores e implementação visual.

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
- Admin Dashboard
  - shell protegido em `/admin`
  - header fixo próprio
  - sidebar desktop e menu superior/hamburger no mobile
  - listagens read-only para contas, resoluções de nicho e taxonomia
  - páginas de detalhe read-only quando aplicável
  - placeholders enxutos para áreas ainda não conectadas

## Workspace operacional do Account Dashboard

- A coleção principal usa composição master-detail: a lista resume cada identidade de landing page e o detalhe concentra configuração, revisões e ações contextuais.
- Cada item da coleção exibe somente identidade, próxima decisão e estado derivado; configuração extensa e histórico completo permanecem no detalhe.
- Estados derivados usam texto explícito acompanhado de tratamento visual semântico; cor isolada nunca comunica o estado.
- Desktop pode usar tabela ou grade responsiva; mobile deve empilhar cards ou composição equivalente sem exigir rolagem horizontal.
- O detalhe mantém contexto persistente Conta → landing page → seção e retorno previsível à coleção.
- Ações mutáveis aparecem apenas para perfis autorizados; a mesma superfície permanece legível em modo somente leitura, sem controles desabilitados que sugiram permissão futura.
- Estados indisponível, vazio, pendente e erro devem ser completos e explícitos; não apresentar coleção parcial como se fosse o conjunto integral.
- A coleção usa uma ação primária única por item e prioriza nome, identidade comercial, situação, versões e atualização; slug, IDs e metadados técnicos não pertencem à experiência primária.
- O preview mantém contexto da landing page e da versão selecionada, oferece retorno explícito ao detalhe e distingue visualmente versão aceita de versão disponível para aceite.
- A linguagem de aceite deve esclarecer que a escolha não publica a landing page; geração e aceite exibem feedback compreensível, preservam foco e anunciam estados dinâmicos com semântica adequada.
- O carregamento de uma coleção assíncrona deve permanecer local à sua superfície quando as demais áreas já puderem ser exibidas, reutilizando `LoadingState` sem apresentar vazio antes da conclusão da leitura.
- Mudanças materiais em superfícies operacionais exigem QA humano no Preview em desktop e mobile antes do rollout de Production, cobrindo hierarquia, teclado, foco, nomes e estados semânticos, contraste, alvos de toque e ausência de rolagem horizontal obrigatória.

## Superfície administrativa do Admin

- Admin usa shell próprio, separado do Account Dashboard.
- Header administrativo permanece fixo no topo durante rolagem.
- Desktop usa sidebar esquerda para navegação administrativa.
- Mobile usa menu superior/hamburger para navegação.
- A área Documentação usa filtro superior, select nativo em ordem alfabética e conteúdo read-only abaixo do filtro, com layout responsivo empilhado no mobile.
- Páginas administrativas usam cabeçalho operacional com título; descrição e marcador de status/contagem são opcionais e só aparecem quando agregam contexto, evitando repetir informação já evidente na própria superfície.
- Listagens read-only usam filtros simples, tabela e links de detalhe.
- Páginas de detalhe read-only usam blocos funcionais para dados da entidade e relações associadas.
- Estados vazios devem ser enxutos, sem ilustração e sem inventar métricas.
- Cards devem ser usados apenas para blocos funcionais, detalhes ou estados vazios.
- O Admin não usa `AccountSwitcher` nem depende de conta ativa.

## Fora de escopo atual
- Redesign amplo de dashboards
- Branding por cliente/multi-tenant visual
