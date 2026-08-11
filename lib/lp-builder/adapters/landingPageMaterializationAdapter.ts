import "server-only";

import { createServiceClient } from "../../supabase/service";
import type {
  InsertLandingPageMaterializationResult,
  ProbeLandingPageMaterializationReadinessResult,
  ReadLandingPageMaterializationResult,
} from "../landingPageMaterializationContracts";
import {
  insertLandingPageMaterializationWithDependencies,
  probeLandingPageMaterializationReadinessWithDependencies,
  readLandingPageMaterializationWithDependencies,
  type LandingPageMaterializationStorageDependencies,
} from "./landingPageMaterializationAdapterCore";

export function probeLandingPageMaterializationReadiness(): Promise<ProbeLandingPageMaterializationReadinessResult> {
  return probeLandingPageMaterializationReadinessWithDependencies(storageDependencies());
}

export function readLandingPageMaterialization(input: {
  accountId: string;
  landingPageId: string;
}): Promise<ReadLandingPageMaterializationResult> {
  return readLandingPageMaterializationWithDependencies(input, storageDependencies());
}

export function insertLandingPageMaterialization(input: Readonly<{
  landingPageId: string;
  accountId: string;
  content: unknown;
  generationContextSnapshot: unknown;
  createdBy: string;
}>): Promise<InsertLandingPageMaterializationResult> {
  return insertLandingPageMaterializationWithDependencies(input, storageDependencies());
}

function storageDependencies(): LandingPageMaterializationStorageDependencies {
  const client = createServiceClient();
  return {
    probeProjection: async (projection) => {
      const { data, error } = await client
        .from("account_landing_page_materializations")
        .select(projection)
        .limit(1);
      return { data, error };
    },
    readProjection: async ({ projection, accountId, landingPageId }) => {
      const { data, error } = await client
        .from("account_landing_page_materializations")
        .select(projection)
        .eq("landing_page_id", landingPageId)
        .eq("account_id", accountId)
        .limit(1)
        .maybeSingle();
      return { data, error };
    },
    insertRow: async ({ projection, row }) => {
      const { data, error } = await client
        .from("account_landing_page_materializations")
        .insert(row)
        .select(projection)
        .single();
      return { data, error };
    },
  };
}
