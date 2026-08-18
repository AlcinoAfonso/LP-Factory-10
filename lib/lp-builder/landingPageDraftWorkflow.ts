import type { LandingPageGenerationContextPackage } from "./generationContextContracts";

export type LandingPageConversionChannel =
  | "whatsapp"
  | "phone"
  | "email"
  | "external_url";

export type LandingPageConversionBindingResult =
  | Readonly<{
      ok: true;
      value: Readonly<{
        channel: LandingPageConversionChannel;
        destinationFieldKey:
          | "whatsapp_destination"
          | "phone_destination"
          | "email_destination"
          | "external_url_destination";
        destination: string;
      }>;
    }>
  | Readonly<{
      ok: false;
      error:
        | "UNSUPPORTED_PRIMARY_CONVERSION_CHANNEL"
        | "INVALID_PRIMARY_CONVERSION_CHANNEL"
        | "MISSING_PRIMARY_CONVERSION_DESTINATION";
    }>;

const destinationByChannel = {
  whatsapp: "whatsapp_destination",
  phone: "phone_destination",
  email: "email_destination",
  external_url: "external_url_destination",
} as const;

type LandingPageConversionBindingContext = Pick<
  LandingPageGenerationContextPackage,
  "modelContext" | "serverContext"
>;

export function resolveLandingPageConversionBinding(
  context: LandingPageConversionBindingContext,
): LandingPageConversionBindingResult {
  const modelValues = new Map(
    context.modelContext.facts.map((fact) => [fact.fieldKey, fact.value] as const),
  );
  const serverValues = new Map(
    context.serverContext.facts.map((fact) => [fact.fieldKey, fact.value] as const),
  );
  const channel = modelValues.get("primary_conversion_channel");
  if (channel === "form") {
    return { ok: false, error: "UNSUPPORTED_PRIMARY_CONVERSION_CHANNEL" };
  }
  if (typeof channel !== "string" || !(channel in destinationByChannel)) {
    return { ok: false, error: "INVALID_PRIMARY_CONVERSION_CHANNEL" };
  }
  const typedChannel = channel as LandingPageConversionChannel;
  const destinationFieldKey = destinationByChannel[typedChannel];
  const destination = serverValues.get(destinationFieldKey);
  if (typeof destination !== "string" || !destination.trim()) {
    return { ok: false, error: "MISSING_PRIMARY_CONVERSION_DESTINATION" };
  }
  return {
    ok: true,
    value: {
      channel: typedChannel,
      destinationFieldKey,
      destination: destination.trim(),
    },
  };
}
