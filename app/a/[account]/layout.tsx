import { AccessProvider } from "@/providers/AccessProvider";
import { getUserEmail } from "@/lib/auth/authAdapter";
import { Header } from "@/components/layout/Header";
import { getClientAccountSectionContext } from "../_server/section-guard";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ account: string }>;
};

export default async function Layout({ children, params }: LayoutProps) {
  const resolvedParams = await params;
  const slug = (resolvedParams?.account || "").trim().toLowerCase();

  if (slug === "home") {
    return <AccessProvider value={null}>{children}</AccessProvider>;
  }

  const ctx = await getClientAccountSectionContext(slug);
  const userEmail = await getUserEmail();

  return (
    <AccessProvider value={ctx}>
      <Header userEmail={userEmail} />
      {children}
    </AccessProvider>
  );
}
