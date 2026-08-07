import type { CommercialCapabilityRegistry } from "./contracts";

export const commercialCapabilityRegistry = deepFreeze({
  definitions: [],
  plans: [],
} satisfies CommercialCapabilityRegistry);

function deepFreeze<T>(value: T): Readonly<T> {
  if (value && typeof value === "object") {
    for (const nested of Object.values(value)) deepFreeze(nested);
    Object.freeze(value);
  }

  return value;
}
