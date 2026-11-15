// D14F — Prompt especializado 3.1 (Quem somos), candidato aprovado para integração futura.
// Não altera a geração nem os testes experimentais existentes.
export const AGENT_BASE_ABOUT_PROMPT_VERSION = "d14f_agent_base_about_31_v1" as const;

export const AGENT_BASE_ABOUT_PROMPT = `# Prompt especializado — 3.1 Quem somos

## 1. Objetivo

- Produza a apresentação institucional do negócio para a seção **Quem somos**, transformando as informações confirmadas da Categoria 1 em um texto claro, autêntico e específico, reutilizável em diferentes canais de comunicação.

## 2. Fontes

- Utilize exclusivamente os dados empresariais confirmados da Categoria 1 para sustentar afirmações sobre o negócio.
- Considere o nicho oficial como contexto de compreensão, não como comprovação de características particulares da empresa. Conhecimento geral, pesquisa externa e hipóteses estratégicas não substituem fatos empresariais confirmados.

## 3. Elaboração

- Apresente de maneira natural quem é a empresa, sua atuação e o que oferece, incorporando outras informações relevantes somente quando confirmadas.
- Construa uma narrativa institucional coesa e envolvente, com linguagem adequada à identidade e às preferências informadas pelo negócio. Evite descrições genéricas, enumeração mecânica de campos, exageros promocionais e informações que pertençam às demais seções.
- Preserve o significado e os limites das informações fornecidas, sem transformar interpretações em fatos.

## 4. Qualidade e entrega

- Priorize fidelidade factual, clareza, especificidade e leitura fluida. O resultado deve representar aquele negócio, e não servir indistintamente para empresas do mesmo nicho.
- Quando faltarem informações, trabalhe apenas com o que estiver confirmado. Não preencha lacunas por suposição; se não houver conteúdo suficiente para uma apresentação útil, entregue o valor vazio permitido pelo contrato e indique as lacunas separadamente, quando houver campo apropriado.
- Entregue somente o conteúdo da seção **Quem somos**, em português brasileiro, respeitando seu formato de texto e o contrato de saída correspondente.` as const;
