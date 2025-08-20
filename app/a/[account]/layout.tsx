import AccessProvider from "@/providers/AccessProvider";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AccessProvider>{children}</AccessProvider>;
}
