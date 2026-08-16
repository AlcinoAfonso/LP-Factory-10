0. Introdução

0.1 Cabeçalho
• Documento: Gestor de Segurança (Plataformas)
• Versão: v0.2.1
• Data: 16/08/2026

0.2 Contrato do documento
• O QUE É: fonte de governança do Gestor de Segurança para objetivo, limites, decisões implementadas, pendências priorizadas e temas de segurança para debate futuro.
• USAR PARA: manter o estado decisório da segurança de plataformas sem duplicar inventário operacional ou documentação técnica.
• NÃO USAR PARA: configurações operacionais detalhadas (usar `docs/platform-config.md`), regras técnicas de runtime/código (usar `docs/base-tecnica.md`), contrato de banco/RLS/policies (usar `docs/schema.md`) ou status de casos E* (usar `docs/roadmap.md`).
• REGRA: este documento é cumulativo, mas deve permanecer enxuto; manter apenas decisões, pendências, regras e temas que ainda tenham valor de segurança.
• REGRA: nunca registrar valores reais de secrets, tokens, senhas ou chaves.

1. Objetivo e escopo do papel

1.1 Objetivo
• Reduzir risco de falhas de configuração, exposição de credenciais, permissões excessivas e dependências de segurança inadequadas nas plataformas usadas pelo projeto.
• Manter uma visão simples do que já foi resolvido, do que precisa ser tratado agora e do que merece reavaliação futura.

1.2 Funções
• Monitorar configurações de segurança, permissões e acessos das plataformas.
• Verificar armazenamento e possível exposição de secrets, tokens e chaves.
• Avaliar alertas, e-mails e recomendações de segurança enviados pelas plataformas.
• Manter pendências de segurança em ordem de prioridade.
• Inspecionar pontualmente arquivos, commits ou configurações quando necessário para confirmar um alerta ou possível exposição.
• Avaliar tecnologias, serviços e controles com impacto material de segurança, considerando custo-benefício, nova superfície de risco, dependências e reversibilidade.
• Registrar o que precisa ser endurecido antes do GO-LIVE.

1.3 Limites
• Não realizar auditoria ampla de segurança de código, SQL, RLS ou arquitetura.
• Não escrever ou executar SQL como função deste papel.
• Não assumir a decisão de arquitetura geral do produto.
• Não bloquear releases nem exercer veto técnico.
• Quando uma pendência exigir validação de código, DB, RLS ou arquitetura, encaminhar a análise técnica ao responsável adequado e registrar aqui apenas o resultado de segurança.

1.4 Regras permanentes
• Valores reais de secrets não devem ser versionados nem documentados.
• Se houver exposição real confirmada, revogar ou rotacionar a credencial antes da limpeza documental ou do histórico aplicável.
• Se um novo ambiente Supabase de staging for criado, controles mínimos de segurança devem existir desde a criação.
• Um falso positivo anterior não autoriza ignorar novos alertas semelhantes.

2. Fontes e plataformas

2.1 Fonte operacional
• `docs/platform-config.md` é a fonte única do inventário de plataformas, integrações, variáveis e secrets por nome; este documento não mantém lista paralela de plataformas.
• O Gestor de Segurança acompanha qualquer plataforma ou serviço registrado ali quando houver impacto material de segurança.

2.2 Fontes complementares
• `README.md`: visão, princípios do MVP e critérios de simplicidade.
• `docs/base-tecnica.md`: regras técnicas e de segurança do runtime.
• `docs/schema.md`: autoridade para DB, RLS, policies, grants e funções.
• `docs/roadmap.md`: estado dos casos E* quando a pendência depender deles.

3. Decisões implementadas

3.1 Supabase STAGING descontinuado
• O antigo projeto `LP-Factory-10-staging` foi descontinuado e deletado em 31/03/2026 após alerta crítico de RLS desativado.
• Não existe staging Supabase ativo decorrente daquele ambiente.
• Risco correspondente encerrado.

3.2 Triagem do Supabase Security Advisor concluída
• Triagem realizada em 16/08/2026 sobre 29 ocorrências atuais: 22 WARN e 7 INFO.
• Os 7 INFO de RLS habilitado sem policy correspondem, conforme `docs/schema.md`, a objetos deliberadamente sem acesso direto por `public`/`anon`/`authenticated`; não criar policies apenas para eliminar o aviso.
• Os 6 WARN de funções `SECURITY DEFINER` executáveis por `authenticated` correspondem a RPCs privilegiadas documentadas e controladas; não revogar `EXECUTE` nem trocar para `SECURITY INVOKER` sem novo caso técnico.
• Os 15 WARN de objetos visíveis no schema GraphQL correspondem a objetos com acesso intencional e proteção por RLS/policies ou `security_invoker`; não foi identificada correção simples que justifique o risco de regressão.
• Resultado: nenhuma alteração de SQL/RLS recomendada apenas para limpar esses avisos.
• Foi identificado drift documental pontual em `docs/schema.md`; tratar separadamente como manutenção documental, não como vulnerabilidade confirmada.

4. Pendências de segurança

4.1 Prioridade 1 — Tornar o repositório GitHub privado
• Estado verificado em 16/08/2026: `AlcinoAfonso/LP-Factory-10` permanece público.
• Objetivo de segurança: tornar o repositório privado, por se tratar de produto comercial proprietário com código, documentação, migrations, workflows e regras internas.
• Antes da mudança, validar continuidade de acesso para ChatGPT/Codex, Vercel, GitHub Actions, GitGuardian e demais integrações necessárias.
• As páginas públicas hospedadas na Vercel são independentes da visibilidade do repositório e podem continuar públicas.

4.2 Supabase Auth — Leaked Password Protection
• `Leaked Password Protection Disabled` permanece como warning conhecido.
• O ajuste depende de plano Supabase compatível; reavaliar quando houver upgrade e, no máximo, antes do GO-LIVE.
• Não há ação técnica disponível no plano atual.

5. Temas para debate futuro

5.1 Cloudflare AI Gateway
• Opção futura de segurança; não há pendência de implementação no MVP atual.
• Potencial valor: DLP, rate limiting, limites de gasto, observabilidade e fallback de workloads de IA, em troca de nova dependência e superfície operacional.
• Reavaliar quando houver aumento relevante de volume/custo de IA, processamento de PII ou conteúdo comercial sensível, necessidade de fallback entre provedores ou controles centralizados adicionais de segurança/observabilidade.
