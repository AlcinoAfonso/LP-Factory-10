import { z } from "zod";

import {
  landingPageGenerationProfilePriorities,
  landingPageGenerationProfileStatuses,
  landingPageGenerationProfileTaxonLevels,
} from "./contracts";

const nonEmptyText = z.string().trim().min(1);

export const landingPageGenerationProfileItemSchema = z
  .object({
    id: z.uuid(),
    moduleKey: nonEmptyText,
    moduleVersion: z.number().int().positive(),
    variantKey: nonEmptyText.optional(),
    variantVersion: z.number().int().positive().optional(),
    priority: z.enum(landingPageGenerationProfilePriorities),
    recommendedOrder: z.number().int().positive(),
    itemGuidance: nonEmptyText.optional(),
  })
  .strict()
  .superRefine((item, context) => {
    if ((item.variantKey === undefined) !== (item.variantVersion === undefined)) {
      context.addIssue({
        code: "custom",
        path: ["variantKey"],
        message: "variant key and version must be provided together",
      });
    }
  });

export const landingPageGenerationProfileSchema = z
  .object({
    id: z.uuid(),
    ownerTaxonId: z.uuid(),
    version: z.number().int().positive(),
    status: z.enum(landingPageGenerationProfileStatuses),
    generationGuidance: nonEmptyText.optional(),
    items: z.array(landingPageGenerationProfileItemSchema),
  })
  .strict()
  .superRefine((profile, context) => {
    const moduleKeys = profile.items.map((item) => item.moduleKey);
    if (new Set(moduleKeys).size !== moduleKeys.length) {
      context.addIssue({ code: "custom", path: ["items"], message: "profile items must use distinct modules" });
    }
    const orders = profile.items.map((item) => item.recommendedOrder);
    if (new Set(orders).size !== orders.length) {
      context.addIssue({ code: "custom", path: ["items"], message: "profile items must use distinct recommended orders" });
    }
  });

export const landingPageGenerationProfileTaxonNodeSchema = z
  .object({
    taxonId: z.uuid(),
    level: z.enum(landingPageGenerationProfileTaxonLevels),
    parentId: z.uuid().nullable(),
    status: z.enum(["active", "inactive"]),
  })
  .strict();

export const landingPageGenerationProfileTaxonChainSchema = z
  .object({
    servedTaxonId: z.uuid(),
    nodes: z.array(landingPageGenerationProfileTaxonNodeSchema).min(1).max(3),
  })
  .strict()
  .superRefine((chain, context) => {
    if (chain.nodes[0]?.taxonId !== chain.servedTaxonId) {
      context.addIssue({ code: "custom", path: ["servedTaxonId"], message: "served taxon must be the first chain node" });
    }
    if (chain.nodes.some((node) => node.status !== "active")) {
      context.addIssue({ code: "custom", path: ["nodes"], message: "taxon chain must contain only active nodes" });
    }
    const expectedLevels = chain.nodes.length === 3
      ? ["ultra_niche", "niche", "segment"]
      : chain.nodes.length === 2
        ? ["niche", "segment"]
        : ["segment"];
    if (chain.nodes.some((node, index) => node.level !== expectedLevels[index])) {
      context.addIssue({ code: "custom", path: ["nodes"], message: "taxon levels must ascend to segment without gaps" });
    }
    const taxonIds = chain.nodes.map((node) => node.taxonId);
    if (new Set(taxonIds).size !== taxonIds.length) {
      context.addIssue({ code: "custom", path: ["nodes"], message: "taxon chain cannot contain duplicate ids or cycles" });
    }
    for (let index = 0; index < chain.nodes.length - 1; index += 1) {
      if (chain.nodes[index].parentId !== chain.nodes[index + 1].taxonId) {
        context.addIssue({ code: "custom", path: ["nodes", index, "parentId"], message: "taxon parent must match the next chain node" });
      }
    }
    if (chain.nodes.at(-1)?.parentId !== null) {
      context.addIssue({ code: "custom", path: ["nodes", chain.nodes.length - 1, "parentId"], message: "segment must terminate the chain" });
    }
  });

export const landingPageGenerationProfileSourceSchema = z
  .object({
    taxonChain: landingPageGenerationProfileTaxonChainSchema,
    profiles: z.array(landingPageGenerationProfileSchema),
  })
  .strict()
  .superRefine((source, context) => {
    const ownerTaxonIds = new Set(source.taxonChain.nodes.map((node) => node.taxonId));
    if (source.profiles.some((profile) => !ownerTaxonIds.has(profile.ownerTaxonId))) {
      context.addIssue({ code: "custom", path: ["profiles"], message: "profile owner must belong to the supplied taxon chain" });
    }
    const activeOwners = source.profiles
      .filter((profile) => profile.status === "active")
      .map((profile) => profile.ownerTaxonId);
    if (new Set(activeOwners).size !== activeOwners.length) {
      context.addIssue({ code: "custom", path: ["profiles"], message: "source cannot contain two active profiles for one taxon" });
    }
  });
