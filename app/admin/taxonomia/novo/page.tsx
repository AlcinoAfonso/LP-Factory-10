import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTaxonCreateForm } from "@/components/admin/AdminTaxonCreateForm";
import { listAdminTaxonParentOptions } from "@/lib/admin/adapters/adminReadOnlyAdapter";
import { createTaxonAction } from "../actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminNewTaxonPage() {
  const parentOptions = await listAdminTaxonParentOptions();

  return (
    <div className="space-y-6">
      <Link className="text-sm font-medium text-brand-700 hover:underline" href="/admin/taxonomia">
        Voltar para taxonomia
      </Link>

      <AdminPageHeader
        title="Novo taxon"
        description="Cadastre segmento, nicho ou ultranicho com hierarquia validada antes da gravacao."
        meta="Criacao"
      />

      <AdminTaxonCreateForm action={createTaxonAction} parentOptions={parentOptions} />
    </div>
  );
}
