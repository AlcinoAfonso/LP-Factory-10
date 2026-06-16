import type { RealEstateLabContentStatus, RealEstateLabItemStatus } from "@/lib/types/status";

export const contentStatuses = ["idea", "draft", "review", "approved", "published", "archived"] as const;
export const contentChannels = ["instagram", "tiktok", "whatsapp", "multi_channel", "other"] as const;
export const itemTypes = ["agenda", "task", "decision", "question", "objection", "learning", "opportunity", "field_note"] as const;
export const itemStatuses = ["open", "in_progress", "done", "discarded"] as const;
export const itemPriorities = ["low", "medium", "high"] as const;

export type RealEstateLabChannel = (typeof contentChannels)[number];
export type RealEstateLabItemType = (typeof itemTypes)[number];
export type RealEstateLabPriority = (typeof itemPriorities)[number];

export type RealEstateLabContent = {
  id: string; accountId: string; title: string; topic: string; channel: RealEstateLabChannel; format: string | null; hook: string | null; body: string | null; cta: string | null; status: RealEstateLabContentStatus; scheduledFor: string | null; publishedAt: string | null; resultNotes: string | null; learningNotes: string | null; createdBy: string; updatedBy: string; createdAt: string; updatedAt: string;
};
export type RealEstateLabContentInput = Omit<RealEstateLabContent, "id" | "accountId" | "createdBy" | "updatedBy" | "createdAt" | "updatedAt">;
export type RealEstateLabContentUpdateInput = Partial<RealEstateLabContentInput>;
export type RealEstateLabContentResult = { ok: true; data: RealEstateLabContent } | { ok: false; error: string };

export type RealEstateLabItem = {
  id: string; accountId: string; itemType: RealEstateLabItemType; title: string; description: string | null; status: RealEstateLabItemStatus; priority: RealEstateLabPriority | null; responsibleUserId: string | null; dueAt: string | null; occurredAt: string | null; resultNotes: string | null; createdBy: string; updatedBy: string; createdAt: string; updatedAt: string;
};
export type RealEstateLabItemInput = Omit<RealEstateLabItem, "id" | "accountId" | "createdBy" | "updatedBy" | "createdAt" | "updatedAt">;
export type RealEstateLabItemUpdateInput = Partial<RealEstateLabItemInput>;
export type RealEstateLabItemResult = { ok: true; data: RealEstateLabItem } | { ok: false; error: string };
