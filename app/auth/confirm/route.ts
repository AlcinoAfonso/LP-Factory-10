// ...imports e código iguais ao seu, incluindo resolvePostConfirmDestination...

export async function GET(req: Request) {
  // ...mesmo início...

  if (!token_hash || !type) {
    log({ event: "confirm_handler", status: "error", reason: "missing", route: "/auth/confirm", timestamp: now, event_id: crypto.randomUUID() });
    return NextResponse.redirect(`${origin}/auth/error?reason=invalid`, 303); // <— 303
  }

  const supabase = createServerClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash, type });

  if (error) {
    const reason = mapReason(error.message);
    log({ event: "confirm_handler", status: "error", type, reason, route: "/auth/confirm", timestamp: now, event_id: crypto.randomUUID() });

    if (type === "recovery") {
      return NextResponse.redirect(`${origin}/auth/error?reason=${reason}`, 303); // <— 303
    }
    return NextResponse.redirect(`${origin}/auth/error?reason=invalid`, 303);     // <— 303
  }

  log({ event: "confirm_handler", status: "success", type, route: "/auth/confirm", timestamp: now, event_id: crypto.randomUUID() });

  if (type === "recovery") {
    // sucesso de recovery → página de nova senha
    return NextResponse.redirect(`${origin}/auth/reset?state=valid`, 303);        // <— 303
  }

  // email|signup (success): destino multi-tenant
  const dest = await resolvePostConfirmDestination(supabase, new URL(req.url).searchParams.get("next"));
  return NextResponse.redirect(`${origin}${dest}`, 303);                           // <— 303
}
