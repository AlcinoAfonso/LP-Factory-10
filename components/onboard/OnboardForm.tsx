"use client";

import React, { useState } from "react";
import { onboardAction } from "../../app/onboard/actions";

interface OnboardFormProps {
  tokenId: string;
  email: string;
  accountName: string;
}

export function OnboardForm({ tokenId, email, accountName }: OnboardFormProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validações client-side
    if (!password || password.length < 8) {
      setError("A senha deve ter no mínimo 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await onboardAction(tokenId, email, password);
      
      if (!result.success) {
        setError(result.error);
        setIsLoading(false);
      }
      // Se sucesso, o redirect acontece na Server Action
    } catch (err) {
      setError("Erro inesperado. Tente novamente.");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Email (readonly) */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          readOnly
          className="w-full px-3 py-2 border rounded bg-gray-50 text-gray-600 cursor-not-allowed"
        />
      </div>

      {/* Senha */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Senha
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          disabled={isLoading}
          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-black focus:border-transparent disabled:opacity-50"
          placeholder="Mínimo 8 caracteres"
          autoFocus
        />
      </div>

      {/* Confirmar Senha */}
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
          Confirmar Senha
        </label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
          disabled={isLoading}
          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-black focus:border-transparent disabled:opacity-50"
          placeholder="Repita a senha"
        />
      </div>

      {/* Mensagem de erro */}
      {error && (
        <div 
          className="p-3 rounded bg-red-50 border border-red-200 text-red-800 text-sm"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Botão Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-4 py-3 rounded bg-black text-white font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? "Criando conta..." : "Criar Conta e Acessar Dashboard"}
      </button>
    </form>
  );
}
