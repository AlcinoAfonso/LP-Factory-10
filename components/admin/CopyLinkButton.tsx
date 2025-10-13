// components/admin/CopyLinkButton.tsx
"use client";

import React from "react";

interface CopyLinkButtonProps {
  tokenId: string;
  isActive: boolean;
}

export function CopyLinkButton({ tokenId, isActive }: CopyLinkButtonProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    const link = `${window.location.origin}/onboard?token=${tokenId}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Erro ao copiar link:", err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={!isActive}
      className="px-3 py-1 rounded border hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
      title={isActive ? "Copiar link de ativação" : "Token inválido"}
      aria-label={`Copiar link do token ${tokenId}`}
    >
      {copied ? "✓ Copiado" : "Copiar Link"}
    </button>
  );
}
