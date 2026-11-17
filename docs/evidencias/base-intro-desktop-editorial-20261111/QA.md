# QA e entrega técnica

Runtime: da7e7aac2be070487030076c74a28fd217b06290. Base main70760d40; branch codex-app/base-intro-desktop-editorial-20261111. Três arquivos de runtime: CommunicationBaseTabs.tsx, CommunicationBase.module.css e ilustração PNG.

npm ci executado; npm run check executado e repetido no delta final, aprovados com0erros/23warnings preexistentes. npmci reportou23vulnerabilidades das dependências atuais; sem alteração de dependências ou correção fora do escopo. Sem npmrunbuild. npmrun dev iniciou3000; erro verificado no middleware: falta URL/key do Supabase. O bloco de AGENTS gerado pelo Next foi inspecionado e restaurado antes da publicação. A aba existente de Preview retornou Acesso não disponível/sem vínculo. Sem buscar/criar/copiar credenciais, pedirlogin ou alterarauth.

QA visual e interativo: componente real importado em fixture local ignorada (.vercel/editorial-entry.tsx/editorial-server.mjs), CSSModule pelo postcss/Tailwind/esbuild instalados, next/image real servido pela fixture, Inter dos arquivos next/font já locais. Identidade fictícia local; sem APIs/backend. Preview visual localhost3001. Config do produto e página operacional não mudaram.

Capturas desktop-final.jpg/comparacao-desktop-final.png estáveis1440x1024CSS/DPR1; mock1487x1058 recortado ao modal e normalizado para largura864. Capturas auxiliares antigas na mesma pasta preservam iteração; o primeiro comparativo motivou aumento do título32→40px e slot da arte. Algumas capturas de regressão do navegador original comzoom90% têm padding raster/qualidade reduzida; viewportCSS real consta emqa-runtime.json e não deve ser inferida das bordasbrancas. Desktop final refeito emnovaaba sem esse problema.

Desktop1024x400: dialog864x384 emy8, footer306.4–391.2 visível, corpo110/235 rolável, semoverflowX. 320x480: modal464px/corpo256/344; header/footer preservados. Preferência marcada e reloadsuprimido, reabertura manual/desmarcação, Entendi, Escape/retorno de foco e scroll0 aferidos. Root32px/320x480: fallbackouter, corpo natural e açãoEntendi alcançável em351–439px dentro do dialog16–464px. Root32desktop e temaescuro inspecionados. Consoleaba final semerrors/warnings.

DesignQA focal no arquivo raizdesign-qa.md. Não há declaração de conformidadeWCAG integral, QAAndroid/Samsung real nem validação de backend/página autenticada completa. O novo visualdesktop usa min1024; estilosmobile/tablet e fluxos de nicho/IA/salvamento mantidos. Sem mudança emdocs/design-system.md, Header, DB, env, workflows, dependências ou tokensglobais. Evidências deste caso não mudam contratos canônicos.
