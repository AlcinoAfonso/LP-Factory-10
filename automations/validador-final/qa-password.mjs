import { randomBytes } from "node:crypto";

export function buildQaPassword() {
  return `Aa1!${randomBytes(24).toString("base64url")}`;
}
