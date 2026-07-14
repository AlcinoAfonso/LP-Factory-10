# docs/prompt-abc.md vs10

PROMPT ABC

Antes de adicionar, avaliar nesta ordem: remover; ajustar; substituir; consolidar; adicionar somente quando necessário.

## 1. Entrada

* REPO: `AlcinoAfonso/LP-Factory-10`.
* REF: `main`, branch ou commit; padrão: `main`.
* DOC_ALVO: documento a atualizar, quando informado.
* RELATÓRIO: fonte do estado final.

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
5. Emitir somente o menor delta necessário.

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

* Só gerar delta para regra técnica durável e reutilizável além do caso imediato.
* Não registrar detalhes de fase ou caso.
* Não copiar valores ou listas definidos em código, registry, schema ou configuração versionada.
* Registrar somente a regra permanente e, quando necessário, o path da fonte canônica.

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

* Versão, data e changelog só mudam com delta real.
* Changelog recebe somente a nova entrada.
* Changelog não entra em OPERAÇÕES.

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

Com delta:

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

CHANGELOG

CH1)
<nova entrada>
```

Sem DOC_ALVO:

```txt
TRIAGEM
```

Depois:

* listar somente documentos com delta;
* emitir um ABC independente por documento;
* não misturar versões, operações ou changelogs.
