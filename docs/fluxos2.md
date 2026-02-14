Fluxos do Produto (v2)

Introdução

- Este documento descreve, em linguagem simples, os fluxos principais do produto do ponto de vista do usuário: onde ele entra, o que ele vê, quais decisões o sistema toma e quais são os próximos passos.
- Cada fluxo tem um título no formato do Roadmap (ex.: E10.4, E10.5).
- Cada fluxo descreve:
  - Ponto de Partida (onde o usuário entra)
  - Cenários (o que pode acontecer)
  - O que o usuário vê (em termos de tela/CTA, sem layout técnico)
  - Resultado (para onde o fluxo vai)
  - Casos do Roadmap que implementam aquele trecho


E10.4 — Conta em pending_setup — Primeiros passos (formulário inline)

Ponto de Partida
1. Usuário entra no dashboard da conta (/a/[account]).
2. A conta está em pending_setup.
3. A página mostra o estado “Primeiros passos” com um formulário inline.

Cenário 1 — Entrada no E10.4 (Primeiros passos)
- O que o usuário vê
  - Título: “Primeiros passos”.
  - Subtexto curto: “Complete uma configuração rápida para continuar.”
  - Microcopy de valor (configurável, curto).
  - Formulário inline com:
    - Nome do projeto (obrigatório).
    - Nicho (opcional).
    - Preferência de canal (Email padrão / WhatsApp).
    - WhatsApp (opcional; se canal = WhatsApp, validação exige número).
    - Link da LP/site (opcional).
  - CTA único: “Salvar e continuar”.
- Resultado
  - Usuário entende o que precisa fazer e o que ganha ao concluir (microcopy configurável).

Cenário 2 — Salvar com Nome válido (com ou sem dados opcionais)
- Usuário preenche o Nome (obrigatório) com valor válido (não vazio e não padrão).
- Usuário pode ou não preencher os campos opcionais.
- Usuário escolhe a preferência de canal:
  - Email (padrão), ou
  - WhatsApp (se escolhido, exige WhatsApp preenchido).
- Usuário clica em “Salvar e continuar”.
- O que o usuário vê
  - Estado de carregamento no botão (“Salvando…”), com inputs desabilitados.
- Resultado
  - Dados do perfil v1 são persistidos (conforme contrato do onboarding).
  - Se a conta estava pending_setup, ela é promovida para active (status-based).
  - “Primeiros passos” deixa de ser renderizado e o usuário segue para o pós-setup (E10.5).

Cenário 3 — Erro de validação (permanece no E10.4)
- Usuário tenta salvar com:
  - Nome vazio, ou
  - Nome padrão (não aceito), ou
  - Canal = WhatsApp e WhatsApp vazio/inválido, ou
  - Link preenchido e claramente inválido.
- O que o usuário vê
  - Mensagem de erro inline no campo correspondente.
  - CTA permanece disponível após correção.
- Resultado
  - Setup não é concluído; usuário permanece no E10.4 e corrige os campos.

Cenário 4 — Erro de sistema (rede/servidor)
- O salvamento falha por erro de sistema.
- O que o usuário vê
  - Mensagem discreta (banner) perto das ações: “Não foi possível salvar agora. Tente novamente.”
  - Dados digitados permanecem.
  - Botão volta ao normal.
- Resultado
  - Usuário pode tentar salvar novamente.

Casos do Roadmap
- E10.4
- E10.4.4 (dados mínimos v1 + validações)
- E10.4.5 (persistência do perfil v1)
- E10.4.6 (exec: persistência + promoção status-based pending_setup → active)
- E10.5 (destino pós-setup)


E10.5 — Conta active sem entitlements — Pós-setup persuasivo

Ponto de Partida
1. Usuário entra no dashboard da conta (/a/[account]).
2. A conta está active.
3. A conta ainda não possui trial/plano (sem entitlements para criar LPs).
4. A página mostra a etapa pós-setup persuasiva (CTAs para conversão e alternativas claras).
