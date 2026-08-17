import { notFound } from "next/navigation";

import { getAccessContext } from "@/lib/access/getAccessContext";

import { GenerationTrigger } from "./GenerationTrigger";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 300;

type PageProps = Readonly<{
  params: Promise<{ account: string; landingPageId: string }>;
}>;

export default async function LandingPagePreviewShell({ params }: PageProps) {
  const { account, landingPageId } = await params;
  const accountSlug = account.trim().toLowerCase();
  const access = await getAccessContext({
    params: { account: accountSlug },
    route: `/a/${accountSlug}/landing-pages/${landingPageId}/preview`,
  });
  if (!access || access.blocked || access.account?.status !== "active") notFound();

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-medium text-slate-500">Landing page em draft</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
          Preview privado
        </h1>
        <p className="mt-3 max-w-prose text-sm leading-6 text-slate-600">
          A geração é iniciada somente por uma ação explícita. Enquanto banco,
          Storage e providers não estiverem prontos, o fluxo encerra sem criar revisão.
        </p>
        <GenerationTrigger
          accountSlug={accountSlug}
          landingPageId={landingPageId}
        />
      </section>
    </main>
  );
}
