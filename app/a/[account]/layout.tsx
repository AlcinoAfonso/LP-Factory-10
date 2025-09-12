// app/a/[account]/layout.tsx
import { AccessProvider } from "@/providers/AccessProvider";
import { getAccessContext } from "@/lib/access/getAccessContext";

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { account: string };
}) {
  const ctx = await getAccessContext({ params });
  return <AccessProvider value={ctx}>{children}</AccessProvider>;
}
