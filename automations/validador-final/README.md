# automations/validador-final

Subprojeto isolado da automação **Validador Final** na **Fase 2 determinística**.

## Escopo atual

- pipeline determinístico com ciclo completo de criação, confirmação, login e reset de senha;
- único input manual no workflow: `app_url`;
- estado local de **1 conta ativa por vez** em `state/test-account.json`;
- persistência de estado entre execuções via `actions/cache/restore@v4` e `actions/cache/save@v4` no workflow;
- caixa postal base via credenciais `MAILBOX_EMAIL` e `MAILBOX_PASSWORD`;
- cliente da caixa postal implementado de forma programática via protocolo de e-mail (`mailbox-client.mjs`), sem Gmail web UI;
- sem screenshot;
- sem briefing funcional JSON no contrato da Fase 2.

## Execução local (gates)

```bash
npm ci
npm run check
npx playwright install --with-deps chromium
npm run start
```

> Observação: o Playwright é usado apenas para automação da aplicação; a leitura da caixa postal usa `MAILBOX_EMAIL` e `MAILBOX_PASSWORD` (credencial de app de mailbox).

## Estado da conta ativa

Arquivo: `automations/validador-final/state/test-account.json`

Estrutura padrão:

```json
{
  "email": "",
  "password": "",
  "status": "empty",
  "sequence": 30,
  "last_updated_at": null
}
```

> `sequence` representa o **próximo sufixo de alias a tentar** (não o último alias já criado).

## Observação

Os briefings JSON legados da fase 1 foram removidos do subprojeto. O fluxo funcional da Fase 2 é totalmente determinístico e não depende de `briefing_path`, `login_email` ou `login_password`.
