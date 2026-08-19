import "server-only";

import { createServiceClient } from "../../supabase/service";
import {
  LANDING_PAGE_REVISION_ASSET_BUCKET,
  type LandingPageRevisionAssetReference,
} from "../landingPageRevision";
import { LANDING_PAGE_PREVIEW_SIGNED_URL_TTL_SECONDS } from "../landingPagePreview";

export async function uploadLandingPageRevisionAsset(input: Readonly<{
  asset: LandingPageRevisionAssetReference;
  bytes: Uint8Array;
}>): Promise<Readonly<{ ok: true }> | Readonly<{ ok: false; error: string }>> {
  try {
    if (
      input.asset.bucket !== LANDING_PAGE_REVISION_ASSET_BUCKET ||
      input.bytes.byteLength !== input.asset.bytes
    ) {
      return { ok: false, error: "ASSET_METADATA_MISMATCH" };
    }
    const { data, error } = await createServiceClient()
      .storage
      .from(input.asset.bucket)
      .upload(input.asset.path, input.bytes, {
        contentType: input.asset.mimeType,
        upsert: false,
        cacheControl: "31536000",
      });
    if (error || data?.path !== input.asset.path) {
      return { ok: false, error: "ASSET_UPLOAD_FAILED" };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "ASSET_UPLOAD_FAILED" };
  }
}

export async function cleanupLandingPageRevisionAsset(
  asset: LandingPageRevisionAssetReference,
): Promise<void> {
  try {
    const { error } = await createServiceClient()
      .storage
      .from(asset.bucket)
      .remove([asset.path]);
    if (error) logCleanupFailure(asset);
  } catch {
    logCleanupFailure(asset);
  }
}

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

function logCleanupFailure(asset: LandingPageRevisionAssetReference) {
  console.error(JSON.stringify({
    event: "landing_page_revision_asset_cleanup_failed",
    bucket: asset.bucket,
    path: asset.path,
  }));
}
