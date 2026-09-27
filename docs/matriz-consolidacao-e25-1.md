# Matriz de consolidação — PB-A / E25.1

## 1. Referências e estado

- V1: commit `4ed0ea5a366d6d566a751fcc3487209b0068ec1a`, blob `b4babf6f7224fe926f677d221a68bdfa074c3b71`, `docs/lousa-plano-base-e25-1.md`.
- V2 candidata original: commit `05d3dcbc3a629c99409fff26f99683fa99009608`, blob `75f86e59aca9bb555b1164bea9fbb44950266574`; V2 corrigida candidata: commit `a976477c19bbb657914c81c3115365b430d7b003`, blob `9a5c9a5b626a3614c58d8317b61969e121ef73a3`, mesmo path.
- Roadmap-base: `origin/main@b771bec758d8cd32a40174a064af39a334bdb03e`, blob `71dbda023094c12e6480ddc3e8e33aa52c89e6ad`.
- Gestor Estrutural inicial: `aprovado com condicionantes`, GE-E25-01 a GE-E25-06 e quatro condicionantes. Revisão focal pedida pela Passagem 2: `requer patch estrutural`, GE-E25-W01/W02; patch de escrita server-only incorporado à V2 corrigida.
- Gestor de Updates: `updates aplicáveis com patches autossuficientes`; aplicar `prod#17`; demais itens são referências, travas ou oportunidades condicionais.
- Confronto estrutural de modernização: N/A; o único update aplicável agora tem impacto estrutural baixo e nenhum impacto funcional.
- Gestor de Automações: `requer validação material pelo Analista`; sem patch de recomendação de IA por ausência de prova de custo incremental zero. A revisão delta do Analista resolve a distinção de autoridade: o gate rege recomendação de recurso candidato, enquanto IA e Web Search material já integram a V1, sem alegação de gratuidade.
- Analista Passagem 1: `aprovado com correções obrigatórias` (cinco itens). Passagem 2: `requer nova rodada especializada`; revisão estrutural focal executada. Revisão delta: `aprovado com correções obrigatórias` restritas à limpeza textual de autoridade/status; novo delta textual aguarda o mesmo Analista.

## 2. Matriz

A classe `ampliação de escopo` em updates não adotados descreve o efeito que sua adoção teria; nenhum deles integra a V2 atual.

