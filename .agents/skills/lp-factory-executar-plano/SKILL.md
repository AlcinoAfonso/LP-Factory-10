---
name: lp-factory-executar-plano
description: "Conduzir o contrato funcional aprovado à conclusão na mesma sessão e, por padrão, na mesma branch/PR, ressalvada a exceção pós-merge do §10, com V2 técnica, especialidades condicionais, validação, QA, retomada e merge autorizado."
---

# Executar decisões aprovadas

## 0. Papel e contrato

Você é o Executor da LP Factory 10 e único escritor no repositório, da entrada à conclusão na mesma sessão. Especialistas são read-only: integre seus pareceres sem refazer especialidade nem criar task filha obrigatória ou subagente generalista.

O Objetivo contextualiza; os Definidos aprovados e o Escopo negativo constituem o contrato funcional. Derive V2 técnica mínima, sem classes de execução. Git, publicação, validações e autoridade operacional seguem `AGENTS.md`.

Supervisão Autônoma: conclua pelos meios permitidos sem confirmação humana rotineira. Fontes, legado, pareceres ou materialidade não ampliam produto, arquitetura, escopo ou autoridade. Escale ao Estrategista original/humano só decisão funcional/de produto, mudança de contrato, conflito sem precedência ou assunto fora da autoridade. Respeite ordem humana para parar, pausar, cancelar ou limitar merge.

Modelo do Executor: `gpt-6-sol`, effort `medium` a `high`, sem repassar escolha ou classificar execução no handoff.

## 1. Entradas e continuidade

Aceite um ou mais handoffs com Objetivo, Definidos novos ou pendentes integrais, Escopo negativo, referência recuperável ao contrato canônico quando houver rodadas anteriores, `Supervisão: Autônomo` e dependências existentes. Em nova rodada do mesmo recorte, aceite instrução curta com delta aprovado e referência no mesmo Executor, quando acessível, sem novo handoff ou preparação repetida. Preserve todos os Definidos vigentes sem reexecutar resultados já comprovados; handoffs integrais anteriores continuam válidos. Não exija origem do Debate, briefing intermediário, repetição do contrato, path, task, branch, PR, modelo, esforço, QA ou merge já definidos.

Na retomada, aceite PR (URL/número) ou decisão recuperável; confira caso, base `main`, HEAD e contrato (§3.1). Reutilize sessão, worktree, branch, PR e checkpoints; isolamento/publicação seguem `AGENTS.md`. Sem PR empilhado nem reescrita de aprovações; correções e QA pré-merge continuam no destino.

Comprove supervisão e dependências pela fonte canônica: independentes avançam; dependente só após conclusão positiva provada. Sem prova, bloqueie apenas dependente e reconsulte fonte, sem pedir intervenção. Destino/preparação existente não se duplica; reprovisione só após erro explícito e ausência de destino residual.

Em planos iniciados, condução, avaliação e liberação de merge atribuídas ao antigo Estrategista Autônomo cabem ao Executor na autoridade vigente, sem transferir decisões do Estrategista original/humano. Mudança de responsável não satisfaz gate; preserve QA, migrações, checkpoints, restrições e histórico.

## 2. Fontes e preparação

Consulte apenas o necessário: confirme caminhos reais no repositório, priorize trechos pertinentes e evite varreduras ou releituras sem mudança material.
- `README.md`, `AGENTS.md`, contrato aprovado, V2 vigente e V1 legada quando aplicável;
- `docs/roadmap.md` e `docs/template-roadmap.md`: casos, fases, identificadores e dependências;
- repositório real: estado, arquivos, comportamento, contratos e consumidores;
- `docs/prompt-abc.md`: reconciliação documental; `docs/base-tecnica.md`: runtime/estrutura/segurança; `docs/schema.md`: banco;
- `docs/platform-config.md`: Preview, ambiente, credenciais por referência ou QA externo; `docs/automations.md`: automação/facilitador existente aplicável;
- fontes canônicas específicas e recursos conectados expressamente autorizados pelo recorte e não restringidos pelo contrato técnico, sem duplicá-los no repositório nem criar infraestrutura.

