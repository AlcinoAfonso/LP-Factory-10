export async function callResponsesApi({ apiKey, model, tools, input, costRecorder, fetchImpl = fetch }) {
  const operationId = await costRecorder.startOperation(model);
  if (!operationId) throw new Error("financial_admission_unconfirmed");
  const finish = (...args) => Promise.resolve().then(() => costRecorder.finishOperation(operationId, ...args)).catch(() => undefined);
  let response;
  try {
    response = await fetchImpl("https://api.openai.com/v1/responses", {
      method: "POST",
      redirect: "error",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, tools, input }),
    });
  } catch (error) {
    await finish("failure", { failureCategory: "transport_error" });
    throw error;
  }
  if (!response.ok) {
    await finish("failure", {
      failureCategory: "http_error",
      httpStatus: response.status,
      providerRequestId: response.headers.get("x-request-id"),
    });
    const body = await response.text().catch(() => "");
    throw new Error(`OpenAI API error (${response.status}): ${body || "sem body"}`);
  }
  let payload;
  try {
    payload = await response.json();
  } catch (error) {
    await finish("failure", {
      failureCategory: "invalid_response",
      providerRequestId: response.headers.get("x-request-id"),
    });
    throw error;
  }
  const failed = Boolean(payload?.error || payload?.status === "incomplete");
  await finish(failed ? "failure" : "success", {
    failureCategory: failed ? "provider_error" : null,
    responseId: payload?.id,
    providerRequestId: response.headers.get("x-request-id"),
    usage: payload?.usage,
    appliedServiceTier: payload?.service_tier,
    appliedModel: payload?.model,
  });
  if (failed) throw new Error("OpenAI response terminated without a complete result.");
  return payload;
}
