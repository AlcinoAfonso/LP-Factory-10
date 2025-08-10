'use client';

import React, { createContext, useContext } from 'react';
import type { AccessContext } from '../lib/access/types';

/**
 * Provider leve para expor dados não-sensíveis do contexto na UI.
 * A resolução real virá do servidor; aqui só o contêiner e os hooks.
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

export function useAccessContext(): Partial<AccessContext> {
  const ctx = useContext(AccessContextReact);
  return ctx ?? {};
}
