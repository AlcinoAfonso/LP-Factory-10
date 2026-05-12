# automations/niche-runtime-tests

Piloto de automacao runtime para validar o fluxo real de `pending_setup` com persistencia de resolucao de nicho.

## Workflow

GitHub Actions -> `Automation Niche Runtime Tests`

Inputs manuais:

- `app_url`: URL do app ou preview a ser validado.
- `start_sequence`: numero inicial do alias `alcinoafonso380+conviteXX@gmail.com`. Default: `100`.
- `verification_mode`: nivel de verificacao apos preencher o setup.
  - `setup_only`: cria as contas, confirma email, preenche `pending_setup` e publica evidencia. Nao consulta o banco.
  - `niche_resolution_20_6`: executa o preset read-only que valida a expectativa da etapa 20.6 no Supabase.

## Casos cobertos

O workflow cria e confirma tres contas reais, usando a mailbox programatica do `validador-final`, e preenche o `pending_setup`:

- `convite100`: `Harmonização Facial` -> match forte.
- `convite101`: `hof` -> alias.
- `convite102`: `Beleza Facial` -> sem candidato claro.

Se `start_sequence` for alterado, os tres casos usam `start_sequence`, `start_sequence + 1` e `start_sequence + 2`. Os nomes dos projetos acompanham a sequencia usada.

## Nucleo estavel

O nucleo estavel da automacao e:

- criar conta real;
- confirmar email;
- abrir sessao autenticada;
- preencher `pending_setup`;
- capturar `subdomain`, `email`, `projectName`, `niche`, `finalUrl` e timestamp;
- publicar evidencia no Job Summary e no artifact.

Esse nucleo ja funciona como teste de funcionamento do fluxo.

## Preset de validacao no banco

A validacao no banco e opcional porque a expectativa muda por etapa. No preset `niche_resolution_20_6`, a etapa read-only consulta o Supabase com `SUPABASE_DB_URL_READONLY` e valida:

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
- `SUPABASE_DB_URL_READONLY`: connection string read-only para verificar evidencia no banco quando `verification_mode` nao for `setup_only`.

## Evidencia

O workflow escreve o resumo no Job Summary e publica o artifact `niche-runtime-results` com os subdominios criados e os dados necessarios para auditoria.

## Cleanup

Nao ha cleanup automatico neste piloto. As contas criadas ficam preservadas como evidencia funcional.
