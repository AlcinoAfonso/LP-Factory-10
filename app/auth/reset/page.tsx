// ...imports e estados já existentes...

// 1) Trocar o code por sessão válida
useEffect(() => {
  (async () => {
    if (!code) {
      setTokenErr("Link inválido. Solicite uma nova redefinição.");
      return;
    }
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      setTokenErr("O link expirou ou já foi usado. Solicite novamente.");
      return;
    }

    // >>> avisa a aba original que o link foi aberto
    try {
      const bc = new BroadcastChannel("lp-auth-reset");
      bc.postMessage({ type: "opened" });
      // fecha o canal logo após enviar
      setTimeout(() => bc.close(), 0);
    } catch {}

    setSessionReady(true);
  })();
}, [code]);
