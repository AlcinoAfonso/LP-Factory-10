import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Acesso não disponível</CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-sm text-muted-foreground">
                Não encontramos um vínculo válido para esta conta. Você pode fazer login novamente,
...
              </Link>
              <a
                href="mailto:suporte@lpfactory.com.br?subject=LP%20Factory%20-%20Solicita%C3%A7%C3%A3o%20de%20Acesso"
                className="inline-flex items-center justify-cent...-sm font-medium text-primary-foreground shadow hover:opacity-90"
              >
                Solicitar acesso
              </a>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
