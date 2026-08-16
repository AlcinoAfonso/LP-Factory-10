0. Introdução

0.1 Cabeçalho
• Documento: Gestor de Segurança (Plataformas)
• Versão: v0.1.2
• Data: 16/08/2026

0.2 Contrato do documento
• O QUE É: fonte de governança do Gestor de Segurança para objetivo, escopo, limites, decisões vigentes, decisões implementadas, pendências, temas em decisão e temas para debate futuro.
• USAR PARA: registrar o que deve ser acompanhado pelo papel e preservar decisões de segurança ao longo do projeto.
• NÃO USAR PARA: configurações operacionais detalhadas das plataformas (usar `docs/platform-config.md`), regras técnicas de runtime/código (usar `docs/base-tecnica.md`), contrato de banco (usar `docs/schema.md`) ou status de casos E* (usar `docs/roadmap.md`).
• REGRA: este documento é cumulativo e não deve ser resetado; deve ser atualizado conforme novas evidências e decisões surgirem.
• REGRA: nunca registrar valores reais de secrets, tokens, senhas ou chaves.

1. Objetivo e escopo do papel

1.1 Objetivo
• Reduzir risco de falhas de configuração, exposição de credenciais e permissões excessivas nas plataformas usadas pelo projeto.
• Manter uma visão simples das decisões de segurança já fechadas, das decisões já implementadas, das pendências, dos temas em decisão e dos temas relevantes para debate futuro.

1.2 Funções
• Monitorar configurações de segurança das plataformas.
• Checar permissões e acessos segundo o princípio do menor privilégio.
• Verificar armazenamento e exposição de secrets, tokens e chaves.
• Avaliar alertas, e-mails e recomendações de segurança enviados pelas plataformas.
• Registrar riscos, recomendações, decisões e pendências.
• Manter registro do que precisa ser endurecido antes do GO-LIVE.
• Inspecionar pontualmente arquivos, commits ou configurações quando necessário para confirmar exposição de secret ou evidenciar alerta de plataforma, sem assumir revisão ampla de segurança de código.
• Avaliar tecnologias, serviços e controles cuja finalidade ou impacto material seja segurança, incluindo custo-benefício, nova superfície de risco, dependências e reversibilidade, sem assumir a decisão de arquitetura geral do produto.

1.3 Limites
• Não realizar auditoria de segurança de código, SQL, RLS ou arquitetura.
• Não escrever ou executar SQL como função deste papel.
• Não alterar arquitetura do sistema nem assumir responsabilidade pela arquitetura geral do produto.
• Não bloquear releases nem exercer veto técnico.
• Não alterar configurações de plataforma por iniciativa própria; orientar, registrar e encaminhar execução quando aprovada.

2. Plataformas monitoradas

2.1 Escopo atual
• GitHub.
• Vercel.
• Supabase.
• Resend.
• Codex.
• ChatGPT / OpenAI.
• Stripe, quando houver configuração de segurança relevante.
• Registro.com / DNS, quando houver configuração de segurança relevante.
• Zoho Mail, quando houver configuração de segurança relevante.

3. Critério de acompanhamento

3.1 Status
• OK: configuração adequada ou risco encerrado.
• Ajustar: melhoria recomendada ou endurecimento ainda pendente.
• Risco: possível exposição ou configuração potencialmente perigosa.

3.2 Regra de atualização
• Atualizar este documento quando houver nova evidência, alerta relevante, decisão humana ou mudança de estado de uma pendência.
• Não duplicar inventário operacional já mantido em `docs/platform-config.md`; registrar aqui somente o significado de segurança e a decisão correspondente.
• Decisão vigente é uma regra ou posição atualmente válida, independentemente de já ter sido executada.
• Decisão implementada é uma decisão já aplicada e validada operacionalmente.
• Tema em decisão é um assunto em debate ativo que precisa chegar a uma decisão.
• Tema para debate futuro é relevante para segurança, mas não exige decisão nem implementação no momento; deve ter gatilho objetivo de reavaliação quando possível.
• Quando um tema em decisão for fechado, movê-lo para Decisões vigentes, Decisões implementadas ou Pendências de segurança, conforme o resultado.
• Quando um tema para debate futuro atingir seu gatilho de reavaliação, movê-lo para Temas em decisão.

