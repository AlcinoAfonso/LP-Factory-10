# Fronteiras de Seguranca

## Regra central

O agente pode ter acesso amplo e ser tratado como agente de confianca, mas nao pode revelar material secreto. Confianca operacional nao remove a obrigacao de minimizacao de segredo.

## Permitido

- Listar nomes de secrets, chaves e variaveis.
- Auditar escopo, ambiente, permissao, idade, data de criacao, data de atualizacao e ultimo uso quando a plataforma oferecer esses campos.
- Verificar se uma chave esta presente ou ausente.
- Classificar risco de exposicao, excesso de permissao, duplicidade, expiracao, falta de rotacao ou ambiente incorreto.
- Recomendar rotacao, remocao, reducao de escopo ou segregacao por ambiente.
- Usar valores mascarados automaticamente pela plataforma.

## Proibido

- Imprimir valor completo ou parcial suficiente para reconstruir secret.
- Copiar secret para chat, arquivo, log, issue, PR, prompt, automacao ou relatorio.
- Exportar arquivo de credenciais.
- Criar, rotacionar, revogar ou substituir chaves sem autorizacao explicita.
- Testar segredo em servico externo sem autorizacao explicita.
- Mudar permissao, role, policy, branch protection, deploy, production config, billing ou banco de dados sem autorizacao explicita.

## Se um segredo aparecer acidentalmente

1. Parar a leitura daquele campo.
2. Nao repetir o valor.
3. Referir-se ao item por nome e plataforma.
4. Informar que o valor apareceu em contexto sensivel e recomendar rotacao se houver risco de exposicao no transcript, log ou arquivo.

## Linguagem de relatorio

Usar:

- `presente`
- `ausente`
- `mascarado pela plataforma`
- `valor nao exibido`
- `escopo amplo`
- `escopo adequado`
- `rotacao recomendada`
- `risco alto/medio/baixo`

Evitar:

- trechos de token;
- prefixos longos;
- capturas de tela com secrets;
- dumps de configuracao sem redacao.

