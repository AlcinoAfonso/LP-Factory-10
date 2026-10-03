# Design System — LP Factory

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

## Superfície administrativa do Admin

- Admin usa shell próprio, separado do Account Dashboard.
- Header administrativo permanece fixo no topo durante rolagem.
- Desktop usa sidebar esquerda para navegação administrativa.
- Mobile usa menu superior/hamburger para navegação.
- A área Documentação usa filtro superior, select nativo em ordem alfabética e conteúdo read-only abaixo do filtro, com layout responsivo empilhado no mobile.
- Páginas administrativas usam cabeçalho operacional com título; descrição e marcador de status/contagem são opcionais e só aparecem quando agregam contexto, evitando repetir informação já evidente na própria superfície.
- Listagens read-only usam filtros simples, tabela e links de detalhe.
- Páginas de detalhe read-only usam blocos funcionais para dados da entidade e relações associadas.
- Fluxos de detalhe que combinam cobertura, ação humana e assistência automatizada apresentam primeiro identidade e estado, depois o contexto de decisão e as ações humanas; recomendação automatizada e decisão permanecem visual e semanticamente separadas, enquanto diagnósticos e identificadores técnicos ficam sob revelação progressiva.
- Estados assíncronos preservam conteúdo válido já exibido, anunciam feedback textual sem executar decisão pela renderização e mantêm ações humanas independentes disponíveis. Controles alterados devem preservar fluxo por teclado, foco visível e alvo mínimo de 44 px na superfície responsiva.
- Estados vazios devem ser enxutos, sem ilustração e sem inventar métricas.
- Cards devem ser usados para blocos funcionais, detalhes ou estados vazios; em novas coleções, a exceção funcional descrita abaixo também pode justificar seu uso.
- O Admin não usa `AccountSwitcher` nem depende de conta ativa.

## Contrato de apresentação para páginas operacionais de dashboard

