# Plano-base E23.3 — Retenção proporcional das evidências GitHub Actions

## V1 funcional aprovada

### 12.1. Problema e resultado

- Problema: checks, runs, statuses, logs e artefatos do GitHub Actions são temporários, mas não existe regra explícita separando prova durável de evidência operacional efêmera.
- Resultado funcional: a conclusão de cada recorte permanece rastreável por PR, commit e roadmap, enquanto evidências brutas podem expirar sem comprometer a comprovação do resultado.

### 12.2. Atores e comportamento esperado

- Atores afetados: mantenedores, Estrategista, executores e revisores.
- Comportamento esperado: a validação consulta logs e artefatos enquanto disponíveis, mas o encerramento funcional não depende de sua permanência futura.

### 12.3. Limites, riscos e dependências

- Escopo negativo: não criar armazenamento externo, exportação recorrente, job, agente, nova automação ou arquivo paralelo de evidências.
- Risco funcional material: um documento depender exclusivamente de artefato expirável e perder sua prova de conclusão.
- Dependências reais: workflows atuais, PRs, commits, roadmap e contratos de entrega do projeto.
- Se surgir exigência comprovada de preservar evidência bruta além da janela, interromper este plano e reabrir a decisão com o Gestor de Automações e o humano.

### 12.4. Posição e fase planejadas no roadmap

- Caso macro planejado: E23 — Segurança e governança transversal da plataforma.
- Plano-base: E23.3 — Retenção proporcional das evidências GitHub Actions.
- Estrutura planejada: 23.3.1 Objetivo e status; 23.3.2 Registros do recorte quando houver entrega material; 23.3.3 Contrato de evidência durável e expiração.
- Fase 23.3.3: assegurar que o fechamento dos recortes permaneça verificável sem depender de logs ou artefatos expirados.

### 12.5. Classificação e automação

- Execução: Light, porque a regra usa as fontes e os workflows existentes e não cria residência adicional.
- Automação: não criar automação; a possibilidade de exportação recorrente foi excluída desta V1.

### 12.6. Aceite e evidências

- Critério de aceite: workflows e referências documentais relevantes inventariados.
- Critério de aceite: nenhum estado final depende exclusivamente de run, check, status, log ou artefato que possa expirar.
- Critério de aceite: a conclusão durável fica registrada nas fontes competentes, e a expiração das evidências brutas é aceita como comportamento normal.
- Evidências esperadas: inventário sanitizado, regra documentada no contrato competente e amostra de rastreabilidade por PR, commit e roadmap.

### 12.7. Estado da V1

- V1 funcional aprovada. Execução: Light. Supervisão: Autônomo.

## Referência da fonte aprovada

- Documento: “Debate 06 — Implementações transversais prioritárias — LP Factory 10”.
- Seção: 12 — V1 funcional aprovada — E23.3 Retenção proporcional das evidências GitHub Actions.
- URL: https://docs.google.com/document/d/1HvHycy9dHY2GdnrChVjhuqrtqk3TCRT7cd5iS9v1dhs/edit
- Documento consultado em: 06/09/2026.
