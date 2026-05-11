# automations/niche-runtime-tests

Piloto de automacao runtime para validar o fluxo real de `pending_setup` com persistencia de resolucao de nicho.

## Workflow

GitHub Actions -> `Automation Niche Runtime Tests`

Inputs manuais:

- `app_url`: URL do app ou preview a ser validado.
- `start_sequence`: numero inicial do alias `alcinoafonso380+conviteXX@gmail.com`. Default: `100`.

## Casos cobertos

O workflow cria e confirma tres contas reais, usando a mailbox programatica do `validador-final`, e preenche o `pending_setup`:

- `convite100`: `Harmonização Facial` -> match forte.
- `convite101`: `hof` -> alias.
- `convite102`: `Beleza Facial` -> sem candidato claro.

Se `start_sequence` for alterado, os tres casos usam `start_sequence`, `start_sequence + 1` e `start_sequence + 2`.

## Validacao no banco

A etapa read-only consulta o Supabase com `SUPABASE_DB_URL_READONLY` e valida:

- conta criada e `accounts.status = active`;
- `account_profiles.niche` igual ao input;
- `account_niche_resolutions.raw_input` igual ao input;
- status esperado em `account_niche_resolutions.resolution_status`;
- `selected_taxon_id` e `score` preenchidos quando o caso exige match forte;
- `match_source` contendo `alias` no caso de alias;
- nenhuma linha criada em `account_taxonomy`.

## Secrets usados

Valores secretos nao devem ser versionados. O workflow espera os seguintes GitHub Actions repository secrets:

- `MAILBOX_EMAIL`: caixa postal base usada para ler emails de confirmacao.
- `MAILBOX_PASSWORD`: senha de app da mailbox usada por POP3.
- `SUPABASE_DB_URL_READONLY`: connection string read-only para verificar evidencia no banco.

## Evidencia

O workflow escreve o resumo no Job Summary e publica o artifact `niche-runtime-results` com os subdominios criados e os dados necessarios para auditoria.

## Cleanup

Nao ha cleanup automatico neste piloto. As contas criadas ficam preservadas como evidencia funcional.
