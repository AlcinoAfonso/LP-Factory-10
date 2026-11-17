export type WebSearchSource = Readonly<{ url: string; title: string }>;
export function webSearchMetadata(payload: unknown) {
  const data = payload as { output?: unknown[] };
  const calls = Array.isArray(data?.output) ? data.output.filter(item =>
    !!item && typeof item === "object" && (item as { type?: string }).type === "web_search_call") : [];
  const sources = new Map<string, WebSearchSource>();
  for (const item of calls) {
    const call = item as { status?: string; action?: { type?: string; sources?: unknown[]; url?: string } };
    if (call.status !== "completed" || !["search", "open_page", "find_in_page"].includes(call.action?.type ?? "")) return null;
    const raw = [...(Array.isArray(call.action?.sources) ? call.action.sources : []),
      ...(call.action?.url ? [{ url: call.action.url }] : [])];
    for (const source of raw) {
      const entry = source as { url?: unknown; title?: unknown };
      if (typeof entry?.url !== "string") continue;
      try {
        const url = new URL(entry.url);
        if (!["https:", "http:"].includes(url.protocol) || url.username || url.password ||
          /^(localhost|127\.|10\.|192\.168\.|169\.254\.|\[|0\.)/i.test(url.hostname)) continue;
        sources.set(url.href, { url: url.href, title: typeof entry.title === "string" ? entry.title.slice(0,200) : url.hostname });
      } catch { /* An invalid external URL is never presented as a source. */ }
      if (sources.size > 50) return null;
    }
  }
  if (calls.length > 0 && sources.size === 0) return null;
  return { calls: calls.length, sources: [...sources.values()].slice(0,10) };
}
