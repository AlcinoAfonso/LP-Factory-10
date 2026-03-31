// src/lib/admin/index.ts
/**
 * Módulo Admin (E7)
 * Exports centralizados
 */

export * from "./contracts";
export {
  tokens as adminTokens,
  checkSuperAdmin,
  checkPlatformAdmin, // novo export
} from "./adapters/adminAdapter";
export * as postSaleTokenAdapter from "./adapters/postSaleTokenAdapter";
