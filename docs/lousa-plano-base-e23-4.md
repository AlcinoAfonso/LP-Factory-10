# PB 18B.1 — Patch de segurança do Next.js

Fonte funcional aprovada: [Debate 18B, seção 4.3](https://docs.google.com/document/d/1d4dIMrQHG_Qo82RdFYZrirbpFRYoHlLESMA9wXKuXzg/edit). A V1 abaixo reproduz o recorte aprovado; este commit a congela antes de qualquer derivação técnica.

## 1. V1 aprovada

### 1.1 Objetivo e resultado

- Aplicar ao Core a release de segurança oficial do Next.js 16.3.8, hoje publicada para a linha 16.3, substituindo a versão fixada 16.3.3.
- Preservar jornadas, rotas e comportamento atuais; o resultado é uma dependência corrigida, sem funcionalidade nova para o cliente.

### 1.2 Escopo, limites e riscos

- Incluir `next` e `eslint-config-next` alinhados a 16.3.8, o `package-lock.json` e somente ajustes técnicos indispensáveis para manter compatibilidade sem alterar comportamento.
- Excluir upgrades de React e outras dependências sem necessidade comprovada, recursos opcionais do Next.js, mudanças funcionais, banco/schema/migrations, workflows, secrets, settings, plano, serviços ou infraestrutura.
- A release 16.3.8 corrige sete vulnerabilidades da divulgação de setembro. Duas outras vulnerabilidades (uma crítica e uma alta) seguem pendentes de coordenação upstream; este plano não declara remediação total e `vercel#34` permanece ativo para acompanhá-las.
- Risco principal: regressão de compatibilidade no Core após o patch. Qualquer correção que exija ampliar o escopo volta ao titular para decisão.

### 1.3 Roadmap, custo e automação

- Posição prevista: E23.4, dentro de Segurança e governança transversal da plataforma; fase única 23.4.3 — aplicar e validar o patch de segurança Next.js.
- Custo incremental zero: atualizar a dependência existente e usar os GitHub Actions e a Vercel Hobby já configurados; não criar ou contratar recurso. Se surgir necessidade de upgrade ou cobrança, interromper.
- Automação: não criar automação nova; usar os checks de segurança e o Preview existentes.
- Supervisão: Autônomo; a sessão principal executa pelo contrato único do Executor.

### 1.4 Critérios de aceite e evidências

- Instalação limpa (`npm ci`), `npm run check` e Security Checks existentes aprovados no mesmo HEAD.
- Build hospedado e Preview da Vercel concluídos com sucesso; smoke proporcional em superfícies representativas confirma ausência de erro visível ou regressão de runtime.
- Code Review independente concluído no HEAD exato, sem achado material pendente; merge somente após os gates. O deploy automático de Production já configurado fica Ready, sem alteração manual de settings.
- Reconciliar `vercel#34`, manter as duas vulnerabilidades ainda sem patch como pendência upstream, registrar E23.4 no roadmap e materializar a V1 neste arquivo. Concluir PB 18B.1 somente com PR, validação pós-merge e registros canônicos conferidos.

### 1.5 Fontes indicadas no Debate

- Catálogo `docs/vercel-up.md` (`vercel#34`), README.md, docs/roadmap.md, docs/base-tecnica.md, docs/platform-config.md, AGENTS.md e contratos vigentes do Pipeline; release Next.js oficial ligada na seção 1.3 do Debate 18B.

## 2. Autoridade e limites do recorte

- O usuário aprovou a V1 descrita no Debate 18B, seção 4.3, e autorizou execução autônoma nesta sessão principal, inclusive PR, merge após os gates obrigatórios e deploy decorrente do fluxo já configurado.
- A autorização cobre somente atualizar Next.js para 16.3.8, alinhar a configuração ESLint correspondente e o lockfile, validar e reconciliar `vercel#34`.
- Não estão autorizados alterações de settings, plano, secrets, workflows, banco, migrations, outros itens, comportamento do produto ou dependências além das necessárias à compatibilidade. As verificações de `supa#56`, `github#10` e `github#13` permanecem pendentes de decisão própria.
- O gate de custo incremental zero foi conferido no Debate: dependência existente, GitHub Actions já configurados e Vercel Hobby; sem serviço, recurso pago, plano ou infraestrutura nova. Parar se a execução exigir upgrade ou cobrança incremental.
