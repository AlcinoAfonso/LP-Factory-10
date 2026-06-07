# docs/prompt-abc.md vs4

PROMPT ABC

ENTRADA

* REPO (GitHub): LP-Factory-10
* REF (GitHub): [main | branch | commit] (se não informado, main)
* DOC_ALVO: [docs/base-tecnica.md | docs/schema.md | docs/roadmap.md | docs/design-system.md | docs/platform-config.md | docs/services.md | docs/automations.md]

OBJETIVO
Gerar o **ABC humano** para o DOC_ALVO.

VISÃO GERAL (RESIDÊNCIA DO CONTEÚDO)

* `docs/schema.md` = contrato de banco (objetos e permissões de DB).
* `docs/base-tecnica.md` = contrato técnico de runtime (regras de implementação segura).
* `docs/roadmap.md` = estado final dos casos E* (status/escopo/dependências/artefatos).
* `docs/design-system.md` = contrato visual atual do produto (padrões UI, componentes, superfícies visuais e regras de uso).
* `docs/platform-config.md` = contrato operacional de plataformas, variáveis, secrets, URLs, endpoints, redirects, DNS e configurações externas.
* `docs/services.md` = catálogo humano dos services implantáveis, MCPs, endpoints de services, infraestrutura reutilizável com identidade própria, boundaries de deploy e consumidores principais.
* `docs/automations.md` = catálogo das automações operacionais, uso humano, status, dependências, componentes consumidores, regras operacionais e aprendizados de automação.

REGRA GLOBAL (ANTI-INFLAÇÃO)

* 1 assunto = 1 residência.
* Não duplicar guardrails/listas já cobertos por contrato dedicado do repo; nos docs manter só: objetivo em 1 linha + paths + referência.
* Tudo fora da residência do DOC_ALVO está fora de escopo.
* Docs descrevem o estado atual do projeto; histórico de evolução fica apenas no changelog quando o documento tiver changelog.
* Ao atualizar uma seção, substituir o estado antigo pelo estado atual consolidado, sem manter fases intermediárias já superadas.
* Configurações de plataforma, envs, secrets, endpoints, URLs oficiais, redirects, DNS e parâmetros externos ficam em `docs/platform-config.md`; `docs/base-tecnica.md` deve manter apenas a regra técnica de implementação e uma referência curta quando necessário.
* Services implantáveis, MCPs e infraestrutura reutilizável com identidade própria ficam em `docs/services.md`; automações consumidoras ficam em `docs/automations.md`; configurações operacionais de plataformas ficam em `docs/platform-config.md`.
* Automações operacionais, seus usos, status, inputs, respostas esperadas, dependências, regras de execução e aprendizados ficam em `docs/automations.md`; configs de plataforma ficam em `docs/platform-config.md`; services/MCPs reutilizáveis ficam em `docs/services.md`.

CRITÉRIO BASE TÉCNICA (RELEVÂNCIA PARA IA)

* Só gerar DELTA em `docs/base-tecnica.md` se mudar:
  * como a IA deve gerar código correto, ou
  * como a IA deve montar plano de execução seguro/determinístico.
* Novidade sem impacto de implementação não entra.
* Quando entrar, registrar só regra/contrato/parâmetro estável (sem narrativa de console e sem voláteis).
* Não gerar DELTA em `docs/base-tecnica.md` apenas para registrar URL, env, secret, endpoint, projeto externo, configuração de painel ou DNS; isso pertence a `docs/platform-config.md`, salvo quando a informação for indispensável como regra técnica de implementação.

REGRAS DE LEITURA

1. Abrir o DOC_ALVO na fonte indicada.
2. Identificar no DOC_ALVO:
   * função do documento
   * relação com outros documentos
   * seções existentes
   * padrão de estrutura
   * versão/data, quando houver
   * changelog, quando houver
3. Se o DOC_ALVO não tiver seção explícita de função ou relação documental, usar a VISÃO GERAL e a ALLOWLIST deste prompt como fonte de residência documental.

ALLOWLISTS POR DOC_ALVO

`docs/base-tecnica.md` — CONTRATO_TÉCNICO
* ENTRA: runtime, segurança (PII/secrets/permissão mínima), observability mínima estável, integrações com parâmetros fixos, convenções obrigatórias de repo e decisões arquiteturais estáveis.
* NÃO ENTRA: itens pertencentes a DB/schema, roadmap/casos, design system, platform config, services ou automations.

