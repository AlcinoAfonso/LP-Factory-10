# Template de briefing para Codex

## A) Estrutura mínima do briefing

Todo briefing para o Codex deve informar:

- objetivo final da tarefa;
- fontes obrigatórias a serem lidas;
- escopo permitido;
- limites do que não pode ser alterado;
- critérios de sucesso;
- validação obrigatória;
- formato do relatório final.

O briefing deve ser outcome-first: começar pelo resultado esperado e só depois detalhar regras, limites e validações.

## B) Regras por tipo de entrega

### Código

No briefing para o Codex:

- incluir explicitamente `npm ci`;
- incluir explicitamente `npm run check`;
- arquivos novos devem ser entregues com conteúdo completo;
- arquivos existentes devem receber instruções claras de ajuste;
- evitar reestruturação ampla sem pedido explícito.

### Documentos

No briefing para o Codex:

- quando a alteração for local e determinística, entregar o texto exato;
- quando a alteração exigir localização e ajuste interno, instruir o Codex a localizar e ajustar apenas dentro do escopo definido;
- em documentos versionados, ler o estado atual do arquivo no repositório antes de propor qualquer alteração em version, date e changelog;
- não fixar version, date ou changelog no briefing, salvo instrução explícita do usuário.

## C) Gate extra para código sensível

Aplicar gate extra quando o caso envolver:

- `package.json` ou lockfile;
- middleware;
- rotas API ou server actions;
- integrações OpenAI, Supabase ou Vercel;
- env, runtime ou configuração de build.

Nesses casos, o briefing deve:

- incluir build e/ou validação de deploy conforme o caso;
- declarar que o caso não está pronto para merge se o gate exigido falhar;
- exigir evidência do resultado, com logs, resumo de sucesso ou erro.

## D) Validação obrigatória

Para casos de código, executar:

- `npm ci`;
- `npm run check`.

Para casos documentais simples, informar se os checks não foram aplicáveis.

## E) Relatório final

Ao final, o Codex deve informar apenas os itens aplicáveis:

- objetivo executado;
- arquivos criados ou ajustados;
- resumo das mudanças;
- validação executada;
- pendências, se houver;
- risco residual, se houver;
- status final: `pronto`, `bloqueado` ou `depende validação`.
