# automations/authenticated-qa

Subprojeto isolado para jornadas autenticadas repetíveis no Account Dashboard e no Admin Dashboard, sem repasse de senha entre tasks ou login humano por PR.

## Configuração

GitHub Actions repository secrets:

- `QA_ACCOUNT_EMAIL`
- `QA_ACCOUNT_PASSWORD`
- `QA_ADMIN_EMAIL`
- `QA_ADMIN_PASSWORD`

GitHub Actions repository variable:

- `QA_ACCOUNT_SUBDOMAIN`

Os valores não são entregues ao Codex nem registrados em logs, relatórios ou artifacts.

## Cenários

- `access_gates`: Account Dashboard positivo, bloqueio administrativo da identidade comum e Admin Dashboard positivo;
- `create_landing_page`: repete os gates e cria uma Landing Page identificada pela execução, somente em Preview.

## Execução local

```bash
npm ci
npm run check
npx playwright install --with-deps chromium
npm run start
```

O runtime exige `APP_URL_OVERRIDE`, `AUTHENTICATED_QA_SCENARIO` e as cinco configurações de identidade listadas acima.

## Evidências

- Job Summary com gates e rotas sem credenciais;
- artifact `authenticated-qa-results` com relatório JSON e screenshots das superfícies restritas à conta de teste e à estrutura administrativa sem dados de clientes;
- retenção do artifact por 7 dias.

## Limites

- não cria nem promove identidades, memberships, entitlement ou `platform_admin`;
- aceita somente Production e Previews do projeto `lp-factory-10` na equipe Vercel autorizada e revalida a origem antes de preencher credenciais;
- o cenário mutante recusa explicitamente o domínio oficial de Production;
- novos comportamentos de QA exigem cenário versionado e revisão em PR.
