import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase text-muted-foreground">
                LP Factory Administrativo
              </p>
              <CardTitle className="text-2xl">Admin Dashboard</CardTitle>
              <CardDescription className="max-w-2xl">
                Área restrita para operação administrativa do LP Factory. Esta
                base está pronta para receber módulos internos conforme forem
                definidos.
              </CardDescription>
            </div>

            <span className="inline-flex w-fit shrink-0 whitespace-nowrap items-center rounded-md border border-brand-600/20 bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
              Acesso restrito
            </span>
          </div>
        </CardHeader>

        <CardContent className="grid gap-4 border-t border-border pt-6 sm:grid-cols-3">
          <div className="space-y-1">
            <h2 className="text-sm font-medium text-card-foreground">
              Escopo atual
            </h2>
            <p className="text-sm text-muted-foreground">
              Entrada administrativa protegida, separada do dashboard de contas.
            </p>
          </div>

          <div className="space-y-1">
            <h2 className="text-sm font-medium text-card-foreground">
              Contexto
            </h2>
            <p className="text-sm text-muted-foreground">
              Header e menu próprios, sem dependência de conta ativa.
            </p>
          </div>

          <div className="space-y-1">
            <h2 className="text-sm font-medium text-card-foreground">
              Evolução
            </h2>
            <p className="text-sm text-muted-foreground">
              Novos módulos devem entrar somente com requisito operacional
              definido.
            </p>
          </div>
        </CardContent>
      </Card>

      <EmptyState
        title="Nenhum módulo administrativo ativo nesta etapa"
        description="A tela inicial permanece intencionalmente enxuta para evitar dados ou atalhos sem função definida."
        className="text-left sm:text-center"
      />
    </div>
  );
}
