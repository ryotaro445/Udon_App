import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

type ToastVariant = "default" | "success" | "warning" | "danger";
type ToastItem = {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: ToastVariant;
  duration?: number; // ms
};

type ToastContextValue = {
  toast: (title: React.ReactNode, opts?: Omit<ToastItem, "id" | "title">) => string;
  success: (title: React.ReactNode, opts?: Omit<ToastItem, "id" | "title" | "variant">) => string;
  warning: (title: React.ReactNode, opts?: Omit<ToastItem, "id" | "title" | "variant">) => string;
  danger:  (title: React.ReactNode, opts?: Omit<ToastItem, "id" | "title" | "variant">) => string;
  dismiss: (id: string) => void;
};

const Ctx = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<string, number>());

  const dismiss = useCallback((id: string) => {
    setItems(prev => prev.map(t => (t.id === id ? { ...t, description: t.description, title: t.title, variant: t.variant, duration: t.duration } : t)));
    // add leaving class then remove after 180ms
    const el = document.getElementById(`toast-${id}`);
    if (el) el.classList.add("toast--leaving");
    window.setTimeout(() => {
      setItems(prev => prev.filter(t => t.id !== id));
      const tm = timers.current.get(id);
      if (tm) { window.clearTimeout(tm); timers.current.delete(id); }
    }, 180);
  }, []);

  const push = useCallback((payload: Omit<ToastItem, "id">) => {
    const id = crypto.randomUUID();
    const item: ToastItem = { id, duration: 3200, ...payload };
    setItems(prev => [item, ...prev].slice(0, 6)); // 上限6
    const tm = window.setTimeout(() => dismiss(id), item.duration);
    timers.current.set(id, tm);
    return id;
  }, [dismiss]);

  const api: ToastContextValue = useMemo(() => ({
    toast: (title, opts) => push({ title, ...opts }),
    success: (title, opts) => push({ title, variant: "success", ...opts }),
    warning: (title, opts) => push({ title, variant: "warning", ...opts }),
    danger:  (title, opts) => push({ title, variant: "danger",  ...opts }),
    dismiss,
  }), [push, dismiss]);

  return (
    <Ctx.Provider value={api}>
      {children}
      {createPortal(
        <div className="toast-viewport" aria-live="polite" aria-atomic="true">
          {items.map(t => (
            <div
              key={t.id}
              id={`toast-${t.id}`}
              role="status"
              className={`toast ${t.variant ? `toast--${t.variant}` : ""}`}
            >
              <div>
                {t.title && <div className="toast__title">{t.title}</div>}
                {t.description && <div className="toast__desc">{t.description}</div>}
              </div>
              <button
                aria-label="閉じる"
                className="toast__close"
                onClick={() => api.dismiss(t.id)}
              >
                ×
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}
    </Ctx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider />");
  return ctx;
}