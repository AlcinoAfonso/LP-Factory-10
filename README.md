0. Introdução
0.1. Cabeçalho
• Documento: README — LP Factory 10 (MVP)
• Data: 25/01/2026
• Escopo: visão geral do produto + estratégia empresarial (alto nível) + referências oficiais do projeto

1. O que é
• LP Factory 10 é um produto em fase de MVP que evolui para um SaaS self-serve de landing pages por nicho com dashboard.
• O foco atual é validar a oferta, o processo e a repetibilidade antes de escalar.

2. Estratégia (atual e evolutiva)
2.1. Go-to-market inicial
• Início por conta consultiva (caso a caso) para vender, testar e validar saindo do zero.

2.2. Direção do produto
• Evoluir para SaaS self-serve quando houver sinais claros de repetibilidade e demanda.

3. Proposta de valor
• Reduzir fricção e custo de otimização de landing pages para o cliente.
• Tornar o ciclo criar → medir → ajustar → testar simples e guiado por dados, reduzindo dependência de terceiros.

4. Produto (alto nível)
4.1. Prático
• Templates por nicho e criação fácil.

4.2. Inteligente
• Recursos orientados por dados (tracking/coleta e recomendações).

4.3. Dashboard
• Suporte para ajustes e testes guiados por dados.

5. Modelo de oferta
• Planos em camadas (Starter → Lite → Pro → Ultra), com capacidades escalando ao longo do tempo.

6. Pendências estratégicas (em aberto)
6.1. Nicho inicial
• Ainda não definido.

6.2. Definições do MVP
• Starter mínimo.
• Tracking mínimo.
• Agendamento no MVP.
• Primeira recomendação concreta de IA.

6.3. Estratégia consultiva (modelo operacional)
• Decidir entre “cliente como owner desde o início” vs “LP Factory monta primeiro e faz handoff depois”.

7. Documentos oficiais (fonte de verdade)
• Como a IA deve interpretar/ajustar cada documento: ver seção 0.2 (Contrato do documento) no próprio arquivo.
• Roadmap: docs/roadmap.md → conversa com todos os documentos oficiais abaixo (fonte de verdade por referência)
• Base técnica: docs/base-tecnica.md
• Schema (DB contract): docs/schema.md
• Inventário do repositório: docs/repo-inv.md → defasado (não usar como fonte principal)
• Fluxos (legado): docs/fluxos.md → defasado / descontinuado (não usar; será substituído)
• Fluxos (atual): docs/fluxos2.md → conversa apenas com docs/roadmap.md

8. Como trabalhamos (para evitar suposições erradas)
8.1. GitHub
• Uso via interface web (não assumir repo local/terminal/git cli).

8.2. Migrations (governança atual)
• Pasta: `supabase/migrations/`
• Naming: `000X__descricao.sql` (não assumir timestamp/CLI runner por enquanto).
• Conteúdo: migrations contêm apenas SQL de implementação (sem SQL de consultas/verificação).

8.3. Fluxo prático (SQL ↔ migrations)
• Iteramos no SQL Editor do Supabase até estabilizar.
• Quando estabiliza, registramos o SQL final em um migration (efeito líquido do caso).

8.4. Branch / rollback
• Se houver risco real de a branch não ir para main e mudanças tiverem sido aplicadas no BD principal, o caso deve prever rollback separado (fora de migrations).
