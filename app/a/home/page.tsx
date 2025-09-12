// app/a/home/page.tsx
export const dynamic = 'force-dynamic';

import { redirect } from "next/navigation";

export default function AHomeAlias() {
  // Compat: força redirecionamento SSR do legado /a/home para a landing pública /a
  redirect("/a"); // 307
}
