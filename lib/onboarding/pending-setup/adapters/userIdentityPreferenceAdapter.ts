import "server-only";

import { createServiceClient } from "@/lib/supabase/service";

export type UserIdentityPreference = {
  userId: string;
  preferredName: string;
  updatedAt: string;
};

export async function readUserIdentityPreference(
  userId: string,
): Promise<UserIdentityPreference | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("user_identity_preferences")
    .select("user_id,preferred_name,updated_at")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("pendingSetup preferred name read failed", {
      code: error.code,
      user_id: userId,
    });
    throw new Error("PREFERRED_NAME_READ_FAILED");
  }
  if (!data) return null;

  return {
    userId: data.user_id as string,
    preferredName: data.preferred_name as string,
    updatedAt: data.updated_at as string,
  };
}

export async function saveUserIdentityPreference(input: {
  userId: string;
  preferredName: string;
}): Promise<UserIdentityPreference> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("user_identity_preferences")
    .upsert(
      {
        user_id: input.userId,
        preferred_name: input.preferredName,
      },
      { onConflict: "user_id" },
    )
    .select("user_id,preferred_name,updated_at")
    .single();

  if (error || !data) {
    console.error("pendingSetup preferred name write failed", {
      code: error?.code ?? null,
      user_id: input.userId,
    });
    throw new Error("PREFERRED_NAME_WRITE_FAILED");
  }

  return {
    userId: data.user_id as string,
    preferredName: data.preferred_name as string,
    updatedAt: data.updated_at as string,
  };
}
