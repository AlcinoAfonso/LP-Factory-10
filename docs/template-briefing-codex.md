# Template de briefing para Codex

## A) Estrutura mínima do briefing

Todo briefing deve ser outcome-first e informar, de forma objetiva:

- objetivo final;
- fontes obrigatórias;
- escopo permitido;
- limites do que não pode ser alterado;
- validação obrigatória;
- formato do relatório final.

## B) Regras por tipo de entrega

### Checklist pré-edição

Antes de editar arquivos no Codex App:

- verificar a branch ativa;
- se estiver em `main`, parar e não editar a working tree local;
- usar o conector GitHub para criar branch de trabalho e aplicar alterações;
- se o conector GitHub não estiver disponível, reportar bloqueio antes de editar.

### Código

- seguir a rotina padrão de checks definida no `AGENTS.md`;
- entregar arquivos novos com conteúdo completo;
- em arquivos existentes, orientar alteração mínima dentro do escopo definido;
- evitar reestruturação ampla sem pedido explícito.

### Documentos

- em alteração local e determinística, fornecer texto exato;
- quando exigir ajuste interno, instruir localização e edição apenas no escopo definido;
- em documentos versionados, ler o estado atual antes de propor mudanças em version, date e changelog;
- não fixar version, date ou changelog sem instrução explícita.

## C) Gate extra para código sensível

Aplicar gate quando envolver `package.json`/lockfile, middleware, rotas API/server actions, integrações OpenAI/Supabase/Vercel, ou env/runtime/build.

Nesses casos, exigir no briefing:

- build e/ou validação de deploy conforme o caso;
- evidência do resultado (logs e resumo de sucesso/erro);
- regra explícita de que a entrega não está pronta para merge se o gate falhar.

## D) Relatório final

Ao final, informar apenas itens aplicáveis:

- objetivo executado;
- arquivos criados/ajustados;
- resumo das mudanças;
- validação executada;
- pendências e risco residual, se houver;
- status final: `pronto`, `bloqueado` ou `depende validação`.
