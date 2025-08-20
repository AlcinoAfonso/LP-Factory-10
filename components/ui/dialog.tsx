"use client";
import * as React from "react";

type Ctx = { onOpenChange?: (o: boolean) => void };
const DialogCtx = React.createContext<Ctx | null>(null);

export function Dialog({
  open,
  onOpenChange,
  children,
}: { open: boolean; onOpenChange?: (o: boolean) => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <DialogCtx.Provider value={{ onOpenChange }}>
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-black/50" onClick={() => onOpenChange?.(false)} />
        <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
          {children}
        </div>
      </div>
    </DialogCtx.Provider>
  );
}

export function DialogContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const ctx = React.useContext(DialogCtx);
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && ctx?.onOpenChange?.(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [ctx]);
  return (
    <div
      {...props}
      className={`w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl ${className ?? ""}`}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
}

export function DialogHeader(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={`mb-4 ${props.className ?? ""}`} />;
}
export function DialogTitle(props: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 {...props} className={`text-lg font-semibold ${props.className ?? ""}`} />;
}
export function DialogDescription(props: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p {...props} className={`text-sm text-gray-500 ${props.className ?? ""}`} />;
}
