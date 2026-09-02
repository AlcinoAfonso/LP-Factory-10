export function GenerationTrigger() {
  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled
        aria-disabled="true"
        className="min-h-11 cursor-not-allowed rounded-lg bg-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 opacity-80"
      >
        Geração temporariamente indisponível
      </button>
      <p role="status" className="max-w-prose text-sm leading-6 text-graytech-600">
        Novas revisões voltarão a ser disponibilizadas após a simplificação do fluxo de geração.
      </p>
    </div>
  );
}