4. Decisões vigentes

4.1 Secrets e credenciais
• Valores reais de secrets não devem ser versionados; somente nomes, finalidade, plataforma e escopo podem ser documentados.
• Se houver exposição real confirmada, a primeira ação é revogar ou rotacionar a credencial antes da limpeza documental ou do histórico aplicável.

4.2 Supabase STAGING futuro
• Se um novo staging Supabase for criado, controles mínimos de segurança devem existir desde a criação, sem depender de correção posterior.

4.3 Alertas de segurança
• Alertas de plataformas devem ser avaliados individualmente.
• Um falso positivo anterior não autoriza ignorar novas ocorrências semelhantes.

5. Decisões implementadas

5.1 Supabase STAGING descontinuado
• O antigo projeto `LP-Factory-10-staging` foi descontinuado e deletado em 31/03/2026 após alerta crítico de RLS desativado.
• Não existe staging Supabase ativo decorrente daquele ambiente.
• Risco correspondente encerrado.

5.2 Alerta GitGuardian de junho de 2026
• A investigação do alerta `Generic High Entropy Secret` concluiu falso positivo.
• Não foi identificada exposição real de token, senha, chave privada ou connection string nos itens investigados.
• Não houve necessidade de rotação de credenciais.
• Ocorrência encerrada.

6. Pendências de segurança

6.1 Supabase Auth — Leaked Password Protection
• A proteção contra senhas vazadas permanece desativada no projeto principal.
• O estado foi aceito temporariamente enquanto o recurso não estiver disponível no plano atual.
• Reavaliar quando houver plano compatível e, no máximo, antes do GO-LIVE comercial.

6.2 Revisão pré-GO-LIVE
• Antes do lançamento comercial, revisar permissões, acessos, secrets, autenticação e demais endurecimentos pendentes nas plataformas efetivamente usadas.

7. Temas em decisão

7.1 Visibilidade do repositório GitHub
• Estado atual verificado em 16/08/2026: `AlcinoAfonso/LP-Factory-10` está público.
• Recomendação do Gestor de Segurança: tornar o repositório privado por se tratar de produto comercial proprietário com código, documentação, migrations, workflows e regras internas.
• Antes da mudança, validar continuidade de acesso para ChatGPT/Codex, Vercel, GitHub Actions, GitGuardian e demais integrações que dependam do repositório.
• As páginas públicas do produto hospedadas na Vercel são independentes da visibilidade do repositório e podem continuar públicas com o repositório privado.
• Status: decisão humana pendente.

8. Temas para debate futuro

8.1 Cloudflare AI Gateway
• Classificação atual: opção futura de segurança; não há decisão nem pendência de implementação.
• Potencial valor: DLP, rate limiting, limites de gasto, observabilidade e fallback dos workloads de IA.
• Avaliação atual: o custo-benefício não justifica adoção no MVP enquanto não houver problema material que compense a nova dependência e a complexidade adicional.
• Gatilhos de reavaliação: aumento relevante de volume ou custo de IA; processamento de PII ou conteúdo comercial sensível; necessidade de fallback entre provedores; necessidade de controles centralizados de segurança ou observabilidade além dos atuais.
• Quando algum gatilho ocorrer, reavaliar segurança, custo, superfície de falha, exposição de dados, dependência e reversibilidade antes de decidir adoção.

9. Manutenção do documento

9.1 Regra contínua
• Este documento deve evoluir por atualização incremental, preservando decisões já tomadas.
• Evitar narrativa operacional longa; manter somente o necessário para decisão, risco, pendência e evidência.
• Quando uma pendência for resolvida, registrar o estado final em Decisões implementadas quando houver execução validada, ou em Decisões vigentes quando o resultado for uma regra ainda não executada.
• Temas para debate futuro não devem ser tratados como pendência nem como compromisso de implementação.