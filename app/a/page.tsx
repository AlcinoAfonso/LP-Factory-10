// app/a/page.tsx — redirect canônico para /a/home (SSR-only)
import { redirect } from "next/navigation";

export default function AIndexPage() {
  redirect("/a/home"); // 308 implícito no App Router
}
