# E23.2 — Classificação segura das variáveis Vercel

Status: V1 funcional aprovada no Debate 06; execução Light; supervisão Autônoma.

Fonte aprovada: [Debate 06 — Implementações transversais prioritárias — LP Factory 10](https://docs.google.com/document/d/1HvHycy9dHY2GdnrChVjhuqrtqk3TCRT7cd5iS9v1dhs/edit), seção 11, documento `1HvHycy9dHY2GdnrChVjhuqrtqk3TCRT7cd5iS9v1dhs`, revisão `ANLCKQkyv3QKi4d5bpXOOV2Y0qUhf7Saj7WUE5TL7hgFHMb0p-YUqtDXk6FvP28vvPyRe3DyeLE8z4WiGOXtJ6XKgTdnKRmAFOt8WY8xL0Q`, consultada em 06/09/2026.

## 1. Problema e resultado

- Problema: o projeto documenta finalidade e escopo das variáveis, mas ainda não confirmou sua classificação efetiva entre Config e Secret na Vercel.
- Resultado funcional: todas as variáveis ativas ficam coerentes com sua natureza e seus ambientes, sem exposição de valores e sem mudança indevida de consumidores.

## 2. Atores e comportamento esperado

- Atores afetados: operadores autorizados, executores técnicos e consumidores server-side ou públicos das variáveis.
- Comportamento esperado: configurações públicas permanecem inspecionáveis; credenciais permanecem protegidas; o runtime conserva o comportamento vigente.

## 3. Limites, riscos e dependências

- Escopo negativo: não ler, copiar, imprimir, trocar ou versionar valores; não renomear variável, alterar consumidor, ampliar ambiente ou rotacionar credencial.
- Risco funcional material: uma classificação incorreta ou redeploy inadequado pode indisponibilizar um consumidor.
- Dependências reais: projeto Core da Vercel, inventário de `docs/platform-config.md` e acesso operacional autorizado.
- Se a inspeção revelar mudança além da classificação Config/Secret, o ponto fica fora desta V1 e exige nova decisão.

## 4. Posição e fase planejadas no roadmap

- Caso macro planejado: E23 — Segurança e governança transversal da plataforma.
- Plano-base: E23.2 — Classificação segura das variáveis Vercel.
- Estrutura planejada: 23.2.1 Objetivo e status; 23.2.2 Registros do recorte quando houver entrega material; 23.2.3 Inspeção e reconciliação segura das classificações.
- Fase 23.2.3: confirmar a classificação e corrigir somente divergências comprovadas dentro dos limites aprovados.

## 5. Classificação e automação

- Execução: Light, porque utiliza configuração e governança de plataforma já existentes, sem nova arquitetura.
- Automação: não criar automação; a atividade é uma inspeção e configuração operacional pontual.

## 6. Aceite e evidências

- Critério de aceite: nomes, tipos e escopos das variáveis ativas inventariados sem valores.
- Critério de aceite: cada credencial confirmada como Secret e cada configuração pública confirmada como Config.
- Critério de aceite: divergências necessárias corrigidas e consumidores preservados; redeploy e smoke somente quando exigidos pela mudança.
- Evidências esperadas: relatório sanitizado por nome, tipo e ambiente, confirmação operacional da Vercel e atualização de `docs/platform-config.md` somente se houver estado material novo.

## 7. Estado da V1

- V1 funcional aprovada. Execução: Light. Supervisão: Autônomo.
