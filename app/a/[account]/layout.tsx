import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account Dashboard — Acesso",
  description: "Página de acesso à conta (pré-login).",
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-gray-50 text-gray-900 antialiased">
      {children}
    </div>
  );
}
