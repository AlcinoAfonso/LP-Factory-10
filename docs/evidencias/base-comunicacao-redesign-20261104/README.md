# Base de Comunicação — redesign aprovado em 04/11/2026

Contrato integral: [contrato-aprovado-20261104.txt](contrato-aprovado-20261104.txt). A mensagem humana que substituiu as referências e o comando “prossiga” autorizam esta revisão; os termos de minuta/encaminhamento remanescentes no texto anexado não representam seu estado de aprovação. Merge expressamente proibido.

Base funcional: origin/main em bca1e4f45e11d6e90aea680a331f32dc31494a62, incluindo PRs #1115 e #1116. Preservados armazenamento de 30.000 caracteres, normalização CRLF e capacidade independente da assistência.

## Referências vigentes

1. [Página inicial](01-pagina-inicial.png).
2. [Apresentação revisada](02-apresentacao.png).
3. [Identificação revisada](03-identificacao.png).
4. [Editor: orientação no campo](04-editor.png).

São os anexos humanos integrais, sem escolher alternativas anteriores. As legendas e a interface do navegador que os envolve não pertencem ao produto. A exceção de acesso exclusivamente pelo título e a lista mobile são restritas à Base, conforme o contrato; docs/design-system.md permanece inalterado.

## Derivação técnica mínima (V2)

- Ajustar hierarquia do cabeçalho e rótulos responsivos das categorias, conservando nomes acessíveis e identidade do catálogo.
- Reusar os dialogs, proteção de rascunho, histórico e retorno de foco; o título substitui a ação Abrir. Ajuda sai do cabeçalho fixo.
- Reorganizar a apresentação com seus três textos originais, wordmark, ilustração SVG decorativa local e Entendi; conservar dispensa e reabertura.
- Reusar os campos da identificação, com rótulos visíveis e empilhamento quando necessário. Nas seções 1.2–1.7, apenas apresentar guidance.description como placeholder, contador abaixo à direita e guidance.help por revelação progressiva. Assistência e sugestão permanecem separadas do salvamento.
- Preservar integralmente as operações de Materiais e de Inteligência, incluindo listas/FAQ, bloqueios, mensagens, revisão e fontes.

Todas as adições são derivações técnicas do contrato funcional. Sem modernização, biblioteca, infraestrutura, banco, prompts ou ampliação de escopo. Updates dispensado pela exceção do §3.2: ajuste localizado nos componentes existentes, sem decisão tecnológica/candidato aplicável. Design já definido pelas referências; sem exploração estética. Estrutural, Automações, Analista e Documentação: sem questão material nova que exija chamada.

Validação: npm ci e npm run check executados (23 warnings de lint preexistentes, zero erros). npm run dev iniciado na porta 3000; navegação local detectou ausência de NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, o fluxo autenticado foi validado no Preview autorizado. Sem build local. Observabilidade adicional N/A: apresentação, sem nova operação ou transporte; feedbacks e handlers existentes preservados. QA visual/comportamental, limites de prova e fechamento de contraste estão em [QA.md](QA.md). O Code Review do HEAD final é registrado no PR.
