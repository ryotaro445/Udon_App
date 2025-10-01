// src/context/ModeCtx.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Mode = "customer" | "staff" | "NONE";

type ModeContextValue = {
  mode: Mode;
  setMode: (m: Mode) => void;
};

const Ctx = createContext<ModeContextValue | null>(null);

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<Mode>("NONE");

  // 初期化：localStorage から復元
  useEffect(() => {
    try {
      const saved = (localStorage.getItem("mode") ?? "").toLowerCase();
      if (saved === "customer" || saved === "staff") {
        setModeState(saved as Mode);
      }
    } catch {
      // noop
    }
  }, []);

  // setMode 時に永続化
  const setMode = (m: Mode) => {
    setModeState(m);
    try {
      if (m === "customer" || m === "staff") {
        localStorage.setItem("mode", m);
      } else {
        localStorage.removeItem("mode");
      }
    } catch {
      // noop
    }
  };

  const value: ModeContextValue = { mode, setMode };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMode() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useMode must be used within <ModeProvider>");
  return ctx;
}