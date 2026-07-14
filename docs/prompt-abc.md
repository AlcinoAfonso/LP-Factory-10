# docs/prompt-abc.md vs9

PROMPT ABC

Antes de adicionar, avaliar nesta ordem: remover; ajustar; substituir; consolidar; adicionar somente quando necessário.

## 1. Entrada

* REPO (GitHub): LP-Factory-10
* REF (GitHub): [main | branch | commit] (se não informado, main)
* DOC_ALVO: [docs/base-tecnica.md | docs/schema.md | docs/roadmap.md | docs/design-system.md | docs/platform-config.md | docs/services.md | docs/automations.md]
* RELATÓRIO: fonte do estado final.

## 2. Objetivo

Gerar um ABC humano, curto, delta-only e executável para o DOC_ALVO.

## 3. Fontes obrigatórias

* RELATÓRIO.
* DOC_ALVO atual.
* Fonte estrutural aplicável.
* Para `docs/roadmap.md`: `docs/template-roadmap.md`.

Fluxo mínimo:

1. Ler o relatório, o documento atual e a fonte estrutural aplicável.
2. Extrair somente o estado final.
3. Comparar com o documento atual.
4. Emitir somente os deltas necessários.

## 4. Regras universais

* Um assunto, uma residência.
* Registrar somente o estado final.
* Não duplicar fonte canônica.
* Não registrar histórico operacional no corpo dos documentos.
* Emitir somente o menor delta executável.
* Preferir remoção, ajuste, substituição ou consolidação antes de adição.

## 5. Residência documental

* `docs/roadmap.md`: casos, estado, decisões, pendências e artefatos.
* `docs/base-tecnica.md`: regras técnicas universais para implementações futuras.
* `docs/schema.md`: objetos, permissões e contratos reais de banco.
* `docs/design-system.md`: contrato visual.
* `docs/platform-config.md`: configurações externas.
* `docs/services.md`: services implantáveis.
* `docs/automations.md`: automações operacionais.

## 6. Gates específicos

### 6.1 Roadmap

* Consultar obrigatoriamente `docs/template-roadmap.md`.
* Respeitar as subseções indicadas no relatório.
* Registrar somente implementado, definido, pendência vigente ou limite permanente.
* Não criar blocos vazios.
* Não listar ações que não ocorreram; usar `N/A` somente quando exigido pela estrutura.
* Registros devem conter apenas nomes ou paths.

### 6.2 Base Técnica

* Só gerar delta quando houver regra universal necessária para futuras implementações.
* Não registrar detalhes de uma fase ou caso.
* Não copiar valores ou listas cuja fonte canônica seja código, registry, schema ou configuração versionada.
* Quando necessário, registrar apenas o contrato permanente e o path da fonte canônica.

### 6.3 Schema

* Só gerar delta quando houver alteração real de banco com evidência.

## 7. Operações permitidas

* `SUBSTITUIR_TRECHO`
* `SUBSTITUIR_SECAO`
* `ADICIONAR_TRECHO`
* `ADICIONAR_SECAO`
* `REMOVER_TRECHO`
* `REMOVER_SECAO`

## 8. Versionamento

* Cabeçalho, versão, data e changelog só mudam se houver alteração real.
* Alteração real exige pelo menos uma operação que não seja cabeçalho, versão, data ou changelog.
* Em changelog, incluir somente a nova entrada.

## 9. Formato da saída

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

OPERAÇÕES (emitir apenas as necessárias)

OP1)
TIPO: <operação permitida>
ALVO: <seção/título/identificador do alvo>
ANCORA: <seção âncora> (somente quando aplicável)
CONTEUDO:
<bloco literal correspondente à operação>

CHANGELOG (somente se houver alteração real)
CH1) (entrada nova)
<bloco literal da entrada nova do changelog>
```

Para múltiplos documentos:

* Emitir um ABC independente por documento.
* Não misturar versões, operações ou changelogs.
