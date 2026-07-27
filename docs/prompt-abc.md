# docs/prompt-abc.md vs14

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
5. Quando o DOC_ALVO for `docs/base-tecnica.md`, validar escopo, evidência, durabilidade e residência conforme 6.2 antes de emitir qualquer operação.
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

* O Executor pode atualizar a Base Técnica no mesmo PR como fechamento documental da implementação aprovada.
* A atualização deve ocorrer por este Prompt ABC; o Executor não edita a Base livremente nem aplica texto fora das operações literais emitidas pelo ABC.
* O plano aprovado deve autorizar o escopo documental, identificando o contrato, boundary ou regra técnica afetada; não precisa antecipar o texto literal.
* Gerar o ABC após existir evidência implementada e validada no checkpoint correspondente; não documentar hipótese ou arquitetura ainda não materializada.
* O RELATÓRIO deve informar a implementação concluída, o escopo aprovado e as fontes canônicas consultadas.
* Se a implementação não produzir regra técnica durável além do caso imediato, emitir `SEM ALTERAÇÕES NECESSÁRIAS`.
* O delta documental não pode ampliar retrospectivamente o escopo da implementação nem autorizar novo boundary, rota, banco, serviço, automação ou comportamento não aprovado.
* Necessidade material fora do escopo aprovado deve interromper esse delta e ser encaminhada ao Analista e, quando necessário, ao humano.
* Evidência de um único caso, fase, implementação ou PR não demonstra, isoladamente, que uma regra é durável ou reutilizável.
* Só gerar delta para regra técnica durável e reutilizável além do caso imediato.
* Não registrar detalhes de fase, etapa ou caso E*.
* Não registrar condições temporárias, incluindo “antes do apply”, “até o merge”, “pendente de verificação”, “nesta fase” ou equivalentes.
* Não copiar valores ou listas definidos em código, registry, schema ou configuração versionada.
* Não registrar inventário de rotas, adapters, tabelas, workflows ou arquivos do estado atual.
* Regra específica de um único domínio pode permanecer quando for durável, proteger um boundary real e não houver outra fonte canônica suficiente.
* Preservar regras globais de classificação, responsabilidade e isolamento de boundaries.
* Quando código ou documento próprio já for fonte canônica suficiente, registrar somente o invariável transversal necessário e o path dessa fonte.
* Rejeitar delta cuja fonte correta seja o repositório, `docs/schema.md`, `docs/design-system.md`, `docs/platform-config.md`, `docs/services.md`, `docs/automations.md` ou `docs/roadmap.md`.

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