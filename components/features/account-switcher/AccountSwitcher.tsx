// components/features/account-switcher/AccountSwitcher.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUserAccounts } from "./useUserAccounts";
import { useAccessContext } from "@/providers/AccessProvider";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

/**
 * AccountSwitcher
 * Exibe lista de contas do usuário com destaque para a ativa.
 * Oculta "Trocar conta" se só houver uma conta.
 */
export function AccountSwitcher() {
  const router = useRouter();
  const { account } = useAccessContext() || {};
  const [open, setOpen] = useState(false);

  const { data, loading, error, refetch } = useUserAccounts(open);

  if (loading) return <span className="text-sm text-muted-foreground px-3 py-2">Carregando contas…</span>;
  if (error)
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => refetch()}
        className="text-sm text-red-500"
      >
        Tentar novamente
      </Button>
    );

  if (!data || data.length === 0) return null;
  if (data.length === 1) return null; // oculta "Trocar conta" se só 1 conta

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-between">
          Trocar conta
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[220px]">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Minhas contas
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {data.map((acc) => {
          const isActive = acc.accountSubdomain === account?.subdomain;
          const isDisabled =
            acc.accountStatus === "inactive" || acc.accountStatus === "suspended";
          return (
            <DropdownMenuItem
              key={acc.accountId}
              onClick={() =>
                !isDisabled && router.push(`/a/${acc.accountSubdomain}`)
              }
              disabled={isDisabled}
              className={`flex justify-between items-center ${
                isActive ? "font-semibold text-primary" : ""
              }`}
            >
              <span>{acc.accountName}</span>
              {isActive && <span className="text-xs">✓</span>}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/a/home?consultive=1")}>
          Criar outra conta
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
