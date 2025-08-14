// app/a/[account]/loading.tsx
export default function Loading() {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <span className="animate-pulse text-sm text-muted-foreground">
        Carregando conta…
      </span>
    </div>
  );
}
