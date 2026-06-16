import { readFile } from "node:fs/promises";
import path from "node:path";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAccessContext } from "@/lib/access/getAccessContext";
import { realEstateLabContentAdapter, realEstateLabItemAdapter } from "@/lib/real-estate-lab/server";
import { LabOverview } from "./_components/LabOverview";
import { DocumentViewer } from "./_components/DocumentViewer";
import { Filters } from "./_components/Filters";
import { ContentForm } from "./_components/ContentForm";
import { ContentList } from "./_components/ContentList";
import { ItemForm } from "./_components/ItemForm";
import { ItemList } from "./_components/ItemList";
import { deleteContentAction, deleteItemAction, saveContentAction, saveItemAction, setContentStatusAction, setItemStatusAction } from "./actions";

type Props = { params: Promise<{ account: string }> | { account: string }; searchParams?: Promise<Record<string,string|undefined>> | Record<string,string|undefined> };
const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i;
function configuredAccount() { const v = process.env.REAL_ESTATE_LAB_ACCOUNT_ID?.trim(); return v && uuidRe.test(v) ? v : null; }
async function doc(rel: string) { try { return await readFile(path.join(process.cwd(), rel), "utf8"); } catch { return null; } }
export default async function Page({ params, searchParams }: Props) { const p = await params; const sp = await searchParams; const account = p.account.trim().toLowerCase(); const enabled = configuredAccount(); if (!enabled) notFound(); const ctx = await getAccessContext({ params:{ account }, route:`/a/${account}/labs/imobiliario` }); if (!ctx || ctx.blocked || ctx.account?.id !== enabled) notFound(); const role = ctx.member?.role; const canWrite = ["owner","admin","editor"].includes(role ?? ""); const canDelete = ["owner","admin"].includes(role ?? ""); const supabase = await createClient(); const [contents, items, readme, guidelines] = await Promise.all([ realEstateLabContentAdapter.list(supabase, { accountId: enabled, status: sp?.contentStatus, channel: sp?.channel }), realEstateLabItemAdapter.list(supabase, { accountId: enabled, itemType: sp?.itemType, status: sp?.itemStatus }), doc("labs/imobiliario/README.md"), doc("labs/imobiliario/diretrizes-conteudo.md") ]); return <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-10"><LabOverview canWrite={canWrite} canDelete={canDelete}/><Filters contentStatus={sp?.contentStatus} channel={sp?.channel} itemType={sp?.itemType} itemStatus={sp?.itemStatus}/><div className="grid gap-6 lg:grid-cols-2"><DocumentViewer title="README do laboratório" content={readme}/><DocumentViewer title="Diretrizes de conteúdo" content={guidelines}/></div><section className="grid gap-6 lg:grid-cols-[360px_1fr]"><div>{canWrite ? <ContentForm account={account} action={saveContentAction}/> : <p className="rounded-xl border bg-white p-4 text-sm text-gray-600">Seu perfil é somente leitura para conteúdos.</p>}</div><div><h2 className="mb-3 text-xl font-semibold">Conteúdos</h2><ContentList contents={contents} canWrite={canWrite} canDelete={canDelete} setStatusAction={setContentStatusAction.bind(null, account)} deleteAction={deleteContentAction.bind(null, account)}/></div></section><section className="grid gap-6 lg:grid-cols-[360px_1fr]"><div>{canWrite ? <ItemForm account={account} action={saveItemAction}/> : <p className="rounded-xl border bg-white p-4 text-sm text-gray-600">Seu perfil é somente leitura para itens.</p>}</div><div><h2 className="mb-3 text-xl font-semibold">Itens operacionais</h2><ItemList items={items} canWrite={canWrite} canDelete={canDelete} setStatusAction={setItemStatusAction.bind(null, account)} deleteAction={deleteItemAction.bind(null, account)}/></div></section></main> }
