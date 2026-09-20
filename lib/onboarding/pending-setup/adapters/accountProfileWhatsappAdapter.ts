import "server-only";

import { createServiceClient } from "@/lib/supabase/service";

export async function savePendingSetupWhatsappForAccount(input: {
  accountId: string;
  whatsapp: string;
}): Promise<boolean> {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("account_profiles")
    .upsert(
      {
        account_id: input.accountId,
        whatsapp: input.whatsapp,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "account_id" },
    );

  return !error;
}
