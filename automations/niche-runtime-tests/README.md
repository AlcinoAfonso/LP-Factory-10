# automations/niche-runtime-tests

Subprojeto isolado da automação **Niche Runtime Tests** para validar, em runtime real, o fluxo de criação de conta e preenchimento de `pending_setup` com nichos informados pelo usuário.

## Papel da automação

O núcleo estável desta automação é funcional, não analítico:

- criar conta real com alias `alcinoafonso380+conviteXX@gmail.com`;
- confirmar e-mail pela mailbox programática reutilizada do `validador-final`;
- abrir sessão autenticada;
- preencher o `pending_setup` com nome de projeto e nicho;
- capturar `subdomain`, `email`, `projectName`, `niche`, `finalUrl` e timestamp;
- publicar evidência no Job Summary e no artifact.

Esse núcleo já funciona como teste de funcionamento do fluxo. Verificações rígidas de banco são opcionais e devem ficar presas a presets versionados, porque a expectativa de persistência muda conforme a etapa validada.

## Workflow

GitHub Actions -> `Automation Niche Runtime Tests`

Workflow: `.github/workflows/automation-niche-runtime-tests.yml`

Inputs manuais:

- `app_url`: URL do app ou preview a ser validado.
- `start_sequence`: número inicial do alias `alcinoafonso380+conviteXX@gmail.com`. Default: `100`.
- `niches`: lista livre de nichos separada por `;`. Se preenchida, cria uma conta por nicho e ignora `case_preset`.
- `case_preset`: fallback versionado em `automations/niche-runtime-tests/cases`, sem a extensão `.json`. Default: `niche-resolution-20-6`.
- `verification_mode`: nível de verificação após preencher o setup.
  - `setup_only`: cria as contas, confirma e-mail, preenche `pending_setup` e publica evidência. Não consulta o banco.
  - `niche_resolution_20_6`: executa o preset read-only que valida a expectativa versionada da etapa 20.6 no Supabase.

## Nichos livres

Para testes exploratórios, preencha `niches` diretamente no workflow:

```text
Marketing Digital; Market Digital; Digital marketing
```

Com `start_sequence = 103`, esse exemplo cria três contas:

- `alcinoafonso380+convite103@gmail.com` com nicho `Marketing Digital`;
- `alcinoafonso380+convite104@gmail.com` com nicho `Market Digital`;
- `alcinoafonso380+convite105@gmail.com` com nicho `Digital marketing`.

Use `verification_mode = setup_only` para nichos livres. Nesse modo, o workflow valida criação de conta e preenchimento do setup, mas não tenta decidir se o banco gravou uma resolução correta para uma etapa específica.

## Presets de casos

Para suítes repetíveis, cada conjunto de teste pode ser declarado como JSON em:

```text
automations/niche-runtime-tests/cases/<case_preset>.json
```

Formato:

```json
{
  "cases": [
    {
      "id": "strong_match",
      "label": "Caso 1 - Match forte",
      "sequenceOffset": 0,
      "projectSuffix": "A",
      "niche": "Harmonização Facial"
    }
  ]
}
```

Campos:

- `niche`: obrigatório.
- `id`: opcional, mas recomendado quando houver verificação posterior.
- `label`: opcional, usado no summary.
- `sequenceOffset`: opcional; default é a posição do caso no array.
- `projectSuffix`: opcional; default é `A`, `B`, `C`...
- `projectNameTemplate`: opcional; aceita `{sequence}`, `{suffix}` e `{id}`.

O preset default `niche-resolution-20-6` cria e confirma três contas reais, usando a mailbox programática do `validador-final`, e preenche o `pending_setup`:

- `convite100`: `Harmonização Facial` -> match forte.
- `convite101`: `hof` -> alias.
- `convite102`: `Beleza Facial` -> sem candidato claro.

Se `start_sequence` for alterado, os três casos usam `start_sequence`, `start_sequence + 1` e `start_sequence + 2`. Os nomes dos projetos acompanham a sequência usada.

## Preset de validação no banco

A validação no banco é opcional porque a expectativa muda por etapa. O modo `niche_resolution_20_6` exige o `case_preset` `niche-resolution-20-6`, consulta o Supabase com `SUPABASE_DB_URL_READONLY` e valida a evidência versionada daquela etapa.

Contrato de uso:

- não usar `niche_resolution_20_6` para nichos livres;
- não generalizar expectativas do preset 20.6 para etapas futuras;
- quando a regra de produto mudar, criar novo preset/versionamento em vez de reaproveitar expectativa antiga.

Observação histórica: após a evolução do vínculo determinístico oficial, match forte pode gravar `account_taxonomy`. Portanto, a ausência de linha em `account_taxonomy` não deve ser usada como expectativa genérica da automação. Ela só vale se estiver explicitamente prevista em um preset antigo ou em uma etapa que ainda exija esse comportamento.

## Secrets usados

Valores secretos não devem ser versionados. O workflow espera os seguintes GitHub Actions repository secrets:

- `MAILBOX_EMAIL`: caixa postal base usada para ler e-mails de confirmação.
- `MAILBOX_PASSWORD`: senha de app da mailbox usada por POP3.
- `SUPABASE_DB_URL_READONLY`: connection string read-only para verificar evidência no banco quando `verification_mode` não for `setup_only`.

## Evidência

O workflow escreve o resumo no Job Summary e publica o artifact `niche-runtime-results` com os subdomínios criados e os dados necessários para auditoria.

## Cleanup

Não há cleanup automático neste piloto. As contas criadas ficam preservadas como evidência funcional e podem ser excluídas manualmente depois da análise.
