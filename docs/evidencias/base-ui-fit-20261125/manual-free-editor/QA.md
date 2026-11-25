# Editor manual livre — QA do delta

final result: passed

Runtime validado: 5baea42eea630a9a36c5f908c5eb201480a17ee0. Continuação autorizada do PR1187, desde ad2c6ad3. O novo escopo está em contrato.md. Não houve autorização de merge.

## Resultado e limites
As sete seções da categoria3 usam exatamente um textarea, sem Adicionar item/pergunta e resposta, maxLength30000, contador e ações preservados. O novo parser de texto limita-se a escritas/leitura user_reviewed stage2. parseSectionValue, agent_generated, catálogo, schemas e prompts de geração continuam estritos. Nenhuma migration, SQL, adapter de banco, pesquisa, workload, dependência, auth ou Design System foi alterado. Não existe editor HTML/rich text; é texto simples com parágrafos/quebras de linha como Quem somos.

## Persistência e dados legados
Testes sintéticos executam parse de texto, withSection, projectCommunicationBase e reabertura do editor para as sete seções. Cobrem listas/FAQ existentes, pipes literais, parágrafos, ordem, origem, manutenção dos outros campos, limpeza explícita, dirty state, teto30000 e rejeição de30001, objeto inválido e texto livre como saída gerada. Dados legados não são convertidos nem gravados ao abrir. Uma projeção legada no teto pode exceder30000 com separadores de apresentação: é preservada integralmente, permanece limpa, e uma nova edição precisa respeitar o teto. Teste antigo de JSON continua verificando o transporte estruturado; somente a expectativa do rascunho UI foi atualizada para texto livre.

Sem round-trip real no banco nesta rodada. No Preview, não clicar em Salvar para gravar o novo formato em conta real enquanto produção/deployments antigos não tiverem o novo leitor. Nenhuma escrita real, upload ou IA foi executada no QA. O rollout deve levar leitor/escritor novos conjuntamente; esse limite não foi usado para expandir infraestrutura ou criar políticas ambientais.

## Evidência renderizada
Sessão autenticada reaproveitada no Browser integrado. Deployment dpl_GBK7FJVx4Cbz2vN1SXRFNgut1SxK READY, mesmo projeto lp-factory-10 e SHA acima; somente aliasPreview fd52c1 reapontado. Produção não alterada. Primeiro carregamento do alias ainda entregou bundle anterior a71; após propagação e reload, verificada ajuda final no DOM antes de repetir cobertura final. qa-runtime.json contém somente cobertura final5ba.

Notebook1366x768: sete campos~398px, Salvar até699.2px. Mobile390x844: seis campos398px e Dores378px pelo título maior; Salvar até737.2px. Mobile320x480: campos146–190px conforme título, Salvar até451.2px. Títulos, ações e campos dentro das viewports. Ajuda acessível em todas: Texto livre. Até30.000 caracteres. Zero controles de adicionar.

FAQ recebeu rascunho local de1049caracteres com24parágrafos sem separadores de pares; Salvar ficou habilitado. Cancelar abriu confirmação e o rascunho foi descartado, sem submissão. Console sem errors/warnings capturados. Fontes/tokens e ícones existentes mantidos. comparacao.png coloca o Quem somos aprovado e Benefícios lado a lado, ambos viewport390x844, capturas normalizadas para390x843 pixels. As cinco superfícies de fidelidade foram inspecionadas: tipografia/pesos, espaçamento/altura, cores/tokens, ícones sem novo asset e texto/controles. Nenhuma pendência visual P0/P1/P2 nos estados demonstrados; compressão das capturas limita antialiasing fino. Não há declaração WCAG integral ou teste de teclado virtual/aparelho real nesta rodada.

## Validação
npm ci executado. npm run check final aprovado,0erros/23warnings preexistentes. A primeira execução detectou o teste legado que comparava JSON com o rascunho visual; corrigida somente sua expectativa de estado, mantendo a prova do transporte antigo. validate:communication-base e check completo passaram em seguida, incluindo pesquisa/pilot/modelos e contratos da IA. npm run dev iniciou3002; ambiente local já tinha falta de configSupabase confirmada, por isso QA hospedada. Servidor encerrado e bloco AGENTS gerado conferido/restaurado. Sem npm run build.

Analista focal encontrou apenas a instrução antiga para leitor de tela; corrigida em5ba, revisão delta aprovou avanço. Relatório em revisao-analista.md. Code Review independente deve corresponder ao HEAD final documental antes de elegibilidade para merge.
