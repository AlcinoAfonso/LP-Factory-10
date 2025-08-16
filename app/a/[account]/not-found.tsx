// app/a/[account]/not-found.tsx
export default function NotFound() {
  return (
    <div className="mx-auto max-w-md p-6 text-center">
      <h1 className="mb-2 text-2xl font-semibold">Conta não encontrada</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Você não possui vínculo ativo com esta conta ou o subdomínio é inválido.
      </p>

      {/* Botão simples para voltar à página anterior (sem depender de rotas legadas) */}
      <a
        href="javascript:history.back()"
        className="inline-flex items-center rounded-xl border px-4 py-2 text-sm"
      >
        Voltar
      </a>

      {/* Opcional: instrução de fallback */}
      <p className="mt-3 text-xs text-muted-foreground">
        Se não funcionar, retorne pelo Dashboard principal.
      </p>
    </div>
  );
}
