# AGENTS.md

## Sandbox checks (rotina padrão)
Rodar, nesta ordem:

1. `npm ci`
2. `npm run lint`
3. `npx tsc -p tsconfig.json --noEmit`

## Observação
- No sandbox do Codex, não incluir `npm run build` na rotina de `check`.
