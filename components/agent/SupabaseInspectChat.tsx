"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type SessionResponse = {
  client_secret?: string;
  error?: string;
  message?: string;
};

export function SupabaseInspectChat() {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("Mostre colunas da tabela accounts");
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; text: string }>>([]);

  useEffect(() => {
    let active = true;

    const loadSession = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/chatkit/session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const data = (await response.json()) as SessionResponse;

        if (!response.ok || !data.client_secret) {
          throw new Error(data.message ?? "Não foi possível criar sessão do ChatKit.");
        }

        if (!active) {
          return;
        }

        setClientSecret(data.client_secret);
      } catch (sessionError) {
        if (!active) {
          return;
        }

        const message =
          sessionError instanceof Error
            ? sessionError.message
            : "Erro inesperado ao iniciar o ChatKit.";

        setError(message);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadSession();

    return () => {
      active = false;
    };
  }, []);

  const status = useMemo(() => {
    if (loading) {
      return "Inicializando sessão ChatKit...";
    }

    if (error) {
      return `Falha ao iniciar ChatKit: ${error}`;
    }

    return "Sessão ChatKit pronta para uso.";
  }, [error, loading]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!prompt.trim()) {
      return;
    }

    setMessages((current) => [
      ...current,
      { role: "user", text: prompt },
      {
        role: "assistant",
        text:
          "Sessão inicializada com sucesso. Com a dependência visual oficial do ChatKit disponível no ambiente, esta área pode renderizar o widget completo do workflow.",
      },
    ]);

    setPrompt("");
  };

  return (
    <section className="space-y-4">
      <div className="rounded-md border p-4 text-sm">
        <p className="font-medium">Status</p>
        <p className="text-muted-foreground">{status}</p>
      </div>

      <div className="rounded-md border p-4 text-sm">
        <p className="font-medium">ChatKit Session</p>
        <p className="text-muted-foreground break-all">
          {clientSecret ? `client_secret recebido (${clientSecret.length} chars)` : "Aguardando client_secret..."}
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-3 rounded-md border p-4">
        <label className="text-sm font-medium" htmlFor="agent-input">
          Teste manual
        </label>
        <textarea
          id="agent-input"
          className="min-h-24 w-full rounded-md border p-2 text-sm"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
        />
        <button
          type="submit"
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          disabled={!clientSecret || loading}
        >
          Enviar
        </button>
      </form>

      <div className="space-y-2 rounded-md border p-4">
        <p className="text-sm font-medium">Mensagens</p>
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem mensagens ainda.</p>
        ) : (
          messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className="rounded-md bg-muted p-3 text-sm">
              <p className="font-medium">{message.role === "user" ? "Você" : "Agente"}</p>
              <p>{message.text}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
