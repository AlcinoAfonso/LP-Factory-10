"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { searchOpenAiCostAccountsAction } from "../actions";
import type { OpenAiCostAccountOption } from "../action-core";

export function OpenAiCostAccountFilter({ value, onChange, disabled }: Readonly<{
  value: OpenAiCostAccountOption | null;
  onChange: (value: OpenAiCostAccountOption | null) => void;
  disabled: boolean;
}>) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(-1);
  const [response, setResponse] = useState<Readonly<{
    query: string; items: readonly OpenAiCostAccountOption[] | null;
  }> | null>(null);
  const term = query.trim();
  const canSearch = open && !disabled && term.length >= 2;
  const items = canSearch && response?.query === term ? response.items : undefined;
  const lastOption = items?.length ?? 0;

  useEffect(() => {
    if (!canSearch) return;
    let current = true;
    const timeout = setTimeout(async () => {
      const matches = await searchOpenAiCostAccountsAction(term).catch(() => null);
      if (current) setResponse({ query: term, items: matches });
    }, 250);
    return () => { current = false; clearTimeout(timeout); };
  }, [canSearch, term]);
  useEffect(() => {
    if (open && highlight >= 0) document.getElementById(`${id}-option-${highlight}`)?.scrollIntoView({ block: "nearest" });
  }, [open, highlight, id]);

  function choose(option: OpenAiCostAccountOption | null) {
    onChange(option);
    setOpen(false);
    setQuery("");
    setHighlight(-1);
  }

  function navigate(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setHighlight(index => event.key === "ArrowDown"
        ? Math.min(index + 1, lastOption) : index <= 0 ? lastOption : index - 1);
    } else if (open && event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    } else if (open && event.key === "Enter") {
      event.preventDefault();
      if (highlight === lastOption) choose(null);
      else if (highlight >= 0 && items?.[highlight]) choose(items[highlight]);
    }
  }

  return (
    <div className="relative min-w-0 space-y-1" onBlur={event => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }}>
      <label htmlFor={id} className="block text-sm font-medium">Conta</label>
      <div className="flex min-h-11 items-center gap-1.5 rounded-md border border-input bg-background px-2 focus-within:ring-2 focus-within:ring-ring">
        <span aria-hidden="true" className="relative mr-1 size-3 shrink-0 rounded-full border border-current text-muted-foreground after:absolute after:-bottom-0.5 after:-right-1 after:h-px after:w-1.5 after:rotate-45 after:bg-current after:content-['']" />
        <input
          ref={input}
          id={id}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open && !disabled}
          aria-controls={`${id}-options`}
          aria-activedescendant={open && highlight >= 0 && highlight <= lastOption ? `${id}-option-${highlight}` : undefined}
          autoComplete="off"
          maxLength={100}
          disabled={disabled}
          placeholder={open ? "Buscar por nome" : "Todas as contas"}
          value={open ? query : value?.name ?? ""}
          onFocus={() => { setQuery(""); setHighlight(-1); setOpen(true); }}
          onClick={() => { if (!open) { setQuery(""); setHighlight(-1); setOpen(true); } }}
          onChange={event => { setQuery(event.target.value); setHighlight(-1); setOpen(true); }}
          onKeyDown={navigate}
          className="min-h-11 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground sm:text-sm"
        />
        {(open ? query : value) && !disabled ? <button type="button" aria-label={open ? "Limpar busca" : "Limpar conta"}
          className="-mr-2 flex min-h-11 min-w-11 shrink-0 items-center justify-center text-muted-foreground focus-visible:outline-ring"
          onClick={() => {
            if (!open) onChange(null);
            setQuery("");
            setHighlight(-1);
            input.current?.focus();
          }}><span aria-hidden="true" className="text-lg">×</span></button> : null}
      </div>
      <div hidden={!open || disabled} className="absolute right-0 z-30 w-52 min-w-full rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-lg min-[420px]:left-1/2 min-[420px]:right-auto min-[420px]:-translate-x-1/2">
        <div id={`${id}-options`} role="listbox" aria-label="Contas encontradas" className="max-h-64 overflow-y-auto">
          {items?.map((option, index) => (
            <button key={option.id} type="button" role="option" tabIndex={-1}
              id={`${id}-option-${index}`} aria-selected={value?.id === option.id}
              className={`block min-h-11 w-full rounded px-2 py-1.5 text-left text-sm [overflow-wrap:anywhere] hover:bg-muted ${highlight === index ? "bg-muted" : ""}`}
              onMouseDown={event => event.preventDefault()} onClick={() => choose(option)}>
              {option.name}
              {option.subdomain && items.some(other => other.id !== option.id && other.name === option.name)
                ? <span className="block text-xs text-muted-foreground">{option.subdomain}</span> : null}
            </button>
          ))}
          <button type="button" role="option" tabIndex={-1} id={`${id}-option-${lastOption}`} aria-selected={value === null}
            className={`min-h-11 w-full rounded px-2 text-left text-sm hover:bg-muted ${highlight === lastOption ? "bg-muted" : ""}`}
            onMouseDown={event => event.preventDefault()} onClick={() => choose(null)}>Todas as contas</button>
        </div>
        <p role="status" className="px-2 text-xs text-muted-foreground">
          {!canSearch ? "Digite ao menos 2 caracteres." : items === undefined ? "Buscando contas…" :
            items === null ? "Busca indisponível. Tente novamente." : items.length === 0 ? "Nenhuma conta encontrada." : ""}
        </p>
      </div>
    </div>
  );
}