- Antes da implementação, toda nova página ou recorte operacional do Admin Dashboard e do Account Dashboard deve confrontar sua arquitetura de apresentação com este contrato; o Partner Dashboard o herda quando ganhar superfície funcional própria. Páginas públicas e landing pages comerciais ficam fora deste contrato operacional. As regras e operações específicas continuam nos contratos de domínio; escolhas visuais não podem remover, reduzir ou redistribuir regra, ação, validação, autorização, segurança, auditabilidade ou capacidade existente sem a autorização exigida.
- O cabeçalho apresenta título humano da área ou tarefa em escala operacional, sem aparência de hero/banner. Descrição curta, contagem ou status agregado são opcionais; a ação principal aparece no topo somente quando houver ação primária real. Retorno/breadcrumb, título, descrição, abas e primeira superfície de trabalho usam espaçamento vertical contido para manter a tarefa principal próxima do topo.
- Em coleções, a primeira opção é lista tabular compacta: o cabeçalho das colunas é a primeira linha visual, seguido de registros em linhas consecutivas, atributos essenciais em colunas e meio explícito de abrir o detalhe. A primeira coluna prioriza a identidade operacional do registro. Cabeçalhos e células usam padding vertical contido para exibir mais registros por viewport sem perder legibilidade, foco ou alvo de interação acessível; as linhas não assumem formato de card nem altura excessiva por padrão. Informação secundária pode ocupar uma segunda linha curta somente quando necessária ao reconhecimento.
- Conjuntos de seções, categorias, etapas internas ou itens equivalentes que compartilhem a mesma estrutura de tarefa e sejam escolhidos para consulta ou edição também são coleções operacionais. Nesses casos, usar lista tabular compacta com cabeçalhos na primeira linha visual, uma linha por item, identidade ou título na primeira coluna, estado quando existir e ação explícita `Abrir` em cada linha. Filtro e ordenação ficam associados aos respectivos cabeçalhos quando forem úteis.
- A coleção não mantém formulário ou editor completo aberto ao lado ou dentro da lista. `Abrir` leva ao detalhe individual do item; quando a tarefa for delimitada e o retorno ao mesmo contexto for desejável, usar modal/dialog conforme o contrato abaixo. Página de detalhe fica reservada aos casos em que houver necessidade funcional real de rota própria. Navegação lateral ou vertical não substitui a lista tabular quando os itens forem registros ou seções equivalentes de uma mesma tarefa; ela permanece adequada apenas para áreas funcionalmente distintas de navegação.
- Ordenação e filtros são acrescentados somente quando ajudarem a localizar, comparar ou restringir registros. No desktop, o controle de um atributo filtrável ou ordenável fica associado ao cabeçalho da respectiva coluna; controles globais acima da coleção ficam reservados ao que não pertence naturalmente a uma coluna. A operação completa ocorre em página de detalhe orientada à tarefa; a lista não acumula edição, diagnóstico profundo ou contratos técnicos quando isso prejudica leitura e comparação.
- Superfícies operacionais priorizam densidade útil e evitam espaço vertical ornamental que afaste a tarefa principal do topo ou reduza sem necessidade a informação útil visível.
- Botões e controles operacionais usam o menor tamanho visual suficiente para a tarefa. A hierarquia entre ação primária e secundária vem de tratamento visual e posição, não de dimensões excessivas; o alvo de interação acessível permanece preservado.
- Blocos auxiliares anteriores à coleção, como ações gerais de IA, pesquisa ou filtros globais, são apresentados como faixas operacionais compactas: texto, controles e ações relacionados ficam próximos entre si e com margem reduzida até a lista, sem competir visualmente com a coleção principal.
- Quando a mesma área reúne dois ou mais objetos de trabalho principais equivalentes, abas horizontais próximas ao topo exibem apenas a visão selecionada. Seletores internos de estado ou ambiente permanecem na aba correspondente. Detalhes e formulários seguem orientados à tarefa, sem virar tabela apenas por uniformidade visual.
- Em formulários ou detalhes com edição explícita e rascunho local, a primeira opção é o par `Salvar` e `Cancelar`. `Salvar` só se torna ação primária disponível quando houver alteração material válida em relação ao estado persistido; sem mudança, permanece desabilitado. `Cancelar` encerra a edição e restaura o estado persistido sem mutação. Autosave só substitui esse padrão quando já estiver definido no contrato funcional competente.
- A superfície considera pendente de salvamento quando o rascunho materialmente difere do estado persistido. Se houver perda possível, sair sem salvar — inclusive por `Cancelar`, fechar modal/dialog, trocar aba ou visão, voltar ou navegar para outra rota — exige confirmação antes do descarte. Sem alteração pendente, a saída é imediata. Se o usuário permanecer, rascunho e contexto são preservados; no fechamento do navegador ou da própria aba, usar o mecanismo nativo compatível quando a plataforma não permitir confirmação customizada confiável.
- Modal/dialog é opção adequada quando o usuário parte de uma coleção, trata um único item em tarefa delimitada e deve retornar ao mesmo contexto sem necessidade funcional de rota independente. Deve mostrar somente o contexto e as ações necessários, usar padding e espaçamento vertical contidos, evitar áreas vazias sem função, manter ações próximas ao conteúdo, ter largura compatível com a tarefa no desktop e poder ocupar quase toda a viewport no mobile. Deve preservar navegação por teclado e foco, oferecer fechamento inequívoco e devolver o foco ao acionador. Fechamento por botão, `Escape`, `Cancelar`, backdrop ou mecanismo equivalente obedece à proteção contra alterações não salvas. Página de detalhe continua preferível para tarefa longa, multipasso, dependente de contexto amplo, URL própria útil ou retomada direta.
- Superfícies operacionais priorizam rótulos, estado, informação necessária à decisão e ações. Texto explicativo permanente aparece somente quando orienta uma decisão, evita erro relevante ou esclarece comportamento não evidente. Instrução comum a vários itens aparece uma vez no contexto apropriado; ajuda contextual, detalhes técnicos, explicações extensas e diagnósticos ficam sob revelação progressiva quando não forem necessários para a tarefa principal. Evitar expor simultaneamente múltiplos formulários completos quando a tarefa natural for selecionar um item e tratá-lo por vez.
- Títulos, estados, filtros, ações e mensagens usam linguagem humana. Identificadores, enums, UUIDs, schemas, versões e outros contratos internos ficam em segundo nível quando necessários.
- Mobile preserva a mesma coleção, identidade, estado, informação essencial, ação e acesso ao detalhe. Colunas secundárias podem ser condensadas, ocultadas, expandidas ou apresentadas por rolagem controlada conforme a superfície. Quando o cabeçalho de uma coluna deixar de ficar visível, filtros e ordenação correspondentes podem migrar para controles compactos acima da lista.
- Cards substituem a lista tabular somente quando tarefa, conteúdo ou restrição de viewport proporcionarem UX claramente melhor. O plano da nova página de coleção registra sucintamente a razão funcional da alternativa; preferência estética isolada não justifica a exceção.
- Estados vazio, carregamento, erro e sucesso explicam o que acontece e o próximo passo seguro, preservando conteúdo válido já disponível. Teclado, foco visível, labels, alvos de interação e feedback textual seguem a baseline vigente deste Design System.
- A acessibilidade das novas páginas operacionais de dashboard segue WCAG 2.2 como baseline. Devem ser aplicados os critérios relevantes ao fluxo real e registrada evidência proporcional por inspeção automática e validação manual. Ferramenta automática isolada não comprova conformidade, e o produto não deve declarar conformidade WCAG integral sem auditoria, escopo e evidências próprios.
- Este contrato não escolhe tabela HTML, CSS Grid, AG Grid, MUI Data Grid ou outra biblioteca. Cada implementação usa a menor solução compatível com o comportamento aprovado e valida sua própria superfície.
- Este contrato não fixa valores universais de espaçamento ou tamanho visual em pixels neste estágio; medidas concretas e tokens podem evoluir quando houver repetição suficiente entre superfícies. Limites mínimos de acessibilidade já definidos permanecem normativos, inclusive o alvo mínimo de interação de 44 px.

## Fora de escopo atual
- Redesign amplo de dashboards
- Branding por cliente/multi-tenant visual
