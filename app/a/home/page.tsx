// app/a/home/page.tsx
import { redirect } from "next/navigation";

export default function AHomeAlias() {
  // Compat: redireciona chamadas antigas de /a/home para o índice /a
  redirect("/a");
}
