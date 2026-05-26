import type { AccountStatus } from "@/lib/types/status";

export type AdminAccountListItem = {
  id: string;
  name: string;
  subdomain: string | null;
  domain: string | null;
  status: AccountStatus;
  createdAt: string | null;
  setupCompletedAt: string | null;
};

export type AdminAccountDetail = AdminAccountListItem & {
  ownerUserId: string | null;
  ownerEmail: string | null;
  profile: {
    niche: string | null;
    preferredChannel: string | null;
    whatsapp: string | null;
    siteUrl: string | null;
  } | null;
  members: Array<{
    id: string;
    userId: string | null;
    email: string | null;
    role: string | null;
    status: string | null;
    createdAt: string | null;
  }>;
  taxonomy: Array<{
    taxonId: string;
    name: string;
    slug: string;
    level: string;
    isPrimary: boolean;
    status: string;
    sourceType: string;
  }>;
  nicheResolution: AdminNicheResolutionListItem | null;
};

export type AdminTaxonListItem = {
  id: string;
  parentId: string | null;
  parentName: string | null;
  level: string;
  name: string;
  slug: string;
  isActive: boolean;
  aliasCount: number;
};

export type AdminTaxonLevel = "segment" | "niche" | "ultra_niche";

export type AdminTaxonParentOption = {
  id: string;
  name: string;
  slug: string;
  level: AdminTaxonLevel;
  parentName: string | null;
};

export type AdminTaxonDetail = AdminTaxonListItem & {
  aliases: Array<{
    id: string;
    aliasText: string;
    isActive: boolean;
  }>;
  children: AdminTaxonListItem[];
};

export type AdminNicheResolutionListItem = {
  accountId: string;
  accountName: string | null;
  rawInput: string;
  selectedTaxonId: string | null;
  selectedTaxonName: string | null;
  aiSuggestedTaxonId: string | null;
  aiSuggestedTaxonName: string | null;
  confidence: string;
  needsAdminReview: boolean;
  aiNeedsAdminReview: boolean | null;
  resolutionStatus: string;
  matchSource: string | null;
  score: number | null;
  aiStatus: string | null;
  aiUxMode: string | null;
  updatedAt: string | null;
  createdAt: string | null;
};

export type AdminNicheResolutionDetail = AdminNicheResolutionListItem & {
  reason: string;
  aiReason: string | null;
  aiErrorCode: string | null;
  aiModel: string | null;
  aiSuggestedNewTaxonLabel: string | null;
};

export type AdminListResult<T> = {
  items: T[];
  total: number;
  error: string | null;
};

export type AdminFilters = {
  search?: string;
  status?: string;
  level?: string;
  confidence?: string;
  review?: string;
};
