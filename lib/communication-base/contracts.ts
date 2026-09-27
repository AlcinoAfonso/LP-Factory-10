import type { CommunicationSectionFormat, CommunicationSectionKey } from "./registry";

export type CommunicationFaq = Readonly<{ question: string; answer: string }>;
export type CommunicationSectionValue = string | readonly string[] | readonly CommunicationFaq[];
export type CommunicationSectionOrigin =
  | "user_confirmed"
  | "pending_setup_confirmed"
  | "user_reviewed";

export type CommunicationSection = Readonly<{
  format: CommunicationSectionFormat;
  value: CommunicationSectionValue;
  origin: CommunicationSectionOrigin;
}>;

export type CommunicationBase = Readonly<{
  accountId: string;
  version: number;
  sections: Readonly<Partial<Record<CommunicationSectionKey, CommunicationSection>>>;
  createdAt: string;
  updatedAt: string;
}>;

export type CommunicationBaseError =
  | "unavailable"
  | "forbidden"
  | "invalid"
  | "conflict"
  | "read_failed"
  | "write_failed";

export type CommunicationBaseResult<T> =
  | Readonly<{ ok: true; value: T }>
  | Readonly<{ ok: false; error: CommunicationBaseError }>;