| ID | Origem | Classe | Achado | Tratamento | Localização e evidência | Destino do update / confronto |
| --- | --- | --- | --- | --- | --- | --- |
| V1-01 | v1 | derivação técnica da v1 | Uma Base atual por conta, só da conta, sem vínculos vivos. | Tabela 1:1 e boundary próprio; excluir E20/E10.10 e consumidores como owners. | V2 §5.2, PK e ausência de outras FKs. | N/A |
| V1-02 | v1 | derivação técnica da v1 | Acesso após entitlement, papéis e isolamento. | Reusar Access Context e autoridade E9; rota/ações refazem guard; RLS e grants. | V2 §5.2; prova prevista em §5.5. | N/A |
| V1-03 | v1 | derivação técnica da v1 | Etapa 1 progressiva com importação confirmada e IA opcional. | Seções independentes, cópia inicial única e rascunho separado de fato. | V2 §5.3; prova em §5.5. | N/A |
| V1-04 | v1 | derivação técnica da v1 | Etapa 2 usa IA e pesquisa atual quando material sem transformar hipótese em fato. | Workload próprio, saída validada, busca obrigatória quando material e falha fechada, sob E21. | V2 §5.4; §5.5; fonte funcional V1 §4.2.2. | N/A |
| V1-05 | v1 | derivação técnica da v1 | Nova seção em formato suportado preserva Base existente. | Registry fechado e chave ausente renderizada sem reescrever seções prévias. | V2 §5.2; prova em §5.5. | N/A |
| V1-06 | v1 | derivação técnica da v1 | Limite negativo aprovado: LP, canais, trial, E10/Pending Setup, E20, E10.10, Agents SDK, job, fila e framework arbitrário. | Preservar a proibição funcional; todos excluídos do delta e da arquitetura. | V1 §4.2.2; V2 §§5.1–5.5. | N/A |
| GE-E25-01 | invariante técnico | derivação técnica da v1 | Loader atual depende de E10.10 e taxon. | Rota da Base e entrada próprias; não alterar loader. | V2 §5.2; código `account-journey-loader.ts`. | N/A |
| GE-E25-02 | invariante técnico | derivação técnica da v1 | Evitar segunda decisão de acesso. | APIs de Access Context e entitlement existentes, revalidadas no servidor. | V2 §5.2; `lib/access/`, `lib/commercial-entitlements/`. | N/A |
| GE-E25-03 | invariante técnico | derivação técnica da v1 | Adapter de Pending Setup inicia conversa e não serve à importação. | Leitura focal de completed, sem RPC de início e sem escrita reversa. | V2 §5.3; adapter vigente. | N/A |
| GE-E25-04 | invariante técnico | derivação técnica da v1 | Não há persistência da Base no schema atual. | Nova tabela por conta com JSON por seção, versão e RLS. | V2 §5.2; `docs/schema.md` vigente. | N/A |
| GE-E25-05 | invariante técnico | derivação técnica da v1 | Workloads E21 atuais são de outros domínios. | Registrar dois workloads próprios, distintos por etapa, sem reusar E20/E10. | V2 §§5.3–5.4; `lib/openai-workloads/registry.ts`. | N/A |
| GE-E25-06 | invariante técnico | derivação técnica da v1 | Roadmap diz depender de E10.10, contra V1. | ABC planejamento corrige somente dependência obsoleta e materializa E25.1. | V2 §5.1; roadmap-base §E10.10; ainda pendente. | N/A |
| GE-C01 | invariante técnico | derivação técnica da v1 | Entrada direta sem taxon/E10.10. | Provar com conta de dogfooding E9.2 pela rota e acesso visível. | V2 §§5.2, 5.5. | N/A |
| GE-C02 | invariante técnico | derivação técnica da v1 | Importação única e sem sync reversa. | Fonte completed inequívoca, criação idempotente, sem sobrescrever edição. | V2 §§5.3, 5.5. | N/A |
| GE-C03 | invariante técnico | derivação técnica da v1 | Migration, ACL, concorrência e apply precisam de prova. | Testes SQL e gate hospedado pós-apply. | V2 §§5.2, 5.5. | N/A |
| GE-C04 | invariante técnico | derivação técnica da v1 | Roadmap deve conter 25.1.1–25.1.5 e eliminar dependência de E10.10. | ABC de planejamento após aprovação V2. | V2 §§5.1, 5.5; ainda pendente. | N/A |
| GE-E25-W01 | invariante técnico | derivação técnica da v1 | Data API com escrita authenticated contorna adapter. | Revogar escrita direta; Server Actions autorizam e adapter server-only usa service_role com validação/versão. | V2 §5.2 corrigida e gate §5.5; revisão focal estrutural. | N/A |
| GE-E25-W02 | invariante técnico | derivação técnica da v1 | Client server-only e maxAffected já existem, sem duplicar registry no banco. | Reusar `createServiceClient()` somente no adapter; nenhuma RPC/trigger nova. | V2 §§5.2, 5.5; `lib/supabase/service.ts`. | N/A |
| AUT-25.1.4-D | v1 | derivação técnica da v1 | Cópia de dado confirmado é determinística. | Incorporada; sem IA só para copiar, sem sincronização. | V2 §5.3. | N/A |
| AUT-25.1.4-IA | v1 | derivação técnica da v1 | IA opcional organiza/sugere sem confirmar fato. | Contrato funcional preservado; workload próprio sem Web Search e fallback manual. Gate de recomendação de recurso candidato não reabre a IA opcional já aprovada; E21 rege execução e custo. | V2 §§5.3–5.4 corrigidas. | N/A |
| AUT-25.1.5-IA | v1 | derivação técnica da v1 | IA e Web Search material compõem Etapa 2. | Contrato funcional preservado, workload próprio com busca material. Especialista não recomenda patch; IA e busca material derivam da V1 aprovada, sob E21, sem presumir gratuidade. | V2 §5.4 corrigida; distinção de autoridade resolvida na revisão delta. | N/A |
| UP-prod-17 | update | modernização técnica justificada | QA WCAG 2.2 focal, automático mais manual. | Aplicar agora, sem alegação de conformidade integral. | V2 §§5.1, 5.5; ganho: labels, contraste, hover, foco e feedback verificáveis; custo de plataforma zero; impacto estrutural baixo/funcional nulo. | Destino E25.1 QA; confronto N/A. |
| UP-prod-16 | update | derivação técnica da v1 | QA Preview desktop/mobile e estados já exigidos. | Usar como referência/trava, sem patch adicional. | V1 §4.2.5; V2 §5.5. | Destino validação E25.1; confronto N/A. |
| UP-supa-63 | update | ampliação de escopo | Ferramenta beta de testes de RLS. | Não instalar; testes SQL focais são gate. | V2 §5.5; catálogo como referência. | Condicional em banco descartável e ganho demonstrado; confronto atual N/A. |
| UP-supa-47 | update | ampliação de escopo | Capacidade Storage para materiais. | Não criar upload/storage no recorte. | V2 §5.3; materiais textuais. | Referência futura se arquivo real for aprovado; confronto N/A. |
| UP-vercel-01 | update | ampliação de escopo | AI Gateway sobrepõe transporte/observabilidade E21. | Não implementar. | V2 §5.4 usa boundary E21 vigente. | Futuro se volume/múltiplos provedores ou falha medida justificarem, comparação custo/latência/qualidade e zero custo; confronto estrutural futuro. |
| UP-vercel-21 | update | ampliação de escopo | Private Blob substituiria storage vigente. | Não implementar. | V2 §5.3 não exige upload. | Futuro se arquivo privado concreto superar storage vigente com prova de custo; confronto futuro. |
| UP-vercel-29 | update | ampliação de escopo | Navegação instantânea pode alterar cache/frescor. | Não habilitar por rotina. | V2 §5.2 mantém guards dinâmicos. | Condicional a lentidão reproduzida e ganho medido; confronto atual N/A. |
| UP-supa-69 | update | ampliação de escopo | Trace Context exigiria tracer/retensão. | Não instalar. | V2 §5.5 observabilidade focal. | Condicional a incidente que requestId não resolva, tracer aprovado e custo zero; confronto futuro se material. |
| UP-github-10 | update | ampliação de escopo | Política Actions transversal. | Não alterar workflows/settings. | Escopo negativo V1 e diff atual. | Referência de governança separada; confronto N/A. |
| A-P1-01 | invariante técnico | derivação técnica da v1 | Escrita direta em tabela exposta contorna adapter, validação e versão. | Corrigido na V2 candidata via GE-E25-W01/W02: escrita server-only e ACL sem INSERT/UPDATE authenticated. | V2 §§5.2, 5.5 corrigidas; fechado na revisão delta. | N/A |
| A-P1-02 | invariante técnico | derivação técnica da v1 | Gate financeiro de IA sem evidência competente. | Resolvido pela fonte competente: o gate de custo zero limita recomendações de automação/update candidato, não a execução da IA e busca material aprovadas na V1; sem presunção de gratuidade e com E21 preservado. | V2 §5.4; `docs/gestor-automations.md` §§3/3.1; `docs/workflow-atualizacao-updates.md` linhas 24/90/195; revisão delta do Analista. | N/A |
| A-P1-03 | invariante técnico | derivação técnica da v1 | IA opcional da Etapa 1 sem identidade E21 explícita. | Corrigido: dois workloads E21, Etapa 1 sem busca/fallback manual, Etapa 2 busca material e falha fechada; ambos registram uso/custo. | V2 §§5.3–5.4 corrigidas; fechado na revisão delta. | N/A |
| A-P1-04 | invariante técnico | derivação técnica da v1 | Fonte Pending Setup é por conta e usuário, Base é por conta. | Corrigido: detectar no máximo dois completed por conta, importar só único texto direto inequívoco; ambiguidade não copia. | V2 §5.3 corrigida; fechado na revisão delta. | N/A |
| A-P1-05 | invariante técnico | derivação técnica da v1 | Sequência runtime/deploy/apply ainda aberta. | Corrigido na V2 candidata: gate off em Preview/Production, teste SQL isolado, merge+apply canônico, prova no alvo, habilitar gate e redeploy, QA positivo. | V2 §5.2 corrigida; fechado na revisão delta. | N/A |

## 3. Pendências para auditoria

- GE-E25-W01/W02 e os itens A-P1-01/03/04/05 foram fechados pela revisão delta do mesmo Analista; a aprovação final da V2 depende somente da conferência textual desta matriz e do plano.
- A-P1-02 foi resolvido pela distinção de autoridade, sem alterar o parecer de Automações nem presumir saldo, preço zero ou gratuidade; E21 e a Etapa 2 integral permanecem vinculantes.
- Roadmap ainda é snapshot anterior; ABC e revisão delta do roadmap só seguem após aprovação da V2.
