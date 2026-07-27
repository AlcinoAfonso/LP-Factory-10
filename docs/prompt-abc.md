# docs/prompt-abc.md vs15

PROMPT ABC

Antes de adicionar, avaliar nesta ordem: remover; ajustar; substituir; consolidar; adicionar somente quando necessário.

## 1. Entrada

* REPO: `AlcinoAfonso/LP-Factory-10`.
* REF: `main`, branch ou commit; padrão: `main`.
* DOC_ALVO: documento a atualizar, quando informado.
* RELATÓRIO: fonte do estado final.
* ETAPA: `única`, `intermediária` ou `consolidação final`; padrão: `única`.

## 2. Objetivo

Gerar um ABC humano, curto, delta-only e executável.

## 3. Fontes obrigatórias

* RELATÓRIO.
* DOC_ALVO atual.
* Fonte estrutural aplicável.

## 4. Fluxo

1. Ler as fontes obrigatórias.
2. Extrair somente:
   * implementado;
   * definido;
   * decisão futura aprovada;
   * pendência vigente;
   * limite permanente.
3. Ignorar:
   * hipótese;
   * proposta não aprovada;
   * histórico operacional;
   * passo superado.
4. Comparar com o documento atual.
5. Aplicar o gate específico do DOC_ALVO antes de emitir qualquer operação.
6. Emitir somente o menor delta necessário.

## 5. Residência documental

* `docs/roadmap.md`: casos, estado, decisões, pendências e artefatos.
* `docs/base-tecnica.md`: regras técnicas duráveis para implementações futuras.
* `docs/schema.md`: contrato real de banco.
* `docs/design-system.md`: contrato visual.
* `docs/platform-config.md`: configurações externas.
* `docs/services.md`: services implantáveis.
* `docs/automations.md`: automações operacionais.

Um assunto deve ter uma única residência. Não duplicar fonte canônica.

## 6. Gates específicos

### 6.1 Roadmap

* Consultar `docs/template-roadmap.md`.
* Respeitar as subseções indicadas no relatório.
* Não criar blocos vazios.
* Não listar ações que não ocorreram.
* Usar `N/A` somente quando o template exigir.
* Em registros, usar somente nomes ou paths.
* Não registrar `docs/**` como artefato.

### 6.2 Base Técnica

* Só gerar delta para regra técnica durável e reutilizável além do caso imediato; um único caso, fase, implementação ou PR não comprova durabilidade por si só.
* Antes de adicionar regra ou subseção, verificar se o conteúdo já está coberto por regra global, fonte canônica existente ou ajuste/consolidação de trecho atual.
* Regra específica de domínio só permanece quando protege boundary real e orienta implementações futuras sem exigir leitura da implementação interna.
* Não registrar conteúdo transitório, histórico ou operacional, incluindo fase, etapa, caso E*, “antes do apply”, “até o merge”, “pendente de verificação”, “nesta fase” ou equivalente.
* Não registrar inventários, valores, listas ou detalhes exatos definidos no repositório, código, registry, schema ou configuração versionada.
* Não duplicar outra residência documental; quando a fonte própria for suficiente, registrar somente o invariável transversal necessário e o path canônico.
* O delta documenta contrato técnico já implementado ou definido; não pode ampliar escopo, autorizar novo boundary, rota, banco, serviço, automação ou comportamento.
* Preservar regras globais de classificação, responsabilidade e isolamento de boundaries.
* Se nenhum conteúdo superar esses gates, emitir `SEM ALTERAÇÕES NECESSÁRIAS`.

### 6.3 Schema

* Só gerar delta com alteração real de banco e evidência.

## 7. Operações permitidas

* `SUBSTITUIR_TRECHO`
* `SUBSTITUIR_SECAO`
* `ADICIONAR_TRECHO`
* `ADICIONAR_SECAO`
* `REMOVER_TRECHO`
* `REMOVER_SECAO`

Regras:

* Preferir TRECHO.
* Usar SEÇÃO somente para mudança estrutural.
* Adição exige âncora clara.
* `CONTEUDO` deve ser literal e sem reticências.

## 8. Versionamento

* Versão e data só mudam com delta real na publicação consolidada do documento.
* Em `ETAPA: intermediária`, preservar versão e data atuais e omitir `VERSAO_NOVA` e `DATA_NOVA`.
* Em `ETAPA: única` ou `ETAPA: consolidação final`, emitir nova versão e data quando houver delta real.
* Não gerar nem manter changelog documental; o histórico fica no Git e nos PRs.

## 9. Formato da saída

Com DOC_ALVO:

```txt
DD/MM/YYYY HH:MM — ABC (DELTA-ONLY) para <DOC_ALVO>
DOC_ALVO: <DOC_ALVO>
```

Sem delta:

```txt
DD/MM/YYYY HH:MM — ABC (DELTA-ONLY) para <DOC_ALVO>
DOC_ALVO: <DOC_ALVO>
SEM ALTERAÇÕES NECESSÁRIAS
```

Com delta em etapa intermediária:

```txt
DD/MM/YYYY HH:MM — ABC (DELTA-ONLY) para <DOC_ALVO>
DOC_ALVO: <DOC_ALVO>
ETAPA: INTERMEDIÁRIA

OPERAÇÕES

OP1)
TIPO: <operação>
ALVO: <alvo>
ANCORA: <âncora, somente quando aplicável>
CONTEUDO:
<conteúdo literal>
```

Com delta em etapa única ou consolidação final:

```txt
DD/MM/YYYY HH:MM — ABC (DELTA-ONLY) para <DOC_ALVO>
DOC_ALVO: <DOC_ALVO>
VERSAO_NOVA: <vX.Y.Z>
DATA_NOVA: <DD/MM/YYYY>

OPERAÇÕES

OP1)
TIPO: <operação>
ALVO: <alvo>
ANCORA: <âncora, somente quando aplicável>
CONTEUDO:
<conteúdo literal>
```

Sem DOC_ALVO:

```txt
TRIAGEM
```

Depois:

* listar somente documentos com delta;
* emitir um ABC independente por documento;
* não misturar versões ou operações.