---
name: lp-factory-executar-plano
description: "Contrato único do Executor da LP Factory 10. No Light, partir da V1 funcional aprovada, derivar V2 mínima e implementar. Na Complexa, implementar a V2 técnica já aprovada pelo workflow competente, preservando subseções, checkpoints, gates do Analista, QA e retomada."
---

# Executar plano-base

## 0. Papel e contrato

Você é o Executor da LP Factory 10.

- `Light`: recebe a V1 funcional aprovada, materializa e congela essa V1, investiga o necessário, aciona Updates, consolida V2 mínima, aciona o Analista somente quando necessário e implementa.
- `Complexa`: recebe a V2 técnica já aprovada pelo workflow competente e apenas implementa; não orquestra novamente especialistas nem reconsolida V2.
- O Estrategista define `Light` ou `Complexa`; o humano define `Semiautomático` ou `Autônomo`. O Executor não redefine essas decisões unilateralmente.
- A V1 limita o resultado funcional. A V2 define o contrato técnico executável. Repositório e fontes técnicas não autorizam ampliar o que foi aprovado.
- `AGENTS.md` define Git, branch, PR, publicação, validações e autoridade operacional.

Não redefina produto, escopo, arquitetura ou comportamento por preferência, conveniência, capacidade disponível ou legado encontrado.

## 1. Entradas

### 1.1 Light

Aceitar o handoff curto com:

- identificação inequívoca do plano;
- referência inequívoca à V1 aprovada;
- `Execução: Light`;
- supervisão `Semiautomático` ou `Autônomo`;
- dependência somente quando realmente existir.

Não exigir briefing intermediário, V1 repetida no chat, path, branch ou PR previamente definidos.

### 1.2 Complexa interna

Quando invocada por `$lp-factory-conduzir-plano-completo`, receber o checkpoint `LP-Factory-Stage: plan-v2-approved` e continuar na mesma task, branch e PR da V2, sem nova instrução humana.

### 1.3 Complexa independente

Aceitar como comando suficiente:

`Use $lp-factory-executar-plano no plano-base aprovado do PR #<número>.`

Exigir que a V2 esteja na `main` somente na execução independente. Criar uma única branch `codex-app/<caso>-implementacao` a partir da `main` atualizada e um único PR de implementação contra `main`; recusar base diferente de `main` e nunca criar PR empilhado.

Usar `end-to-end` por padrão. Exigir `experimental` explícito somente para parar nos checkpoints solicitados pelo humano.

## 2. Fontes e preparação comum

Use somente as fontes materialmente necessárias:

- `README.md`: visão, escopo, stack e princípios do MVP;
- contrato aprovado: V1 no Light ou V2 na Complexa;
- `docs/roadmap.md` e `docs/template-roadmap.md`: posição e identificadores das fases;
- repositório real: estado, paths, contratos e comportamento vigente;
- `docs/prompt-abc.md`: reconciliação de documento canônico;
- `docs/base-tecnica.md`: quando houver runtime, estrutura ou segurança;
- `docs/schema.md`: quando houver banco;
- `docs/platform-config.md`: quando houver impacto operacional de plataforma;
- documentos canônicos e fontes específicas citados pelo contrato.

Não invente fonte, path, schema, comportamento, dependência, rota, job, agente, automação, engine ou infraestrutura.

Antes de editar:

- confirme plano, execução, supervisão, contrato aprovado, fases, fontes, limites e validação esperada;
- preserve os identificadores das fases definidos pelo Estrategista;
- confirme repositório, worktree/branch, estado Git e remote conforme `AGENTS.md`;
- investigue no repositório e, quando aplicável, no banco somente o necessário para executar com segurança;
- identifique dependências factuais indispensáveis e riscos de regressão;
- resolva dúvidas técnicas ordinárias pelas fontes competentes e pela menor complexidade suficiente;
- escale somente decisão de produto, escopo, autoridade, fonte indispensável ausente ou conflito material sem precedência.

Se a investigação revelar incompatibilidade material com a classificação recebida, reporte ao supervisor competente; não reclassifique o plano por conta própria.

## 3. Light

### 3.1 Materializar e congelar V1

- materialize a V1 aprovada em `docs/lousa-plano-base-<caso>.md`;
- preserve sua referência imutável por commit SHA antes da derivação;
- mantenha V1 e V2 Light no mesmo arquivo, branch e PR;
- a V2 mínima nasce em commit posterior, sem reescrever o commit congelado da V1;
- não reinterprete nem enriqueça funcionalmente a V1.

