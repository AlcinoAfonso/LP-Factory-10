import "server-only";

import { createServiceClient } from "../../supabase/service";
import {
  LANDING_PAGE_REVISION_ASSET_BUCKET,
  type LandingPageRevisionAssetReference,
} from "../landingPageRevision";
import { LANDING_PAGE_PREVIEW_SIGNED_URL_TTL_SECONDS } from "../landingPagePreview";

export async function signLandingPageRevisionAsset(
  asset: LandingPageRevisionAssetReference,
): Promise<
  | Readonly<{ ok: true; signedUrl: string }>
  | Readonly<{ ok: false; error: "ASSET_SIGNING_FAILED" }>
> {
  try {
    if (asset.bucket !== LANDING_PAGE_REVISION_ASSET_BUCKET) {
      return { ok: false, error: "ASSET_SIGNING_FAILED" };
    }
    const { data, error } = await createServiceClient()
      .storage
      .from(asset.bucket)
      .createSignedUrl(asset.path, LANDING_PAGE_PREVIEW_SIGNED_URL_TTL_SECONDS);
    if (error || typeof data?.signedUrl !== "string" || !data.signedUrl.trim()) {
      return { ok: false, error: "ASSET_SIGNING_FAILED" };
    }
    return { ok: true, signedUrl: data.signedUrl };
  } catch {
    return { ok: false, error: "ASSET_SIGNING_FAILED" };
  }
}
