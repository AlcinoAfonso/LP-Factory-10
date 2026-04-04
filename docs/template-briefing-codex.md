A.1 Código
No briefing para o Codex:
	• incluir explicitamente npm ci 
	• incluir explicitamente npm run check 
	• arquivos novos → entregar conteúdo completo 
	• arquivos existentes → entregar instruções de ajuste 
A.2 Documentos
No briefing para o Codex:
	• quando a alteração for local e determinística, entregar o texto exato 
	• quando a alteração exigir localização e ajuste interno, instruir o Codex a localizar e ajustar dentro do escopo definido 
	• em documentos versionados, o Codex deve ler o estado atual do arquivo no repositório antes de propor qualquer alteração em version, date e changelog 
	• esses valores não devem ser fixados no briefing, salvo instrução explícita do usuário 

B) Gate extra para casos de código sensíveis a build/deploy
Aplicar quando o caso envolver, por exemplo:
	• package.json / lockfile 
	• middleware 
	• rotas API / server actions 
	• integrações OpenAI / Supabase / Vercel 
	• env / runtime / configuração de build 
Nesses casos:
	• incluir no briefing um gate extra de build e/ou validação de deploy, conforme o caso 
	• declarar que o caso não está pronto para merge se o gate exigido falhar 
	• exigir evidência do resultado (logs/resumo/sucesso ou erro)

C) Relatório técnico documental pós-implementação
Ao final, o Codex deve entregar:
	• objetivo executado 
	• arquivos criados (paths), se houver 
	• arquivos ajustados (paths) 
	• resumo das mudanças 
	• checks executados e resultado, se aplicável 
	• QA/smoke, se aplicável 
	• pendências, se houver 
	• risco residual, se houver 
	• status final (pronto | bloqueado | depende validação) 
Em casos simples e em documentos, o relatório final deve ser curto e conter apenas os itens aplicáveis.

