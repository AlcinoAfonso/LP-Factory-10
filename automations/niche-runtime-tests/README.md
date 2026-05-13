# automations/niche-runtime-tests

Piloto de automacao runtime para validar o fluxo real de `pending_setup` com persistencia de resolucao de nicho.

## Papel da automacao

O nucleo estavel desta automacao e funcional:

- criar conta real;
- confirmar email;
- abrir sessao autenticada;
- preencher `pending_setup`;
- capturar `subdomain`, `email`, `projectName`, `niche`, `finalUrl` e timestamp;
- publicar evidencia no Job Summary e no artifact.

Esse nucleo ja funciona como teste de funcionamento do fluxo. Verificacoes rigidas de banco sao opcionais e devem ficar presas a presets versionados, porque a expectativa de persistencia muda conforme a etapa validada.

## Workflow

GitHub Actions -> `Automation Niche Runtime Tests`

Inputs manuais:

- `app_url`: URL do app ou preview a ser validado.
- `start_sequence`: numero inicial do alias `alcinoafonso380+conviteXX@gmail.com`. Default: `100`.
- `niches`: lista livre de nichos separada por `;`. Se preenchida, cria uma conta por nicho e ignora `case_preset`.
- `case_preset`: fallback versionado em `automations/niche-runtime-tests/cases`, sem a extensao `.json`. Default: `niche-resolution-20-6`.
- `verification_mode`: nivel de verificacao apos preencher o setup.
  - `setup_only`: cria as contas, confirma email, preenche `pending_setup` e publica evidencia. Nao consulta o banco.
  - `niche_resolution_20_6`: executa o preset read-only que valida a expectativa versionada da etapa 20.6 no Supabase.

## Nichos livres

Para testes exploratorios, preencha `niches` diretamente no workflow:

```text
Marketing Digital; Market Digital; Digital marketing
```

Com `start_sequence = 103`, esse exemplo cria tres contas:

- `alcinoafonso380+convite103@gmail.com` com nicho `Marketing Digital`;
- `alcinoafonso380+convite104@gmail.com` com nicho `Market Digital`;
- `alcinoafonso380+convite105@gmail.com` com nicho `Digital marketing`.

Use `verification_mode = setup_only` para nichos livres. Nesse modo, o workflow valida criacao de conta e preenchimento do setup, mas nao tenta decidir se o banco gravou uma resolucao correta para uma etapa especifica.

## Presets de casos

Para suites repetiveis, cada conjunto de teste pode ser declarado como JSON em:

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

- `niche`: obrigatorio.
- `id`: opcional, mas recomendado quando houver verificacao posterior.
- `label`: opcional, usado no summary.
- `sequenceOffset`: opcional; default e a posicao do caso no array.
- `projectSuffix`: opcional; default e `A`, `B`, `C`...
- `projectNameTemplate`: opcional; aceita `{sequence}`, `{suffix}` e `{id}`.

O preset default `niche-resolution-20-6` cria e confirma tres contas reais, usando a mailbox programatica do `validador-final`, e preenche o `pending_setup`:

- `convite100`: `Harmonização Facial` -> match forte.
- `convite101`: `hof` -> alias.
- `convite102`: `Beleza Facial` -> sem candidato claro.

Se `start_sequence` for alterado, os tres casos usam `start_sequence`, `start_sequence + 1` e `start_sequence + 2`. Os nomes dos projetos acompanham a sequencia usada.

## Preset de validacao no banco

A validacao no banco e opcional porque a expectativa muda por etapa. O modo `niche_resolution_20_6` exige o `case_preset` `niche-resolution-20-6`, consulta o Supabase com `SUPABASE_DB_URL_READONLY` e valida a evidencia versionada daquela etapa.

Contrato de uso:

- nao usar `niche_resolution_20_6` para nichos livres;
- nao generalizar expectativas do preset 20.6 para etapas futuras;
- quando a regra de produto mudar, criar novo preset/versionamento em vez de reaproveitar expectativa antiga.

Observacao historica: apos a evolucao do vinculo deterministico oficial, match forte pode gravar `account_taxonomy`. Portanto, a ausencia de linha em `account_taxonomy` nao deve ser usada como expectativa generica da automacao. Ela so vale se estiver explicitamente prevista em um preset antigo ou em uma etapa que ainda exija esse comportamento.

## Secrets usados

Valores secretos nao devem ser versionados. O workflow espera os seguintes GitHub Actions repository secrets:

- `MAILBOX_EMAIL`: caixa postal base usada para ler emails de confirmacao.
- `MAILBOX_PASSWORD`: senha de app da mailbox usada por POP3.
- `SUPABASE_DB_URL_READONLY`: connection string read-only para verificar evidencia no banco quando `verification_mode` nao for `setup_only`.

## Evidencia

O workflow escreve o resumo no Job Summary e publica o artifact `niche-runtime-results` com os subdominios criados e os dados necessarios para auditoria.

## Cleanup

Nao ha cleanup automatico neste piloto. As contas criadas ficam preservadas como evidencia funcional e podem ser excluidas manualmente depois da analise.