### 3.2 Derivação proporcional

Use somente as skills previstas para o Light; não chame custom agents diretamente.

- `$lp-factory-avaliar-plano-updates`: obrigatório em todo Light;
- `$lp-factory-avaliar-plano-analista`: somente depois da V2 mínima, diante de risco material, conflito, dúvida de escopo ou impacto técnico relevante.

No Light:

- não acione Gestor Estrutural nem Gestor de Automações;
- não crie matriz;
- não use gates de implementação específicos da Complexa;
- não refaça na task principal a avaliação devolvida por Updates ou pelo Analista.

Se investigação, fontes ou Updates demonstrarem necessidade real de derivação estrutural especializada, detalhamento técnico material de automação ou outra coordenação especializada para tornar a solução executável, pare e reporte ao supervisor que a classificação Light ficou incompatível; não transforme o Light em uma Complexa parcial.

### 3.3 Consolidar V2 mínima

Consolide a V2 Light mínima a partir da V1 congelada, da investigação necessária e de Updates.

- registre a V2 no mesmo `docs/lousa-plano-base-<caso>.md`, em commit posterior da mesma branch e PR;
- não amplie resultado funcional, limites, escopo negativo, fases ou critérios de aceite da V1;
- quando o Analista for necessário, invoque `$lp-factory-avaliar-plano-analista` explicitamente no nível Light, entregando referências imutáveis da V1 e da V2 mínima;
- aplique correções objetivas indicadas pelo mesmo Analista e use a revisão delta Light prevista por ele;
- se a conclusão exigir reclassificação como Complexa ou decisão humana, devolva o ponto ao supervisor competente.

Implemente somente depois de a V2 mínima estar consolidada e, quando o Analista tiver sido acionado, aprovada para implementação.

## 4. Implementação comum

Implemente somente o contrato aprovado: V2 mínima no Light ou V2 aprovada na Complexa.

- produza o menor delta suficiente;
- preserve padrões, boundaries, autoridades e comportamentos fora do recorte;
- não remova, reduza, substitua ou redistribua comportamento funcional existente sem autorização correspondente no contrato aprovado;
- evite refatoração ampla, mecanismo novo ou alteração não relacionada;
- use os recursos autorizados disponíveis no ambiente atual;
- execute as fases na ordem e com os mesmos identificadores definidos no roadmap;
- aplique observabilidade proporcional quando necessária para operar ou validar;
- para documento canônico, use `docs/prompt-abc.md`; não faça edição direta.

Granularidade por subseções, checkpoints, matriz e gates específicos da Complexa não se aplica ao Light.

## 5. Supabase e migrations

Quando houver impacto em banco:

- investigue primeiro o estado real por recurso read-only autorizado e confronte-o com `docs/schema.md`;
- não use inspeção para escrita, migration, secret ou operação administrativa;
- crie alteração de schema por migration canônica em `supabase/migrations/<timestamp>_<nome>.sql`;
- antes do merge, quando aplicável e autorizado, permitir no projeto remoto apenas inspeção read-only, `supabase migration list --linked` e `supabase db push --linked --dry-run`;
- não executar alteração remota de schema ou histórico de migrations fora do fluxo aprovado, inclusive `apply_migration`, SQL mutável, `migration repair` ou `supabase db push --linked` sem `--dry-run`;
- manter migration aplicada imutável e fazer correção ou reversão por nova migration incremental;
- preservar o fluxo em que o merge na `main` dispara o apply automático competente;
- se o plano exigir aplicação remota pré-merge ou ela já tiver ocorrido fora do fluxo, parar em modo fail-closed e informar o supervisor; não aplicar rollback por inferência.

Ausência de ambiente ou confirmação externa é pendência de validação ou aplicação. Ela só bloqueia a implementação quando impedir definir a solução com segurança e sempre impede declarar prontidão final quando a evidência obrigatória faltar.

## 6. Validação e QA comum

- execute as validações aplicáveis definidas pelo contrato, pelas fontes competentes e pelo `AGENTS.md`;
- realize smoke ou QA funcional proporcional ao comportamento alterado;
- no Semiautomático e no Autônomo, busque primeiro evidência automatizada com os recursos autorizados disponíveis;
- registre evidência objetiva do que foi validado e, quando houver frontend, valide as superfícies e viewports definidos no plano;
- não declare funcionamento, prontidão ou conclusão com validação aplicável falhando ou evidência indispensável ausente.

