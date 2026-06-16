0. Introdução

0.1 Cabeçalho
• Documento: Laboratório Imobiliário
• Data: 16/06/2026
• Status: experimental
• Escopo: operação manual, aprendizado e validação
• Classificação: fora do roadmap oficial e da oferta comercial

0.2 Contrato do documento
• O QUE É: documento inicial do laboratório imobiliário privado, experimental, dentro do repositório da LP Factory, fora da oferta comercial e do roadmap oficial do produto.
• POR QUE CONSULTAR: para orientar a operação manual do laboratório, preservar seus limites, registrar aprendizados reais de mercado e evitar que hipóteses experimentais sejam confundidas com compromisso de produto.
• QUANDO ATUALIZAR: quando houver novos aprendizados de campo, mudanças na rotina semanal, decisões operacionais do laboratório, validações manuais relevantes ou critérios concretos para avaliar evolução futura.
• QUANDO NÃO USAR: não usar como roadmap, promessa comercial, especificação técnica de runtime, CRM imobiliário, compromisso de nova vertical oficial, base para automações sem validação manual ou autorização para incluir funcionalidades no core.
• NOTA: este documento não substitui `README.md`, `docs/roadmap.md`, `docs/base-tecnica.md`, `docs/schema.md` ou qualquer documento canônico do produto.

1. Objetivo

• Apoiar uma parceria imobiliária em estágio inicial.
• Desenvolver conhecimento prático sobre mercado, atendimento, objeções, jornada de compra e operação comercial imobiliária.
• Estruturar uma rotina semanal simples para discussão, registro, experimentação e acompanhamento.
• Registrar dores, dúvidas, objeções, motivos de desistência e problemas percebidos na operação real.
• Testar comunicação, conteúdo, follow-up, captação e organização de leads por meio de processos manuais.
• Identificar oportunidades que possam ser reaproveitadas futuramente pela LP Factory como templates, serviços, automações ou funcionalidades, sem entrada automática no roadmap ou no core.

2. Participantes

• Responsável pelo produto, marketing, processos e tecnologia.
• Corretora parceira responsável pelo aprendizado de campo, atendimento, rotina comercial e experiência imobiliária.

Não registrar neste documento CPF, telefone, endereço, CRECI, dados de clientes, dados de leads, documentos pessoais, informações financeiras individuais ou qualquer informação sensível.

3. Modelo operacional

• A dedicação conjunta aproximada é de quatro horas semanais.
• A operação deve ser paralela, gradual e compatível com a fase inicial da parceria.
• A corretora parceira permanece na Cury durante o período inicial.
• A prioridade principal do responsável por produto, marketing, processos e tecnologia permanece sendo a LP Factory.
• O laboratório deve alimentar a LP Factory apenas quando houver aprendizado reutilizável, evidência prática e clareza de que o problema observado ultrapassa um caso isolado.

4. Pautas semanais

4.1 Inteligência de campo
• Dúvidas dos compradores.
• Objeções recorrentes.
• Motivos de desistência.
• Problemas observados no atendimento, na jornada ou na decisão de compra.
• Práticas de corretores.
• Aprendizados obtidos na operação.

4.2 Conteúdo e autoridade
• Conteúdos educativos.
• Instagram.
• TikTok.
• Perguntas frequentes.
• Explicações para compradores iniciantes.

4.3 Processo comercial
• Origem do lead.
• Primeiro contato.
• Qualificação.
• Envio de opções.
• Visita.
• Follow-up.
• Proposta.
• Fechamento.

4.4 Pesquisa de mercado e concorrentes
• Instagram.
• TikTok.
• YouTube.
• Sites.
• Landing pages.
• Anúncios.
• Imobiliárias.
• Incorporadoras.
• Portais imobiliários.

4.5 Laboratório de IA e marketing
• Geração de pautas.
• Organização de informações.
• Criação de mensagens.
• Respostas para dúvidas.
• Testes de landing pages.
• Hipóteses de automação.

4.6 Planejamento
• Decisões.
• Tarefas.
• Responsáveis.
• Pendências.
• Próximos testes.

5. Registro de aprendizados

Formato simples recomendado para cada aprendizado:

• Data:
• Origem:
• Problema observado:
• Contexto:
• Frequência percebida:
• Solução manual testada:
• Resultado:
• Possibilidade de reaproveitamento:

Este formato é apenas documental e operacional. Não criar tabelas de banco, migrations, schemas, adapters ou estrutura técnica nesta etapa.

6. Transformação em oportunidade para a LP Factory

Fluxo de transformação:

```text
problema observado
→ hipótese
→ solução manual
→ teste real
→ repetição
→ validação
→ avaliação estratégica
→ possível entrada no roadmap
```

Exemplo:

```text
Problema:
leads perguntam sobre imóveis, mas não informam renda, entrada, FGTS ou prazo.

Solução manual:
roteiro de qualificação e formulário simples.

Possível template:
Corretor de imóveis → primeiro imóvel → qualificação inicial.

Elementos reutilizáveis:
landing page, formulário, WhatsApp, follow-up e critérios de qualificação.
```

Nenhuma oportunidade, hipótese, template, automação ou funcionalidade identificada pelo laboratório entra automaticamente no core da LP Factory. Qualquer evolução exige validação, avaliação estratégica, caso específico e atualização aprovada do roadmap.

7. Limites

• Sem nova tabela central.
• Sem migration.
• Sem novo sistema de autenticação.
• Sem rota de runtime nesta etapa.
• Sem inclusão no menu.
• Sem criação de CRM completo.
• Sem automação antes de validação manual.
• Sem dados pessoais reais no repositório.
• Sem uso indevido de leads, materiais ou informações da Cury.
• Sem promessa de venda ou geração de leads.
• Sem mudança automática no roadmap.

O laboratório não constitui nova vertical oficial, funcionalidade comercial, CRM imobiliário, imobiliária ou compromisso de inclusão no core.

8. Dashboard futuro

O dashboard é apenas uma possibilidade futura. O dashboard não faz parte desta execução.

Path técnico aprovado:

```text
app/a/[account]/labs/imobiliario/
```

URL correspondente:

```text
/a/[account]/labs/imobiliario
```

Diretrizes futuras:

• Usar conta dedicada.
• Conceder membership apenas aos participantes autorizados.
• Reutilizar autenticação, conta, roles, gate SSR e isolamento multi-tenant.
• Manter oculto do menu oficial.
• Começar com componentes route-local:

```text
app/a/[account]/labs/imobiliario/_components/
```

• Criar domínio em `lib/` apenas quando existir responsabilidade server-side real.
• Não criar `/labs/imobiliario` fora do Account Dashboard.

9. Critérios para evolução

O laboratório somente poderá avançar para dashboard quando houver:

• Uso manual recorrente.
• Informações concretas que precisem ser compartilhadas.
• Fluxo semanal estável.
• Campos realmente necessários identificados.
• Justificativa de valor superior ao custo de implementação.

10. Critérios para entrada no core

Para qualquer entrada no core da LP Factory, exigir:

• Problema recorrente.
• Solução manual testada.
• Evidência de reutilização.
• Avaliação estratégica.
• Criação de caso E* específico.
• Atualização aprovada do roadmap.

11. Documentos operacionais do laboratório

• `labs/imobiliario/diretrizes-conteudo.md` — posicionamento, princípios editoriais, regras de transparência e limites para conteúdos imobiliários.
