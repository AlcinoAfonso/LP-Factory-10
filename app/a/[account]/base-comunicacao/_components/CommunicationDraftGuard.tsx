"use client";

import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";

type DraftEntry = { dirty: boolean; busy: boolean; discard: () => void };
type DraftGuard = {
  register: (key: string, entry: DraftEntry) => () => void;
  confirmDiscard: (message?: string) => boolean;
};
const DraftContext = createContext<DraftGuard | null>(null);
const LEAVE_EVENT = "communication-base:leave";
const DISCARD_MESSAGE = "Você tem alterações não salvas. Descartar o rascunho e continuar?";

type NavigationEntry = { key: string; index: number; url: string | null };
type BaseNavigation = EventTarget & {
  currentEntry: NavigationEntry | null;
  traverseTo: (key: string) => unknown;
};
type TraverseEvent = Event & { navigationType: string; destination: NavigationEntry };

function documentUrl(url: string) {
  const parsed = new URL(url, window.location.href);
  return parsed.origin + parsed.pathname + parsed.search;
}

export function CommunicationDraftGuard({ children }: Readonly<{ children: ReactNode }>) {
  const entries = useRef(new Map<string, DraftEntry>());
  const [ready, setReady] = useState(false);
  const [documentNavigation, setDocumentNavigation] = useState(false);
  const [protectionUnavailable, setProtectionUnavailable] = useState(false);
  const skipUnloadOnce = useRef(false);
  const register = useCallback((key: string, entry: DraftEntry) => {
    entries.current.set(key, entry);
    if (entry.dirty) skipUnloadOnce.current = false;
    return () => { if (entries.current.get(key) === entry) entries.current.delete(key); };
  }, []);
  const confirmDiscard = useCallback((message = DISCARD_MESSAGE) => {
    const current = [...entries.current.values()];
    if (current.some((entry) => entry.busy)) {
      window.alert("Aguarde o resultado do salvamento antes de sair desta seção.");
      return false;
    }
    const changed = current.filter((entry) => entry.dirty);
    if (changed.length && !window.confirm(message)) return false;
    changed.forEach((entry) => entry.discard());
    return true;
  }, []);
  const context = useMemo(() => ({ register, confirmDiscard }), [register, confirmDiscard]);

  useLayoutEffect(() => {
    const navigation = (window as Window & { navigation?: BaseNavigation }).navigation;
    const original = navigation?.currentEntry;
    const hasNavigation = !!navigation && !!original?.key &&
      Number.isInteger(original.index) && original.index >= 0 && typeof navigation.traverseTo === "function";
    const useDocument = !hasNavigation;
    if (useDocument) {
      const timing = performance.getEntriesByType("navigation")[0];
      if (!timing) { setProtectionUnavailable(true); return; }
      if (documentUrl(timing.name) !== documentUrl(window.location.href)) {
        window.location.reload();
        return;
      }
    }
    setDocumentNavigation(useDocument);
    setReady(true);
    let traversal: NavigationEntry | null = null;
    let restoringKey: string | null = null;
    const onNavigate = (event: Event) => {
      const next = event as TraverseEvent;
      if (restoringKey || next.navigationType !== "traverse") return;
      const source = navigation?.currentEntry;
      traversal = source?.key && next.destination.url &&
        documentUrl(next.destination.url) !== documentUrl(window.location.href) ? source : null;
    };
    const onPopState = (event: PopStateEvent) => {
      if (restoringKey) {
        event.stopImmediatePropagation();
        if (navigation?.currentEntry?.key === restoringKey) restoringKey = null;
        return;
      }
      const source = traversal;
      traversal = null;
      if (!source || confirmDiscard()) return;
      event.stopImmediatePropagation();
      restoringKey = source.key;
      navigation?.traverseTo(source.key);
    };
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey ||
        event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(anchor instanceof HTMLAnchorElement) || anchor.hasAttribute("download") ||
        (anchor.target && anchor.target !== "_self")) return;
      const destination = new URL(anchor.href, window.location.href);
      if (!["http:", "https:"].includes(destination.protocol) ||
        documentUrl(destination.href) === documentUrl(window.location.href)) return;
      if (!confirmDiscard()) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      skipUnloadOnce.current = true;
      if (useDocument) {
        event.preventDefault();
        event.stopPropagation();
        window.location.assign(destination.href);
      }
    };
    const onLeave = (event: Event) => {
      const intent = event as CustomEvent<{ documentNavigation: boolean }>;
      if (!confirmDiscard()) { event.preventDefault(); return; }
      intent.detail.documentNavigation = useDocument;
      skipUnloadOnce.current = true;
    };
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (skipUnloadOnce.current) { skipUnloadOnce.current = false; return; }
      if (![...entries.current.values()].some((entry) => entry.dirty || entry.busy)) return;
      event.preventDefault();
      event.returnValue = "";
    };
    navigation?.addEventListener("navigate", onNavigate);
    window.addEventListener("popstate", onPopState, true);
    document.addEventListener("click", onClick, true);
    window.addEventListener(LEAVE_EVENT, onLeave);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      navigation?.removeEventListener("navigate", onNavigate);
      window.removeEventListener("popstate", onPopState, true);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener(LEAVE_EVENT, onLeave);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [confirmDiscard]);

  return <DraftContext.Provider value={context}>
    {protectionUnavailable ? <p role="alert" className="mb-4 text-sm text-state-error">Não foi possível preparar a edição com segurança. Abra a Base em outro navegador para continuar.</p> : null}
    <div inert={!ready} data-navigation-mode={documentNavigation ? "document" : "spa"}>{children}</div>
  </DraftContext.Provider>;
}

export function useCommunicationDraftGuard() {
  const guard = useContext(DraftContext);
  if (!guard) throw new Error("CommunicationDraftGuard must wrap the Base editors.");
  return guard;
}

export function useCommunicationDraft(key: string, entry: DraftEntry) {
  const { register } = useCommunicationDraftGuard();
  useLayoutEffect(() => register(key, entry), [register, key, entry]);
}
