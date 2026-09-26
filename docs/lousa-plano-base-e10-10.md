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

## 8. V2 técnica mínima candidata — decisão pendente

Esta seção é candidata, não é a V2 consolidada nem libera o cutover. A V1 acima e seu commit de congelamento `572052958520a2883a9bf5ae80a5ccbacb672ee8` permanecem inalterados.

### 8.1. 10.10.3 — Recorte factual e cutover

- A definição competente dos fields continua em `public.taxon_factual_fields`, consumida pelo resolver E20.8. O resultado ativo pretendido pela V1 é somente `business_display_name` universal obrigatório e `creci_registration` opcional no taxon `corretor-imoveis`; os demais registros permanecem fisicamente preservados.
- O estado hospedado inspecionado em 26/09/2026 contém 26 rows ativas, não as 25 implícitas na V1. `professional_regulatory_credential` é a row adicional. A decisão de incluí-la entre os inativos está pendente da supervisão; nenhuma migration candidata pode ser aplicada ao projeto hospedado por inferência.
- Uma migration incremental candidata deve definir o recorte sem exclusão física e demonstrar, em PostgreSQL compatível e sem persistir no projeto alvo, contagem, obrigatoriedade, resolução dos taxons representativos e ausência de condições órfãs. Não alterar migration E20.8 já aplicada. A prova da migration integral e a decisão sobre a 26ª row são gates anteriores ao merge.
- Para respostas por conta, estender `public.account_profiles` com `business_display_name` e `creci_registration` opcionais; `whatsapp` já reside nessa tabela. Não reutilizar `accounts.name`, texto livre do Pending Setup ou configuração legada de landing page como nome público sem origem factual comprovada. A escrita é server-side, limitada a conta elegível e papel `owner`/`admin`/`editor`; `viewer` somente lê. Preservar RLS e as políticas existentes.

### 8.2. 10.10.4 — UX factual e prontidão para a Base

- Na conta ativa com entitlement comercial válido, taxon primário ativo e cobertura E20.8 válida, apresentar e-mail autenticado e taxon confirmado somente leitura, nome público obrigatório e editável, WhatsApp opcional e editável, e CRECI opcional e editável apenas quando o field estiver na cobertura do taxon. Valor legítimo já persistido é pré-preenchido; ausência não é inventada nem substituída por IA.
- A leitura e a gravação revalidam autorização, entitlement, taxon e cobertura no servidor. A gravação normaliza e valida entrada com limite de tamanho; somente o nome público vazio ou inválido bloqueia a prontidão factual. Falha de leitura, cobertura ou gravação não é tratada como conclusão.
- E25.1 ainda não existe e depende da conclusão de E10.10. Assim, a conclusão factual produz estado explícito de prontidão para a Base, sem criar rota, conteúdo ou placeholder de PB2. A navegação real é dependência de E25.1, conforme orientação da supervisão.
- Aplicar o patch de Updates `prod#17` proporcionalmente: labels persistentes, identificação de readonly, erro textual por campo, foco/teclado, feedback de salvamento e erro, alvo tátil e inspeção desktop/mobile. `prod#14` e `prod#16` são travas de validação, não novas features; não declarar conformidade WCAG integral.

### 8.3. Prova e limites da candidata

- Testes focais: cobertura universal e `corretor-imoveis`, CRECI ausente/presente, outro taxon, nome pré-existente, WhatsApp ausente/presente, papéis de leitura/escrita, elegibilidade negada, cobertura inválida e falha de persistência.
- Validações de código na ordem `npm ci`, `npm run check`; migration integral em PostgreSQL compatível com rollback ou ambiente isolado autorizado; inspeção de diff, QA visual e funcional hospedado no Preview do mesmo head. Nenhuma dessas provas foi declarada concluída por esta seção.
- Escopo negativo e critérios funcionais da V1 continuam vinculantes. Não iniciar E25.1, não aplicar SQL hospedado pré-merge e não solicitar merge antes da decisão sobre a row adicional e das evidências obrigatórias.
