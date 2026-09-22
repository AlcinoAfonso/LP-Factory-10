# E24.1 — Governança e cobertura do workflow de updates

Status: V1 funcional aprovada no Debate 18; execução Light; supervisão Autônoma.

Fonte aprovada: [Debate 18 — Compatibilidade operacional, pendências transversais e governança do workflow de updates — LP Factory 10](https://docs.google.com/document/d/1-LS7MvQBZ7fyKOd3SQFSecBsynAAsEElrh1fcSrHZuY/edit), seção 4.1, revisão `7`, de 22/09/2026 17:22:29Z.

## 1. Problema e resultado funcional

- Problema: o workflow não aplica de forma uniforme o gate de custo zero, os campos de ciclo de vida, a identificação das rodadas nem a cobertura técnica OpenAI.
- Resultado: o workflow semanal passa a cobrir Supabase, Vercel, GitHub, Produto e OpenAI com rastreabilidade comum, sem duplicar responsabilidades nem autorizar adoção.
- Posição planejada no roadmap: E24.1 — Governança e cobertura do workflow de updates.
- Classificação: Light, porque o resultado cabe nos documentos, contratos e automação existentes, sem nova arquitetura, agente ou infraestrutura.
- Automação: ajustar a automação existente; não criar nova automação, agente, job ou infraestrutura.
- Supervisão: Autônomo.

## 2. Fases planejadas

- E24.1.3 — consolidar ciclo de vida, gate econômico, campos obrigatórios e identificador de rodada.
- E24.1.4 — incorporar OpenAI à periodicidade semanal e delimitar workflow, snapshot e Gestor de Automações.
- E24.1.5 — reorganizar o snapshot por capacidades e retirar o conteúdo financeiro aprovado.
- E24.1.6 — validar o workflow atualizado sem criar mudanças artificiais ou duplicar PRs.

## 3. Critérios de aceite

- Toda rodada identifica inequivocamente seus PRs e detecta drafts da rodada anterior.
- Todo transversal ativo possui gatilho e critério de encerramento; implementados integrais permanecem apenas como histórico.
- Nenhuma recomendação de implementação ultrapassa zero custo incremental; recursos pagos continuam atualizados no radar.
- OpenAI é pesquisada semanalmente em fontes oficiais e suas capacidades técnicas têm destino rastreável no snapshot.
- O snapshot não contém preços, fórmulas, gráfico ou laboratório financeiro e continua preservando capacidades técnicas.
- O Gestor de Automações não repete a varredura ampla do workflow.

## 4. Escopo negativo

- Não criar novo agente, catálogo, workload, job, automação, serviço, infraestrutura ou controle paralelo.
- Não alterar código da aplicação, runtime, banco, schema, migration, rota, dependência ou comportamento funcional da LP Factory.
- Não contratar, ativar ou recomendar implementação com custo incremental; recursos pagos permanecem apenas registrados para avaliação futura.
- A cobertura OpenAI limita-se ao workflow, ao Gestor de Updates, ao Gestor de Automações e ao snapshot existentes.
- Não alterar modelos, prompts, reasoning effort, tools ou configuração dos workloads OpenAI.
- A retirada de custos do snapshot não autoriza criar outro documento, workload, mecanismo ou infraestrutura para armazená-los.
- Não remover, reduzir ou redistribuir capacidades, responsabilidades ou controles vigentes além das mudanças expressamente aprovadas na V1.
- Cada PR deve conter somente alterações do PB-A; qualquer arquivo, contrato ou comportamento adicional exige parada e decisão humana.

## 5. Estado da V1

- V1 funcional aprovada.
- Execução: Light.
- Supervisão: Autônomo.
- Dependências declaradas: nenhuma.