`docs/schema.md` — CONTRATO_DB
* ENTRA: tabelas, colunas, constraints, enums, relacionamentos, views, RPCs/functions, triggers, RLS/policies, grants e notas mínimas de validação no Supabase.
* GATE: o RELATÓRIO precisa trazer evidência de DB executado/observável: migration aplicada, SQL que altere schema ou confirmação no Supabase.
* TBD: só para detalhe faltante de objeto já existente no Supabase, com caminho de validação.
* NÃO ENTRA: itens pertencentes a runtime/base técnica, roadmap/casos, design system, platform config, services ou automations.

`docs/roadmap.md` — CONTRATO_DE_CASOS
* ENTRA: status com data, escopo final em bullets curtos, dependências entre casos E*, artefatos de repo, decisões explícitas do caso e pendências marcadas explicitamente no RELATÓRIO.
* REGRA: “E” só no título principal do caso; subitens sem repetir “E”.
* ARTEFATOS: separar em Criados, Ajustados e Removidos; omitir categorias vazias.
* NÃO ENTRA: itens pertencentes a DB/schema, runtime/base técnica, design system, platform config, services ou automations.

`docs/design-system.md` — CONTRATO_VISUAL
* ENTRA: padrões visuais atuais, componentes UI ativos, regras de uso, comportamento responsivo, superfícies visuais consolidadas.
* REGRA: ao citar superfícies, descrever comportamento/padrão visual; evitar inventário de arquivos se isso já estiver no roadmap.
* NÃO ENTRA: itens pertencentes a roadmap/casos, DB/schema, runtime/base técnica, platform config, services ou automations.

`docs/platform-config.md` — CONTRATO_OPERACIONAL_DE_PLATAFORMAS
* ENTRA: plataformas usadas pelo projeto, projetos/ambientes externos, variáveis públicas, secrets server-side por nome, flags, endpoints oficiais, URLs de produção/preview, redirects, SMTP, DNS/domínio, GitHub Actions secrets, regras operacionais de configuração e redeploy.
* SECRETS: nunca incluir valores reais; registrar só nome da variável, finalidade, plataforma e escopo de ambiente.
* NÃO ENTRA: itens pertencentes a runtime/base técnica, DB/schema, roadmap/casos, design system, services ou automations.

`docs/services.md` — CONTRATO_DE_SERVICES
* ENTRA: services implantáveis, MCPs, endpoints de services, objetivo do service, implementação canônica, README técnico local, boundary operacional de deploy, consumidores principais, dependências diretas, status operacional e pendências operacionais vinculadas ao próprio service.
* REGRA: endpoint/projeto só como identificação do service; inventário operacional consolidado fica em `docs/platform-config.md`.
* NÃO ENTRA: automações consumidoras, configs gerais de plataforma/secrets/envs, regras técnicas de runtime, objetos de DB, status de casos E* ou padrões visuais.

`docs/automations.md` — CONTRATO_DE_AUTOMACOES
* ENTRA: automações operacionais, catálogo, objetivo, status, acesso humano, como usar, inputs operacionais, resposta esperada, runtime/local, README local, workflow consumidor, componentes consumidores, dependências diretas, regras operacionais, padrões de execução pré-merge, aprendizados e pendências vinculadas à automação.
* REGRA: secrets/envs/endpoints/workflows podem aparecer só como dependência curta; inventário consolidado fica em `docs/platform-config.md`.
* NÃO ENTRA: configs de plataformas, secrets por nome, envs, endpoints canônicos e lista consolidada de workflows; services/MCPs reutilizáveis; regras técnicas de runtime; objetos de DB; status de casos E*; padrões visuais.

REGRAS DE EXTRAÇÃO (RELATÓRIO → ESTADO FINAL)

3. Extrair apenas o que estiver claramente como **ESTADO FINAL** (IMPLEMENTADO/DEFINIDO).
4. Ignorar propostas, hipóteses, assunções a validar e “próximo passo”.

COMPARAÇÃO (ESTADO FINAL vs DOC_ALVO)

5. Identificar apenas DELTAS que sejam necessários para refletir o estado final e permitidos pela allowlist do DOC_ALVO.
6. Se não houver DELTA permitido: saída **SEM ALTERAÇÕES NECESSÁRIAS**.

