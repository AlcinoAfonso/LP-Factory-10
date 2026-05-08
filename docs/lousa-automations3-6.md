# Lousa — 3.6 Apply automático de migrations no Supabase

## 1) Objetivo do caso

* Resolver o baseline do banco atual.
* Estabelecer um histórico oficial de migrations.
* Liberar com segurança o fluxo automático futuro de apply.

## 2) Valor esperado do caso

* Permitir write migrations versionadas com segurança.
* Gerar snapshot mais confiável do schema para novos casos e ajustes via ChatGPT/Codex.
* Melhorar a automação e a manutenção do banco dentro do projeto.

## 3) Bloqueio atual

* O histórico remoto de migrations no projeto atual está ausente.
* As migrations atuais em `supabase/migrations/` cobrem apenas uma fração do banco.
* O conjunto atual passa a ser tratado como legado técnico.
* Esse legado não serve como histórico oficial futuro.
* O bloqueio central do caso hoje é a ausência de baseline oficial.

## 4) Decisão fechada do caso

* O banco remoto atual é a fonte de verdade.
* Deve ser gerado um baseline novo e oficial a partir do banco remoto atual.
* O histórico remoto deve ser alinhado a esse baseline.
* O legado atual deve permanecer apenas como apoio transitório durante a transição.
* Após a transição segura, o legado deve ser removido.
* Só depois disso o fluxo volta a usar migrations incrementais novas com o workflow automático.

## 5) Gate para liberar o workflow

O workflow de apply só pode ser tratado como liberado quando os itens abaixo estiverem concluídos:

* baseline novo assumido como histórico oficial
* histórico remoto alinhado ao baseline
* legado atual fora do fluxo ativo
* remoção do legado concluída de forma segura
* smoke manual executado depois da transição

## 6) Dependência operacional

* O detalhamento completo da fase baseline fica em `docs/lousa-automations3-5-1.md`.
* Enquanto a baseline não estiver concluída, o caso 3.5 permanece bloqueado.

## 7) Status consolidado

* workflow de apply: preparado
* baseline oficial: pendente
* legado atual: transitório e marcado para remoção após a transição segura
* bloqueio central do caso: baseline
* próximo passo: executar o plano descrito em `docs/lousa-automations3-5-1.md`
