"use client";

import React, { createContext, useContext } from "react";
import type { AccessContext } from "../lib/access/types";
import { getAccessContext } from "../lib/access/getAccessContext";

/**
 * AccessProvider (UI)
 * 
 * - Expõe dados não-sensíveis do AccessContext na camada React.
 * - Valor deve ser resolvido no server (via getAccessContext + @supabase/ssr)
 *   e injetado aqui já sanitizado.
 * - Mantém separação: lógica SSR no lib/, exposição React no src/providers/.
 */

const AccessContextReact = createContext<Partial<AccessContext> | null>(null);

export function AccessProvider({
  value,
  children,
}: {
  value: Partial<AccessContext> | null;
  children: React.ReactNode;
}) {
  return (
    <AccessContextReact.Provider value={value}>
      {children}
    </AccessContextReact.Provider>
  );
}

/**
 * Hook client-side para consumir o contexto já resolvido no server.
 * Nunca dispara chamadas ao Supabase diretamente; apenas lê o valor injetado.
 */
export function useAccessContext(): Partial<AccessContext> {
  const ctx = useContext(AccessContextReact);
  return ctx ?? {};
}

// Exemplo de integração server-first:
// Em um layout/page server component:
// 
// const ctx = await getAccessContext(); // usa @supabase/ssr internamente
// return (
//   <AccessProvider value={ctx}>
//     <Dashboard />
//   </AccessProvider>
// );
