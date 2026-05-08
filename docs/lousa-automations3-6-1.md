# Lousa — 3.6.1 Baseline de migrations no Supabase

## 1) Objetivo da fase baseline

* Extrair o baseline real do banco remoto atual.
* Transformar esse baseline no novo histórico oficial de migrations.
* Preparar a retirada segura do legado atual de `supabase/migrations/`.
* Liberar com segurança o fluxo futuro de migrations incrementais.

## 2) Bloqueio central

* O histórico remoto de migrations no projeto atual está ausente.
* O conjunto atual de `supabase/migrations/` cobre apenas uma fração do banco.
* Esse conjunto não pode ser tratado como baseline oficial.
* O workflow de apply não deve ser usado como fluxo confiável antes do baseline.

## 3) Decisão fechada

* O banco remoto atual é a fonte de verdade.
* O baseline deve nascer do estado real atual do banco.
* O legado atual é apenas apoio transitório durante a transição.
* O legado deve ser removido depois que o baseline novo assumir o papel de histórico oficial.
* O smoke do workflow de apply só pode acontecer depois da transição segura.

## 4) Plano operacional da baseline

### 4.1 Etapa 1 — Extração do baseline

* Responsável: executor + humano, com ação externa no ambiente do banco.
* Objetivo: obter o baseline real a partir do banco remoto atual.
* Saída esperada: arquivo bruto de baseline extraído do estado real do banco.
* Condição para avançar: baseline bruto extraído com sucesso.

### 4.2 Etapa 2 — Revisão técnica do baseline

* Responsável: executor.
* Objetivo: revisar o baseline extraído e transformá-lo na migration baseline oficial.
* Saída esperada: arquivo completo da migration baseline + leitura curta do impacto no legado atual.
* Condição para avançar: baseline oficial tecnicamente aceito.

### 4.3 Etapa 3 — Transição do legado

* Responsável: executor.
* Objetivo: definir exatamente como o legado atual sai do fluxo oficial.
* Saída esperada: destino técnico fechado para o legado durante a transição e regra de remoção posterior.
* Condição para avançar: legado classificado como transitório e sem papel no histórico oficial novo.

### 4.4 Etapa 4 — Alinhamento do histórico remoto

* Responsável: executor + humano, com ação externa no Supabase CLI / ambiente.
* Objetivo: alinhar o histórico remoto ao baseline novo.
* Saída esperada: histórico remoto reconciliado com o baseline oficial.
* Condição para avançar: local e remoto alinhados ao novo histórico oficial.

### 4.5 Etapa 5 — Liberação controlada do workflow

* Responsável: humano.
* Objetivo: liberar o primeiro uso real do workflow de apply depois da transição segura.
* Saída esperada: smoke manual do workflow com evidência em logs e Summary.
* Condição para fechar a fase: baseline oficial ativo, legado fora do fluxo e smoke manual concluído depois da transição.

## 5) Ações externas necessárias

* A extração do baseline real depende de execução externa no Supabase CLI / ambiente.
* O alinhamento do histórico remoto também depende de execução externa.
* Essas ações não devem ser improvisadas dentro do repositório.
* Se a execução externa ainda não tiver ocorrido, a fase baseline permanece aberta.

## 6) Tratamento do legado

* O conjunto atual de `supabase/migrations/` deve permanecer apenas como apoio transitório durante a fase baseline.
* Esse conjunto não deve ser tratado como histórico oficial novo.
* A remoção do legado só deve acontecer depois de:

  * baseline oficial versionado
  * histórico remoto alinhado
  * transição segura concluída
* Não fazer limpeza patch por patch no escuro.

## 7) Gate de saída da baseline

A baseline só pode ser tratada como concluída quando os itens abaixo estiverem fechados:

* baseline real extraído do banco remoto
* migration baseline oficial aceita
* histórico remoto alinhado ao baseline
* legado atual retirado do fluxo oficial
* workflow liberado apenas depois disso
* smoke manual executado após a transição

## 8) Status atual

* baseline oficial: pendente
* extração real do baseline: pendente
* histórico remoto alinhado: pendente
* legado removido do fluxo oficial: pendente
* workflow de apply: preparado, mas não liberado como fluxo confiável
* bloqueio central atual: baseline
