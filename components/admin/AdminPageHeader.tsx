type AdminPageHeaderProps = {
  eyebrow?: string;
  title: string;
  description: string;
  meta?: string;
};

export function AdminPageHeader({ eyebrow = "Area administrativa", title, description, meta }: AdminPageHeaderProps) {
  return (
    <section className="space-y-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase text-muted-foreground">{eyebrow}</p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        {meta ? (
          <span className="inline-flex w-fit shrink-0 whitespace-nowrap rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {meta}
          </span>
        ) : null}
      </div>
    </section>
  );
}