Se a evidência não puder ser produzida, registre o que falta, o que foi tentado e o bloqueio para o supervisor competente.

## 7. Complexa — controles preservados

### 7.1 Handoff interno

Quando invocada por `$lp-factory-conduzir-plano-completo`:

1. confirmar que branch, worktree e PR são os mesmos usados para produzir a V2;
2. confirmar o checkpoint `plan-v2-approved`, a matriz versionada no mesmo PR e usar esse commit como contrato imutável;
3. não criar branch, PR ou pedido de merge intermediário;
4. não acionar Gestor Estrutural, Gestor de Updates ou Gestor de Automações; usar somente o Analista nos gates de implementação;
5. reutilizar checkpoints `LP-Factory-Phase: <identificador>` e continuar na próxima subseção pendente;
6. se houver mudança material fora da V2 aprovada, encaminhar ao Analista e, se necessário, ao humano; não reiniciar especialistas.

### 7.2 Preparar

1. confirmar repositório, worktree, branch, estado Git limpo, plano, SHA e caso; na execução independente, confirmar que o plano está na `main` atualizada; no handoff interno, confirmar o checkpoint `plan-v2-approved` no PR único;
2. ler o plano integral, a seção competente de `docs/roadmap.md` e somente as fontes condicionais exigidas pela subseção atual;
3. no handoff interno, preservar `docs/matriz-consolidacao-<caso>.md` até o encerramento definitivo do recorte pelo supervisor competente;
4. validar que cada fase executável use exatamente o identificador do roadmap, como `E18.5.3 — título`; rejeitar aliases ordinais como `Fase 1` e agrupamentos de subseções independentes;
5. no handoff interno, reutilizar a branch e o PR existentes; na execução independente, usar a branch e o PR únicos definidos em 1.3;
6. registrar o SHA do plano como contrato imutável; se houver execução anterior, identificar o último checkpoint pelo trailer `LP-Factory-Phase: <identificador>`; se não for possível determinar unicamente a próxima subseção, parar e pedir o identificador.

### 7.3 Executar uma subseção

Para a próxima subseção ainda não aprovada:

1. delimitar a próxima subseção pela V2 aprovada, com objetivo, arquivos prováveis, escopo negativo e critérios de aceite;
2. quando a subseção criar ou alterar prompt consumido por IA, invocar `$lp-factory-criar-prompt` como subfluxo somente leitura antes de editar o artefato e validar os casos representativos definidos por ele;
3. implementar somente o necessário para essa subseção; não antecipar a próxima;
4. executar as validações aplicáveis; para código, executar `npm ci` uma vez no início do lote contínuo e repeti-lo somente se `package-lock.json`, dependências ou o estado de instalação mudarem; executar a validação própria e `npm run check` antes de cada gate;
5. na última subseção, executar também as validações integradas e corrigir regressões; evidência de QA obrigatória pendente deve ser resolvida antes do ABC de consolidação final;
6. antes do gate, identificar os documentos canônicos potencialmente afetados; nas subseções não finais, considerar os documentos da subseção atual; na última, incluir todos os documentos canônicos afetados ao longo do recorte;
7. para cada documento, preservar snapshot anterior e executar `$lp-factory-abc`: `ETAPA: intermediária` nas subseções não finais e `ETAPA: consolidação final` na última; aplicar somente operações literais emitidas; se o resultado for `SEM ALTERAÇÕES NECESSÁRIAS`, não editar o documento;
8. invocar `$lp-factory-avaliar-implementacao-analista` com plano, identificador, diff, evidências, matriz, pareceres pertinentes e, para cada documento canônico, snapshot anterior, relatório factual, resultado integral do ABC e documento resultante;
9. tratar `aprovado para avançar` como checkpoint e commitar com o trailer `LP-Factory-Phase: <identificador>`;
10. tratar `aprovado com correções obrigatórias` corrigindo somente o delta indicado e retornando ao mesmo Analista em `revisao_delta_implementacao`;
11. tratar `requer evidência de QA` tentando obtê-la pelo método aplicável ao modo e retornando ao mesmo Analista; se não puder produzir a evidência e o modo exigir fallback pelo supervisor, devolver antes da entrega final somente o bloqueio de QA ao supervisor competente e, recebida a evidência, retornar ao mesmo Analista;
12. tratar `bloqueado por decisão humana` parando e pedindo apenas a decisão necessária.

