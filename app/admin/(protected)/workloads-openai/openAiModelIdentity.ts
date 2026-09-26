type FetchModel = typeof fetch;

export type OpenAiModelIdentityResult =
  | Readonly<{ ok: true }>
  | Readonly<{ ok: false; code: "configuration" | "not_confirmed" }>;

export async function confirmOpenAiModelIdentity(
  model: string,
  apiKey: string | undefined,
  fetchImpl: FetchModel = fetch,
): Promise<OpenAiModelIdentityResult> {
  if (!apiKey?.trim()) return { ok: false, code: "configuration" };
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(model)) {
    return { ok: false, code: "not_confirmed" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetchImpl(
      `https://api.openai.com/v1/models/${encodeURIComponent(model)}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: controller.signal,
        cache: "no-store",
      },
    );
    if (!response.ok) return { ok: false, code: "not_confirmed" };
    const body: unknown = await response.json();
    return body && typeof body === "object" && !Array.isArray(body) &&
      "object" in body && body.object === "model" &&
      "id" in body && body.id === model
      ? { ok: true }
      : { ok: false, code: "not_confirmed" };
  } catch {
    return { ok: false, code: "not_confirmed" };
  } finally {
    clearTimeout(timeout);
  }
}