GERAÇÃO DO ABC (DELTA-ONLY)

7. Classificar cada DELTA pelo **menor bloco estável possível**.
8. Tipos permitidos de operação:
   * `SUBSTITUIR_TRECHO` (`replace_snippet`)
   * `SUBSTITUIR_SECAO` (`replace_section`)
   * `ADICIONAR_TRECHO` (`insert_snippet_after_anchor`)
   * `ADICIONAR_SECAO` (`insert_after_section`)
   * `REMOVER_TRECHO` (`remove_snippet`)
   * `REMOVER_SECAO` (`remove_section`)
9. Regra de uso:
   * Preferir TRECHO (linha, bullet, parágrafo curto ou bloco pequeno estável).
   * Usar SEÇÃO inteira somente quando a estrutura da seção precisar ser refeita.
10. Regra de âncora:
   * Em operações de TRECHO, usar a seção em que o trecho entra/sai.
   * Em `ADICIONAR_SECAO`, usar a seção imediatamente anterior (mesmo nível), quando existir.
   * Se a âncora não estiver clara no DOC_ALVO, não gerar operação de ADIÇÃO.

REGRAS DE VERSIONAMENTO/CHANGELOG

11. “99. Changelog” não entra em OPERAÇÕES.
12. Cabeçalho (data/versão) e CHANGELOG só mudam se houver alteração real no documento.
13. Alteração real = existe pelo menos uma OPERAÇÃO que não seja cabeçalho/versionamento nem seção 99.
14. Em CHANGELOG, incluir somente a nova entrada.

FORMATO DA SAÍDA (OBRIGATÓRIO; SEM TEXTO EXTRA)

15. A resposta deve começar exatamente com:

DD/MM/YYYY HH:MM — ABC (DELTA-ONLY) para <DOC_ALVO>

16. Sem DELTAS permitidos:

DD/MM/YYYY HH:MM — ABC (DELTA-ONLY) para <DOC_ALVO>
DOC_ALVO: <DOC_ALVO>
SEM ALTERAÇÕES NECESSÁRIAS

17. Com DELTAS permitidos:

DD/MM/YYYY HH:MM — ABC (DELTA-ONLY) para <DOC_ALVO>
DOC_ALVO: <DOC_ALVO>
VERSAO_NOVA: <vX.Y.Z>
DATA_NOVA: <DD/MM/YYYY>

OPERAÇÕES (emitir apenas as necessárias)

OP1)
TIPO: <um dos tipos permitidos no item 8>
ALVO: <seção/título/identificador do alvo>
ANCORA: <seção âncora> (somente quando aplicável)
CONTEUDO:
<bloco literal correspondente à operação>

CHANGELOG (somente se houver alteração real)
CH1) (entrada nova)
<bloco literal da entrada nova do changelog>

18. Regras de bloco:
   * Não usar reticências (“...”/“…”) em `CONTEUDO`.
   * Em operações de TRECHO, fornecer somente o trecho mínimo estável e explícito.
   * Em operações de SEÇÃO, começar pela linha do heading numerado da seção e preservar quebras/bullets.

TRIAGEM PRÉVIA PARA MÚLTIPLOS DOCUMENTOS

Quando o RELATÓRIO não trouxer DOC_ALVO definido, primeiro avaliar todos os DOC_ALVO permitidos e listar:
* documentos com ABC necessário;
* motivo curto do delta;
* documentos sem ABC necessário, com motivo curto.

Depois gerar ABC apenas para documentos com DELTA permitido.

Se houver múltiplos documentos com DELTA, emitir um bloco ABC completo e independente por documento, sem misturar operações, versões ou changelogs.

PAUSA OBRIGATÓRIA (1 DOC POR EXECUÇÃO)

19. Executar o ciclo completo apenas para o DOC_ALVO atual, salvo quando o fluxo começar pela triagem prévia ou o usuário pedir explicitamente ABCs de múltiplos documentos.
20. Depois de emitir a saída, parar e aguardar próximo `DOC_ALVO`, exceto quando a triagem prévia identificar múltiplos documentos com DELTA permitido ou o usuário pedir explicitamente múltiplos documentos.
21. Nesses casos de múltiplos DOC_ALVO, emitir um bloco ABC completo por documento, mantendo cada bloco independente e sem misturar operações, versões ou changelogs.

---
