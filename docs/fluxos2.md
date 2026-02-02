# Fluxos do Produto (v2)

## Introdução

Este documento descreve, em linguagem simples, os **fluxos principais do produto** do ponto de vista do usuário: onde ele entra, o que ele vê, quais decisões o sistema toma e quais são os próximos passos.

Cada fluxo tem um título no formato do Roadmap (ex.: **E10.4**, **E10.5**).

Cada fluxo descreve:

* **Ponto de partida** (onde o usuário entra)
* **Cenários** (o que pode acontecer)
* **O que o usuário vê** (em termos de tela/CTA, sem layout técnico)
* **Resultado** (para onde o fluxo vai)
* **Casos do Roadmap** que implementam aquele trecho

---

## E10.4 — Conta em `pending_setup` com setup incompleto

**Ponto de partida**
* Usuário entra no dashboard da conta (`/a/[account]`) com a conta em **`pending_setup`** e com `setup_completed_at` **vazio**.

---

## E10.5 — Conta em `pending_setup` com setup concluído, mas ainda sem trial/plano

**Ponto de partida**
* Usuário entra no dashboard da conta (`/a/[account]`) com a conta em **`pending_setup`** e com `setup_completed_at` **preenchido**, mas ainda **sem trial/plano**.
