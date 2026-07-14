# docs/prompt-abc.md vs8

PROMPT ABC

## 1. Entrada

* REPO (GitHub): LP-Factory-10
* REF (GitHub): [main | branch | commit] (se não informado, main)
* DOC_ALVO: [docs/base-tecnica.md | docs/schema.md | docs/roadmap.md | docs/design-system.md | docs/platform-config.md | docs/services.md | docs/automations.md]
* RELATÓRIO: fonte do estado final a refletir no DOC_ALVO.

## 2. Objetivo

Gerar um ABC humano, delta-only e executável para o DOC_ALVO.

Antes de adicionar, avaliar nesta ordem:

1. remover;
2. ajustar;
3. substituir;
4. consolidar;
5. adicionar somente quando necessário.

## 3. Fontes obrigatórias

* RELATÓRIO informado.
* DOC_ALVO atual.
* Fonte estrutural aplicável.
* Para `docs/roadmap.md`, consultar obrigatoriamente `docs/template-roadmap.md`.

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
* Tudo fora da residência do DOC_ALVO está fora de escopo.
* Preservar decisões futuras aprovadas, pendências vigentes e limites permanentes.
* Ignorar hipóteses, propostas não aprovadas e passos operacionais superados.

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
* Em registros, não incluir `docs/**` como artefato.

### 6.2 Base Técnica

* Só gerar delta quando houver regra universal necessária para futuras implementações.
* Não registrar detalhes de uma fase ou caso.
* Não copiar valores ou listas cuja fonte canônica seja código, registry, schema ou configuração versionada.
* Quando necessário, registrar apenas o contrato permanente e o path da fonte canônica.

### 6.3 Schema

* Só gerar delta quando houver alteração real de banco com evidência.
* Evidência aceita: migration aplicada, SQL de schema ou confirmação observável no Supabase.

## 7. Operações permitidas

* `SUBSTITUIR_TRECHO`
* `SUBSTITUIR_SECAO`
* `ADICIONAR_TRECHO`
* `ADICIONAR_SECAO`
* `REMOVER_TRECHO`
* `REMOVER_SECAO`

Regras:

* Preferir TRECHO para linha, bullet, parágrafo curto ou bloco pequeno.
* Usar SEÇÃO somente quando a estrutura precisar ser refeita.
* Em TRECHO, indicar a seção em que o trecho entra ou sai.
* Em `ADICIONAR_SECAO`, usar a seção anterior do mesmo nível como âncora.
* Se a âncora não estiver clara, não gerar adição.
* Não usar reticências em `CONTEUDO`.

## 8. Versionamento

* Cabeçalho, versão, data e changelog só mudam se houver alteração real.
* Alteração real exige pelo menos uma operação que não seja cabeçalho, versão, data ou changelog.
* `99. Changelog` não entra em OPERAÇÕES.
* Em changelog, incluir somente a nova entrada.

## 9. Formato da saída

A resposta deve começar exatamente com:

```txt
DD/MM/YYYY HH:MM — ABC (DELTA-ONLY) para <DOC_ALVO>
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
* Quando não houver DOC_ALVO definido, triar os documentos permitidos e gerar ABC somente onde houver delta.
