import type { CommunicationSectionKey, CommunicationSectionFormat } from "./registry";

export type CommunicationFact = Readonly<{ label: string; value: string }>;
export type CommunicationFaq = Readonly<{ question: string; answer: string }>;
export type CommunicationMaterial = Readonly<{
  id: string; kind: "image" | "video" | "audio" | "testimonial";
  name: string; context: string; author: string; authorization: string;
  source: Readonly<{ type: "text"; text: string }> | Readonly<{ type: "link"; url: string }>
    | Readonly<{ type: "private"; bucket: string; path: string; mime: string }>;
}>;
export type CommunicationSectionValue = string | readonly string[] | readonly CommunicationFaq[] | readonly CommunicationMaterial[];
export type CommunicationSectionOrigin =
  | "user_confirmed"
  | "pending_setup_confirmed"
  | "user_reviewed";

export type CommunicationSection = Readonly<{
  format: CommunicationSectionFormat;
  value: CommunicationSectionValue;
  origin: CommunicationSectionOrigin;
  facts?: readonly CommunicationFact[];
}>;

export type CommunicationBase = Readonly<{
  accountId: string;
  version: number;
  sections: Readonly<Partial<Record<CommunicationSectionKey, CommunicationSection>> & Record<string, CommunicationSection | undefined>>;
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
