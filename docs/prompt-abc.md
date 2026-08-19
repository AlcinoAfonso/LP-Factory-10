# docs/prompt-abc.md vs18

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
* Respeitar a estrutura do template e as subseções indicadas no relatório; registros materiais de Banco, Repositório, Updates e Referências pertencem exclusivamente a `X.Y.2`, reconciliados com o estado e o diff do recorte, sem duplicação em `X.Y.3+`.
* Em `ETAPA: consolidação final`, considerar o estado final e o diff acumulado do recorte.
* Se `X.Y.2` estiver ocupado por conteúdo legado de outra natureza, usar `SUBSTITUIR_SECAO` no mesmo fluxo quando a estrutura final e seus impactos estiverem integralmente determinados dentro do recorte autorizado; parar somente diante de ambiguidade material, referência externa não reconciliada ou ampliação de escopo.
* Para o recorte afetado, a conformidade com o template prevalece sobre o menor delta textual; não normalizar recortes não afetados.
* Quando a fonte competente aprovar uma previsão futura para o roadmap, preservá-la no nível estrutural correspondente do template, sem convertê-la em implementação nem absorvê-la no recorte atual; recorte futuro sem implementação material pode omitir `Registros do recorte`.
* Não criar blocos vazios.
* Não listar ações que não ocorreram.
* Usar `N/A` somente quando o template exigir.
* Em registros, usar somente nomes ou paths.
* Não registrar `docs/**` como artefato de Repositório; referências canônicas seguem o bloco `Referências`.

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

### 6.4 Design System

* Só gerar delta para contrato visual aprovado ou implementado: identidade, tipografia, tokens, componentes reutilizáveis, estados, superfícies e acessibilidade.
* Não registrar inventário de telas ou rotas, adoção pontual, API ou valor exato já canônico no código ou configuração; manter somente regra visual durável e referência necessária.
* Não registrar regra de negócio, runtime, banco, plataforma ou status de caso.
* Sem mudança visual durável, emitir `SEM ALTERAÇÕES NECESSÁRIAS`.

### 6.5 Platform Config

* Só gerar delta para configuração externa confirmada ou decisão operacional aprovada: plataforma, projeto, ambiente, variável ou secret por nome, finalidade, escopo, endpoint, URL, redirect, SMTP, DNS ou regra de redeploy.
* Nunca registrar valor real de secret, credencial protegida ou dado sensível; valor público só entra quando confirmado e operacionalmente necessário.
* Marcar explicitamente estado futuro, pendente, bloqueado ou não validado; não registrar regra de runtime, contrato de banco, padrão visual ou status de caso.
* Substituir estado superado em vez de manter histórico; sem mudança operacional real, emitir `SEM ALTERAÇÕES NECESSÁRIAS`.

### 6.6 Services

* Só gerar delta para service implantável, MCP ou infraestrutura reutilizável com identidade própria, materializada ou aprovada, registrando objetivo, status, acesso, consumidores, dependências e referência técnica local.
* Registrar boundary operacional de deploy somente quando houver deploy independente e ela for necessária para evitar drift.
* Detalhes técnicos ficam no README ou código; configurações externas ficam em `docs/platform-config.md`; automações consumidoras ficam em `docs/automations.md`.
* Não registrar biblioteca genérica, rota do Core, ideia futura sem service aprovado, histórico ou secret; sem mudança de service real, emitir `SEM ALTERAÇÕES NECESSÁRIAS`.

### 6.7 Automations

* Só gerar delta para automação operacional materializada ou aprovada, registrando objetivo, status, modo de uso, resultado esperado, consumidores, dependências e aprendizado operacional durável.
* Configuração de plataforma, secrets por nome, ambientes, endpoints e catálogo consolidado de workflows ficam em `docs/platform-config.md`; services ficam em `docs/services.md`; detalhes técnicos ficam no README ou código.
* Pendência ou update só permanece quando vigente, aprovado e ligado a automação existente; evolução futura sem efeito operacional pertence ao roadmap.
* Não registrar tentativa histórica, proposta não aprovada, inventário redundante ou secret; sem mudança operacional real, emitir `SEM ALTERAÇÕES NECESSÁRIAS`.

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
* Ao retirar item ou seção numerada, preservar título, identificador, status de depreciação com data, motivo e destino canônico quando houver somente se a fonte estrutural aplicável exigir estabilidade do identificador ou existir referência externa comprovada; remover subseções e não reutilizar o identificador. Nos demais casos, usar `REMOVER_*`.
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