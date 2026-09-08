# QA transacional determinístico

Boundary local e on-demand da E17.9. O Executor escolhe o cenário; este subprojeto valida o contrato, seleciona uma fixture institucional por correspondência exata, verifica readiness e devolve evidência sanitizada. Ele não decide qual teste executar.

## Estado da E17.9.3

- Contrato e catálogo não secreto materializados.
- Catálogo operacional vazio até a reconciliação factual da E17.9.4.
- Adapters registrados como contratos, mas não materializados.
- Readiness inicial fail-closed: `mailbox_consumer_missing`, `credential_resolution_unproven` e `session_isolation_unproven`.
- Nenhuma autenticação, mutação, mailbox, workflow, job, service, rota, banco ou chamada de rede é executada.
- A revisão factual separada das oito operações está registrada em [`READINESS_E17_9_4.md`](./READINESS_E17_9_4.md); nenhuma delas autorizou materialização de adapter neste checkpoint.

## Uso

```powershell
npm ci
npm run check
Get-Content .\cenario.json -Raw | node .\run.mjs
```

O runner aceita JSON por `stdin` ou o path de um JSON como único argumento. O arquivo deve conter:

- `scenario`: versão `1`, critério, cenário, ambiente exato, estado requerido, operações permitidas e proibidas, estado final, limite de uma a três tentativas e plano opcional de criação ou reconfiguração;
- `attempt`: tentativa positiva;
- `observation`: observação opcional que será sanitizada.

Catálogo e readiness são fontes autoritativas internas do boundary e não podem ser sobrescritos pelo chamador. Na E17.9.3, o catálogo institucional permanece vazio e o readiness permanece no estado fail-closed aprovado.

O estado requerido e cada fixture distinguem identidade funcional, finalidade, ambiente, conta, tenant, papel, status, autoridade de plataforma, condição comercial, lifecycle e capacidades. Referências de credencial ou mailbox são somente identificadores opacos iniciados por `ref:`.

## Resultados estáveis

- `fixture_selected`: exatamente uma fixture atende ao estado e às capacidades.
- `fixture_missing`: nenhuma fixture atende ao estado.
- `fixture_ambiguous`: mais de uma fixture atende exatamente.
- `capability_mismatch`: o estado existe, mas suas capacidades não correspondem exatamente ao menor privilégio requerido.
- `capability_unavailable`: readiness ou adapter não permite a operação.
- `max_attempts_exceeded`: o limite aprovado foi excedido.

Resultado bloqueado é esperado enquanto uma capacidade obrigatória não estiver comprovada. O Executor não pode contornar esse estado, escolher por aproximação nem materializar adapter por inferência.

## Segurança e limites

- Nunca fornecer senha, token, código, cookie, sessão, URL assinada, conteúdo bruto da mailbox ou cabeçalho de autorização.
- Não registrar valores de secrets nem usar conta pessoal.
- Não colocar regra de domínio no runner; os adapters futuros deverão consumir somente boundaries públicos ou administrativos já autorizados.
- Convite futuro deve consumir exclusivamente `inviteAccountMember`.
- Conta e entitlement permanecem separados; o adapter de conta não concede condição comercial.
- Navegação visual, UI, acessibilidade e criação ou edição de Landing Pages não pertencem a este boundary.

## Validação

`npm run check` verifica a sintaxe e executa casos determinísticos de schema, menor privilégio, dimensões do catálogo, seleção exata, ausência, ambiguidade, sobreprivilégio, criação, reconfiguração, idempotência, pós-condições, limite de tentativas, autoridade do catálogo/readiness, ambiente e sanitização adversarial.
