"use client";

import React, { createContext, useContext } from "react";
import type { AccessContext } from "../lib/access/types";

/**
 * AccessProvider (UI)
 *
 * - Exposição client-side de dados não sensíveis do AccessContext.
 * - O valor deve ser resolvido no server (getAccessContext + @supabase/ssr)
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
// const ctx = await getAccessContext(); // resolvido no server
// return (
//   <AccessProvider value={ctx}>
//     <Dashboard />
//   </AccessProvider>
// );
