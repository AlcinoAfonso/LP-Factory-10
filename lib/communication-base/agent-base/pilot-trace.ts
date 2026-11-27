// Diagnostics only. Never emit raw errors, business data, prompts, or response bodies.
export type PilotClientFailureKind = "aborted" | "connection_closed" | "network" | "decode" | "unexpected";
export type PilotTransportPhase = "dispatch" | "resolved" | "rejected";

export function pilotTraceId(value: unknown): string | null {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) ? value : null;
}

export function pilotClientFailureKind(error: unknown): PilotClientFailureKind {
  if (!error || typeof error !== "object") return "unexpected";
  const record = error as { name?: unknown; message?: unknown };
  const name = typeof record.name === "string" ? record.name : "";
  const message = typeof record.message === "string" ? record.message : "";
  if (name === "AbortError") return "aborted";
  if (/connection closed|premature close|socket hang up|terminated/i.test(message)) return "connection_closed";
  if (/failed to fetch|fetch failed|network|load failed|econnreset/i.test(message)) return "network";
  if (name === "SyntaxError" || /decode|deserializ|unexpected end of json/i.test(message)) return "decode";
  return "unexpected";
}

export async function observePilotTransport<T>(
  submit: () => Promise<T>,
  report: (phase: PilotTransportPhase, failure?: PilotClientFailureKind) => void,
): Promise<T> {
  // Observability must not interrupt or retry an already chargeable request.
  const emit = (phase: PilotTransportPhase, failure?: PilotClientFailureKind) => {
    try { report(phase, failure); } catch { /* Reporting is best-effort. */ }
  };
  emit("dispatch");
  try {
    const result = await submit();
    emit("resolved");
    return result;
  } catch (error) {
    emit("rejected", pilotClientFailureKind(error));
    throw error;
  }
}
