// use caminho com alias "@/..." se seu tsconfig estiver configurado.
// Caso não, use: "../../../src/lib/access/getAccessContext"
import { getAccessContext } from "@/src/lib/access/getAccessContext";
import { AccessProvider } from "@/src/providers/AccessProvider";
import { AccessError } from "@/src/lib/access/types";
import { notFound, redirect } from "next/navigation";

export default async function AccountLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { account: string };
}) {
  try {
    const ctx = await getAccessContext({ params });
    return <AccessProvider value={ctx}>{children}</AccessProvider>;
  } catch (e) {
    // Mapeia erros tipados para UX padrão
    if (e instanceof AccessError) {
      if (e.code === "UNRESOLVED_TENANT") return notFound();
      if (e.code === "INACTIVE_MEMBER" || e.code === "FORBIDDEN_ACCOUNT") {
        redirect("/blocked");
      }
    }
    redirect("/select-account");
  }
}