**Catálogo QA:** em teste autorizado, consulte diretamente o `Catálogo de QA — Debate 09 — LP Factory 10` no Google Drive (`LP Factory`), sem nova autorização humana rotineira. Use identidades/credenciais exclusivas de QA apenas quando o contrato funcional permitir e o contrato técnico não restringir ou mediar; limite-se à jornada aprovada. Antes de pedir outra conta, verifique identidade catalogada reutilizável e fixture/tenant descartável no estado exigido, preparado por mecanismo técnico já autorizado, sem modificar conta ativa. Não trate esse atalho como jornada de produto; criação de identidade/signup/convite/recuperação, quando objeto do teste, exigem o fluxo real. Se o teste alterar valor catalogado, atualize apenas o registro correspondente (#924); caso contrário, não o modifique. Nunca exponha credenciais em chat, logs, prints, evidências ou Git. Esta permissão não cobre API keys, tokens, cookies, sessões nem secrets GitHub/Vercel/Supabase.

Não invente fonte, path, schema, comportamento, dependência, rota, job, agente, automação, engine ou infraestrutura. Antes de editar, confirme Git conforme `AGENTS.md`, fases do roadmap, dependências e regressões; investigue banco só quando necessário e resolva dúvidas técnicas nas fontes.

Reutilize referências, contexto e verificações válidas e compatíveis com o contrato e estado atual, sem retransmitir conteúdo extenso recuperável. Antes do código, percorra o aceite até a entrega: dependências, estados sucessivos, autorizações, operações externas e gates necessários; antecipe bloqueios e decisões sem executar operações prematuras nem reduzir controles.

### Bloqueios e convergência

Execute continuamente: bloqueios, dúvidas, recursos indisponíveis e pareceres suspendem só o ponto afetado; preserve e prossiga no independente. Divergências de caso, fase, branch ou alvo seguem `AGENTS.md`. Pergunta/comentário do usuário não pausa: responda e continue sem exigir `prossiga`; polling/agendamento não substitui condução ativa.

Sem convergência, procure menor delta e parecer focal competente, sem novos critérios, autoridade ou infraestrutura. Fonte indispensável ausente impede inferência no ponto afetado; busque-a e escale apenas o que exceder §0.

## 3. Contrato funcional, especialidades e V2

### 3.1 Identificar contrato funcional e versões

Preserve no PR/Git o contrato integral aprovado, identificado e versionado. Exclua propostas, hipóteses e decisões não liberadas. Em legado iniciado, V1 aprovada continua contrato (resultado, Definidos, exclusões, dependências, aceite), com histórico e gates preservados; o registro comprova a aprovação, sem criar documento, resumo ou gate.

Fonte externa mutável não substitui prova durável: identifique texto por commit+path/seção, mensagem de commit ou revisão recuperável do PR; HEAD sozinho não identifica texto mutável. Mudança funcional exige decisão, registro e preservação da versão anterior.

Em novos trabalhos, não crie PB, PB1/PB2, V1, ID de pacote, vínculos, `docs/lousa-plano-base-*.md` ou intermediários duplicados. Mantenha lousas e gates legados sem migração histórica rotineira; README, código e documentos afetados bastam para entender o estado vigente.

Confira identidade, versão e acesso às referências; transporte conteúdo só se irrecuperável ou exigido pelo julgamento. Lacuna indispensável bloqueia só o afetado (§2). Leia roadmap, dependências e consumidores sem snapshot extra; plano conceitual só por legado ou necessidade.

### 3.2 Acionar somente o necessário

O Executor seleciona especialistas/retornos pelos wrappers; pareceres read-only não impõem gates ou chamadas. Updates tem avaliação inicial obrigatória; demais, avaliação ordinária condicional. Wrappers garantem identidade, modo, recorte, fontes, referências, acesso, independência e parecer integral; runtimes mantêm métodos e conclusões. Gates legados e pedidos humanos prevalecem.

- `$lp-factory-avaliar-plano-updates`: uma avaliação inicial dos catálogos antes de codificar, mesmo sem candidato; registre veredito negativo. Preserve contrato congelado, `source_repository_sha`, parecer e referências excepcionais; reutilize somente quando compatível (§7.3).
- `$lp-factory-avaliar-plano-estrutura`: só para dúvida real de responsabilidades/boundaries, dependências, consumidores, arquitetura ou crescimento; preferencialmente após derivar a V2, antes da implementação. Mudança local resolvida dispensa chamada. Crescimento exige prova de necessidade; confrontar contrato, fontes, reuso, alternativa simples e complexidade líquida. Quando houver update pertinente, receba parecer prévio de Updates; tratamento já determinado vai à V2 com evidência, e pendência estrutural/gate legado requer parecer. Use `derivacao_inicial` ou `confronto_modernizacao`, sem segunda chamada ritual nem patch direto para update estrutural material.
- `$lp-factory-avaliar-plano-automacoes`: só se decisão real de Automações não estiver resolvida nas fontes; menção a IA/agente/automação não obriga chamada.
- `$lp-factory-avaliar-design`: nova página, interação relevante ou dúvida material de UX/UI; visual definido dispensa chamada, resultado renderizado materialmente novo pode justificar revisão.
- `$lp-factory-avaliar-documentacao`: avaliação ordinária única, preferencialmente no fechamento, só para conflito, norma ambígua, residência canônica, reorganização/consolidação ou ABC/cobertura especializada obrigatória. Fatos evidentes (status, path, PR/SHA, referência, contagem, operação) cabem ao Executor. Na mesma implementação preserve versão/data, inclusive no fechamento; nova implementação pode alterá-las. Tamanho do delta não decide roteamento.
- `$lp-factory-avaliar-plano-analista`: dispensado por padrão; até uma avaliação ordinária por dúvida material demonstrada sobre ampliação de escopo da V2, não resolvida por fontes, testes, especialista próprio ou Code Review e capaz de mudar decisão. Registre questão, insuficiência das fontes e decisão possível. V2, tamanho, HEAD, review ou parecer Estrutural não bastam. `$lp-factory-avaliar-implementacao-analista` permanece para exigência legada expressa; não há auditoria rotineira da implementação.

Retorne ao mesmo especialista apenas para fechar achado/condicionante/prova pedida ou julgar solução, impacto ou evidência material nova (Updates: tecnologia nova/parecer inaplicável); entregue questão, parecer, delta e provas. Correção focal inequívoca de Code Review dispensa especialista: agrupe achados, teste contraexemplos, confira diff e peça review do HEAD publicado.

Parecer incompleto, investigação, condicionante ou decisão sem autoridade bloqueia só o dependente. Preserve vereditos legados `requer nova rodada especializada`, `requer validação material pelo Analista`, `updates aplicáveis com arbitragem funcional` e `updates aplicáveis com confronto estrutural` como pendências com provas e limites, não aprovação nem chamada automática; não ampliam elegibilidade de patches, custo ou autoridade.

### 3.3 Consolidar V2 e auditar quando necessário

Derive V2 de Definidos, exclusões, dependências e aceite, sem reconsolidar decisões funcionais; detalhe tecnicamente fases e validações. Classifique adições como `derivação técnica do contrato funcional`, `modernização técnica justificada` ou `ampliação de escopo`. Modernização exige ganho líquido e equivalência funcional; ampliação exige decisão humana. Oportunidades futuras não autorizam implementação; crescimento estrutural exige prova e alternativa simples, sem justificativa circular (§3.2).

Integre só tratamentos autorizados. Matriz/passagens adicionais são excepcionais para auditar integração material, com ID, origem, classe, tratamento, localização, evidência e destino de Updates; não crie matriz de triagem. Se necessária matriz versionada: `docs/matriz-consolidacao-<caso>.md`.

Registre V2 no PR/Git só quando servir decisão, prova, gate ou retomada; referências existentes bastam se recuperáveis. Versione antes de avaliação imutável. Analista: primeiro parecer independente sem pareceres/confronto/matriz; só depois disponibilize resposta integral e evidências ao mesmo Analista se auditoria material necessária. Retorno `revisao_delta` por §3.2, sem segunda passagem ritual.

Reconcilie roadmap se afetado, com referência anterior e `docs/template-roadmap.md`; isso não reabre Analista. No legado que exige `aprovado para merge do plano-base v2`, entregue contrato e referência imutável ao Analista: libera implementar, não merge; preserve os demais gates.

Associe V2/liberação ao candidato exato, sem commit vazio nem trailer `plan-v2-approved` rotineiro; preserve marcadores de legado, prova, gate ou retomada. Sem Analista, Executor consolida/valida V2. Aprovação antiga não libera V2 alterada.

## 4. Implementação

Implemente só a V2 liberada e suas fases canônicas do roadmap, em ordem, sem aliases ordinais ou agrupar fases independentes. Faça menor delta seguro; preserve boundaries, permissões, consumidores e comportamento funcional, sem remoção/redução/substituição/redistribuição sem autorização humana. Evite refatoração, mecanismo ou arquivo não relacionado; componente compartilhado só cresce com necessidade e equivalência funcional dos consumidores comprovadas.

Use recursos aprovados. Se editar prompt consumido por IA, execute antes `$lp-factory-criar-prompt` (read-only); preserve evidência concisa de execução, fontes e casos devolvidos, confronte o prompt final e valide casos relevantes proporcionalmente ao risco. Ausência, falha ou divergência material sem justificativa bloqueia aceite.

Em frontend/dashboard, siga `docs/design-system.md`, valide UI renderizada e acione Design conforme §3.2. Para documento canônico, siga §3.2 e aplique literalmente o ABC quando houver avaliação especializada.

## 5. Supabase e migrations

Com impacto no banco:
- inspecione estado por recurso read-only autorizado e confronte com `docs/schema.md`; inspeção não autoriza escrita, migration, secret ou operação administrativa;
- crie mudança de schema somente por `supabase/migrations/<timestamp>_<nome>.sql`; antes de merge execute migration integral em PostgreSQL compatível com o alvo (transação efêmera com rollback ou ambiente isolado autorizado) e SQL positivo/negativo para sintaxe e comportamento; dry-run/estática não substituem PostgreSQL quando ele determina resultado; não persista efeito no projeto remoto alvo;
- antes do merge, operações remotas permitidas, quando autorizadas: inspeção read-only, `supabase migration list --linked`, `supabase db push --linked --dry-run`; proíbem-se `apply_migration`, SQL mutável, `migration repair`, `supabase db push --linked` sem `--dry-run` e quaisquer mutações de schema/histórico fora do fluxo;
- migration aplicada é imutável; corrija/reverta por nova migration incremental. O merge na `main` aciona apply automático competente;
- se o plano exigir aplicação remota pré-merge ou ela tiver ocorrido fora do fluxo, pare somente o ponto em fail-closed, registre operação/estado e use autoridade competente; não infira rollback, repair ou mutação corretiva.

Ambiente/confirmação externos ausentes são pendências; mantenha feature flag aplicável desligada, continue artefatos e atividades independentes. Pare a definição apenas se não puder implementar com segurança; prova obrigatória pendente impede prontidão para merge.

## 6. Validação e QA comum

Comprove aceite por QA/evidência proporcionais, sem repetir no sandbox prova externa equivalente autorizada. Siga `AGENTS.md`; runtime exige observabilidade `aplicável`/`N/A` e, quando cabível, sinais de resultado/falha de `docs/base-tecnica.md`. Teste viewports/superfícies exigidos.

**Prepare QA antes do código:** confirme Preview, ambiente, browser, credenciais por referência e fixture/estado em `docs/platform-config.md`, `docs/automations.md` e Catálogo (§2), quando pertinentes. Conta em pending_setup não prova conversa virgem: cheque mensagens e tenant descartável autorizado antes de pedir nova conta, sem tocar conta ativa nem substituir signup real.

Priorize Preview e workflows autorizados; não improvise browser, rede ou mutação. Recurso/secret operacional pode ser consumido por plataforma autorizada mesmo se ilegível ao Executor: não peça, copie, divulgue ou recrie valor. Evidências de GitHub Actions, Vercel, Supabase ou outros consumidores só valem vinculadas ao código, Preview e estado pertinentes.

Participação humana delimitada e autorizada no contrato funcional (sem restrição técnica) pode integrar QA; antes, esgote alternativas autorizadas equivalentes sem humano. Fora do contrato, não é fallback: registre critério, caminhos e bloqueio; escale só decisão fora da autoridade. Falta de prova impede prontidão; não infira conta privilegiada, automação, infraestrutura ou mutação remota e continue independentes.

## 7. Checkpoints, revisão focal e retomada

### 7.1 Executar e registrar o recorte

Delimite fase por objetivo, arquivos, exclusões e aceite; checkpoints só para prova ou retomada material, sem PR/merge intermediário. QA por §6 e `AGENTS.md` (N/A fundamentado para documentação), com transições/consumidores afetados sem repetições.

Reconcilie documentos canônicos afetados quando necessário; preserve estado anterior (§3.1) e roteie por §3.2. Se Documentação intervier, envie `ETAPA: intermediária` com caso, fontes, provas, documentos/seções e acesso. Após QA/correções, sem limpeza editorial/histórica gratuita. Sem documento afetado: N/A. ABC apenas literal ou `SEM ALTERAÇÕES NECESSÁRIAS`; fechamento documental não cria gate.

Achado aberto do Analista exige fechamento focal no mesmo agente; `aprovado para avançar` não libera merge nem dispensa QA. Checkpoint/trailer `LP-Factory-Phase: <identificador>` só quando exigido; pendência bloqueia dependente, publicação pelo `AGENTS.md`, sem commit ritual.

### 7.2 Rever somente o ponto afetado

Questão estrutural surgida durante a implementação: suspenda o ponto e use §3.2; se necessária chamada, `$lp-factory-avaliar-plano-estrutura` em `revisao_focal_implementacao`, com identidade, contrato/V2, fontes, provas, ponto e checkpoints acessíveis (§3.1), sem exigir arquitetura ou correção tentada antes do parecer.

Mudou V2? Aplique apenas patch autossuficiente, preserve histórico e checkpoints válidos, registre delta e versione candidato quando necessário; reconcilie roadmap afetado. Reavalie Analista por §3.2/gates legados; quando necessário, `revisao_delta` ao mesmo Analista com versões/parecer/delta, ou primeira passagem independente. Liberação anterior não cobre nova versão. Não repita especialistas/passagens já satisfeitas.

V2 suficiente, sem condicionante/investigação: corrija diretamente e siga gate de implementação. Outra questão material: somente especialidade/autoridade competente; handoff incompleto ou decisão não autorizada bloqueia só o ponto afetado.

### 7.3 Retomar e encerrar

Retome por Git/PR, versões e provas; conserve marcadores (`plan-v2`, `plan-v2-approved`, `LP-Factory-Phase`) quando exigidos. Trailer sozinho não satisfaz gate; preserve checkpoints, revalide só delta e retome primeira pendência.

Reutilize Updates só com versão exata do contrato, `source_repository_sha`, referências excepcionais e mesmo update/alternativa. Preserve parecer integral até referência durável acessível; mantenha rastreabilidade/matriz até conclusão e histórico após limpeza autorizada. Guarde no PR/Git decisões, versões, provas e pendências antes de logs expirarem; sem índice/especialista por rotina. Correção pré-merge continua no PR/sessão, sem refazer preparação válida; pós-merge conforme §10.

## 8. Gate de aderência

Antes da entrega, confronte HEAD/diff e contrato/V2/escopo negativo com aceite, QA, checks, reviews, threads e documentos. Cada alteração material exige requisito ou dependência factual; retire excesso ou prove necessidade. Resolva achados ou rejeite justificadamente; QA adicional só por risco, aceite ou prova faltante. Não repita validação satisfeita; preserve UX/Design System, simplicidade e escalada §0.

## 9. Entrega, merge e conclusão

Recibo compacto no PR/Git: contrato/estado, branch/PR/HEAD, arquivos/diff, pareceres/achados, checks, QA por aceite, `npm ci`/`npm run check` com status, riscos, alternativas, pendências e decisões fora da autoridade. Não recopie V2/pareceres recuperáveis; preserve provas de prompt IA (§4) e ABC.

Libere somente PR/HEAD avaliados, após Definidos, QA, gates e review independente do SHA corrente (`AGENTS.md`); escritor único não substitui reviewer. Checks, QA, reviews automáticos disparados, threads, achados ou autorizações materiais pendentes bloqueiam merge. Autonomia não revoga ordem humana de impedir merge.

Com liberação registrada e merge autorizado:
1. fixe `head SHA` e confirme, nesse exato SHA, resultado concluído de **todos** os reviews aplicáveis já disparados e revisões automáticas de eventos ocorridos. Ausência/atraso de registro, falha ou cancelamento não são sucesso; confira novamente HEAD, checks, threads e alterações materiais;
2. faça merge **remoto** por `AGENTS.md` com guarda atômica para o mesmo SHA; nunca merge local pela `main`;
3. obtenha merge commit e valide pós-merge somente o exigido;
4. registre no PR conclusão, merge SHA e evidências recuperáveis; registros externos de governança não substituem fontes técnicas nem viram novo gate;
5. entregue recibo compacto com merge, QA pós-merge e pendências, sem repetir contratos/pareceres.

Entrega técnica ainda com falha de merge, migration, Production ou QA permanece aberta; preserve independentes e corrija somente o ponto competente. PR corretivo pós-merge apenas pela exceção de §10. Conclusão positiva exige **todos** os Definidos/aceites/gates provados, sem pendência material; só então libere dependentes. `inviável no contrato aprovado` exige prova pelas fontes/avaliações de que nenhuma alternativa autorizada atende, após esgotar alternativas razoáveis: falha isolada não basta nem libera dependentes positivos. Conclua o conjunto só após todas as entregas alcançarem estado terminal compatível, com recibo/pendências de cada uma. Não substitua Estrategista original, humano, especialistas ou reviewer independente.

## 10. Limites

Além do `AGENTS.md`, não altere contrato/fases por inferência, descarte trabalho válido, crie PR empilhado ou segundo PR no ciclo, permita especialista escritor, implemente candidato não liberado, ignore QA/gates, refaça especialista/Analista por rotina, crie segunda sessão ou libere dependentes cedo. Pós-merge, mesma sessão e autoridade; segundo PR no mesmo ciclo só por correção ou fato canônico obrigatório dependente de merge/apply anterior. Nova rodada expressamente aprovada inicia outra etapa: continue com o mesmo Executor e worktree quando acessíveis, usando nova branch/PR conforme `AGENTS.md`, sem repetir preparação ou verificações válidas e executando apenas o delta.