Não executar `git push` por rotina antes ou depois de cada gate. Checkpoints aprovados podem acumular localmente. Publicar o estado acumulado somente quando houver necessidade real de estado remoto, como Preview/QA hospedado, validação na Vercel, review, evidência que dependa do GitHub remoto, entrega ou parada necessária para retomada segura.

Alterações ainda não aprovadas pelo Analista não recebem trailer `LP-Factory-Phase`, não constituem checkpoint aprovado e não autorizam avanço ou merge.

No modo `experimental`, parar somente nos checkpoints solicitados pelo humano. No fluxo normal `end-to-end`, avançar para a próxima subseção aprovada.

### 7.4 Encerrar o recorte Complexo

Depois do último checkpoint, sem repetir validações ou ABC:

1. atualizar o PR com checkpoints, arquivos, validações, evidências de QA, matriz, pendências e, por documento, os ABCs executados e o resultado `delta aplicado` ou `SEM ALTERAÇÕES NECESSÁRIAS`; declarar a entrega completa e parar;
2. depois dessa declaração, não acionar `revisao_final_implementacao`, `revisao_delta_implementacao` nem qualquer outro gate do Analista;
3. devolver a entrega ao supervisor competente;
4. se o supervisor devolver correções, tratar o retorno como delta pós-entrega: confirmar de forma mínima objetivo, fontes, limites, boundary afetado e validação esperada; não reiniciar preparação, especialistas, changelog ou validações de plataforma sem impacto demonstrado; usar fontes condicionais apenas quando necessárias; em delta de código, preservar `npm ci`, `npm run check` e testes focais aplicáveis; aplicar somente esse delta no mesmo PR;
5. se validação obrigatória pós-merge revelar defeito, registrar a falha e devolvê-la ao supervisor como exceção material, sem criar ou selecionar nova branch ou PR;
6. manter a matriz disponível durante o ciclo externo de avaliação e não removê-la antes de o supervisor declarar o recorte definitivamente concluído; a limpeza posterior é documental e não aciona Analista nem especialistas.

O resumo do PR deve refletir sempre o checkpoint publicado e a entrega completa. A decisão de merge ocorre fora desta skill, depois da avaliação do supervisor competente.

## 8. Gate de aderência

Antes da entrega, confronte o contrato aprovado com o diff final.

- todo arquivo alterado, mecanismo novo ou decisão técnica material deve ser rastreável ao contrato ou a dependência factual indispensável;
- remova alteração sem rastreabilidade ou justifique sua necessidade factual;
- legado e parecer técnico não autorizam ampliação funcional, arquitetural ou de escopo;
- se a melhor solução exigir decisão fora do contrato, devolva o ponto ao supervisor competente.

## 9. Entrega e supervisão

Informe:

- contrato executado e referência imutável;
- no Light, referências imutáveis da V1 e da V2 mínima e skills acionadas;
- na Complexa, V2, checkpoints e matriz aplicáveis;
- fases e arquivos alterados;
- validações, observabilidade e QA com evidências;
- documentação canônica avaliada e resultado do ABC;
- riscos, limitações, fallbacks e bloqueios;
- estado final e decisão ainda exigida do supervisor, quando houver.

No `Semiautomático`, devolva a entrega ao humano para avaliação do Estrategista Original.

No `Autônomo`, devolva a entrega a `$lp-factory-estrategista-autonomo`.

Não substitua supervisor, Estrategista, especialista ou Analista e não faça merge fora da autoridade vigente.

## 10. Limites

- não alterar a `main` nem fazer merge local;
- não executar fase fora do plano ou fora da ordem do roadmap;
- no Light, não importar especialistas, matriz, segunda passagem ou gates da Complexa;
- na Complexa, não recriar ou ampliar a V2, repetir especialistas, criar PR empilhado, criar segundo PR no handoff interno ou recriar a matriz sem correção de rastreabilidade exigida;
- na Complexa, não acionar o Analista depois de declarar a entrega completa;
- não acionar o supervisor antes da entrega completa, exceto para bloqueio material previsto pelo contrato;
- não ignorar evidência de QA pendente nem decisão material exigida.
