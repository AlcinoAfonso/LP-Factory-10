export type DecimalValue = Readonly<{ coefficient: bigint; scale: number }>;

export function decimalZero(): DecimalValue {
  return { coefficient: 0n, scale: 0 };
}

export function decimalFromNonNegativeNumber(value: unknown): DecimalValue | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? decimalFromString(String(value))
    : null;
}

export function decimalFromNonNegativeString(value: unknown): DecimalValue | null {
  return typeof value === "string" && /^\d+(?:\.\d+)?$/.test(value)
    ? decimalFromString(value)
    : null;
}

export function addDecimal(left: DecimalValue, right: DecimalValue): DecimalValue {
  return combineDecimal(left, right, 1n);
}

export function subtractDecimal(
  left: DecimalValue,
  right: DecimalValue,
): DecimalValue {
  return combineDecimal(left, right, -1n);
}

export function formatDecimal(value: DecimalValue): string {
  const negative = value.coefficient < 0n;
  const absolute = negative ? -value.coefficient : value.coefficient;
  if (value.scale === 0) return `${negative ? "-" : ""}${absolute}`;
  const digits = absolute.toString().padStart(value.scale + 1, "0");
  const integer = digits.slice(0, -value.scale);
  const fraction = digits.slice(-value.scale).replace(/0+$/, "");
  const formatted = fraction ? `${integer}.${fraction}` : integer;
  return negative && absolute !== 0n ? `-${formatted}` : formatted;
}

function decimalFromString(value: string): DecimalValue | null {
  const match = /^(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/i.exec(value);
  if (!match) return null;
  const fraction = match[2] ?? "";
  const exponent = Number(match[3] ?? "0");
  if (!Number.isSafeInteger(exponent)) return null;
  let coefficient = BigInt(`${match[1]}${fraction}`);
  let scale = fraction.length - exponent;
  if (scale < 0) {
    coefficient *= 10n ** BigInt(-scale);
    scale = 0;
  }
  while (scale > 0 && coefficient % 10n === 0n) {
    coefficient /= 10n;
    scale -= 1;
  }
  return { coefficient, scale };
}

function combineDecimal(
  left: DecimalValue,
  right: DecimalValue,
  rightSign: 1n | -1n,
) {
  const scale = Math.max(left.scale, right.scale);
  return {
    coefficient:
      left.coefficient * 10n ** BigInt(scale - left.scale) +
      rightSign * right.coefficient * 10n ** BigInt(scale - right.scale),
    scale,
  };
}
