# E10.10 — Onboarding factual pós-compra/trial

Status: V1 funcional consolidada e liberada para handoff; execução Light; supervisão Autônoma.

Fonte aprovada: [Debate 14 — Jornada pós-compra/trial e Base de Comunicação — LP Factory 10](https://docs.google.com/document/d/1ZRz72PBFwWPz-ZGrIPtkydtpElUjeGoHdjnuQdOKgk0/edit), seção 4.1, revisão `ANLCKQnpnFYKvewq7l1j9EWaxYCn-A-Mk8U5CKUHRdBRlaHivSBCuInR1igN2ODKtT_pEnl5p7iHqdRD_l1V-qUVK9ogwQrCXRQwHKUxd38`, consultada em 26/09/2026.

## 1. Problema e resultado

- Problema: após a entrada comercial válida, obter e confirmar o mínimo factual aplicável sem repetir o Pending Setup, sem questionário extenso e sem obrigar IA.
- Resultado: `business_display_name` válido é o único gate factual; `creci_registration` permanece ativo e opcional quando aplicável ao nicho `corretor-imoveis`; os demais 23 fields atuais ficam inativos e preservados fisicamente.

## 2. Atores e UX

- `owner`, `admin` e `editor` podem preencher ou corrigir dados autorizados; `viewer` permanece somente leitura.
- E-mail autenticado e nicho/taxon confirmado aparecem pré-preenchidos e somente leitura.
- `business_display_name` é pré-preenchido quando houver valor legítimo e permanece editável.
- WhatsApp é reaproveitado quando existir e permanece editável.

## 3. Dependências, limites e escopo negativo

- Dependências: conta autorizada pelas regras vigentes, taxon oficial competente já resolvido e cobertura factual ativa válida da E20.8.
- Escopo negativo: não inclui Pending Setup, identidade, resolução de nicho, compra/trial, troca de e-mail, troca de nicho, Base de Comunicação, geração de produtos, Web Search ou chamada obrigatória de IA.
- Contas atuais são de teste e não exigem preservação de experiência, valores ou estado; dados QA podem ser recriados no cutover.

## 4. Posição planejada e fases

- Roadmap planejado: `E10.10 — Onboarding factual pós-compra/trial`.
- `10.10.3 — Recorte factual e cutover`: manter ativos `business_display_name` e `creci_registration` conforme a V1, inativar os demais 23 fields e comprovar cobertura válida, sem referências condicionais órfãs nem regressão dos consumidores vigentes.
- `10.10.4 — UX factual e passagem à Base`: apresentar/reaproveitar os dados conforme a V1, aplicar edição/leitura por papel e permitir seguir imediatamente para PB2 quando o mínimo factual estiver satisfeito.

## 5. Classificação e automação

- Execução: Light.
- Supervisão: Autônomo.
- Automação: determinística sem OpenAI, no runtime da LP Factory. IA não é requisito funcional deste plano.
- Participação humana: confirmação ou correção dos dados editáveis; nenhuma aprovação técnica ou administrativa por execução.

## 6. Critérios de aceite e evidências

- Uma conta elegível com taxon resolvido conclui o PB1 sem responder novamente dado válido já disponível e sem chamada obrigatória de IA.
- `business_display_name` é o único blocker factual; ausência de WhatsApp ou de `creci_registration` não bloqueia a passagem à Base.
- E-mail e nicho aparecem somente leitura; nome do negócio e WhatsApp, quando aplicável, podem ser corrigidos.
- A cobertura ativa da E20.8 resolve corretamente com os dois fields definidos e sem `MISSING_CONDITION_REFERENCE`; os 23 inativos não são solicitados.
- QA representativa cobre ao menos: conta com dados reaproveitados, conta sem WhatsApp, `corretor-imoveis` com e sem CRECI e conta de outro taxon.
- Evidência esperada: testes automatizados da cobertura/validação aplicável e QA hospedado da jornada e dos estados visuais essenciais.

## 7. Estado da V1

- V1 funcional aprovada.
- Execução: Light.
- Supervisão: Autônomo.
