// Listener de eventos vindos da página /auth/reset
useEffect(() => {
  let bc: BroadcastChannel | null = null;
  try {
    bc = new BroadcastChannel("lp-auth-reset");
    bc.onmessage = (ev: MessageEvent<{ type?: "opened" | "expired" | "used" | "success" }>) => {
      const kind = ev?.data?.type;
      if (!kind) return;
      if (kind === "expired") {
        setInfo("O link expirou. Reenvie um novo e-mail por aqui.");
      } else if (kind === "used") {
        setInfo("Este link já foi usado. Reenvie um novo e-mail.");
      } else if (kind === "opened") {
        setInfo("Abrimos o link em outra aba; continue por lá.");
      } else if (kind === "success") {
        setInfo("Processo concluído. Este diálogo será fechado.");
        setTimeout(() => onBackToLogin?.(), 2000);
      }
    };
  } catch {}
  return () => {
    if (bc) {
      bc.onmessage = null;
      bc.close();
    }
  };
}, [onBackToLogin]);
