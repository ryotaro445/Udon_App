// src/context/ModeCtx.tsx
import { createContext, useContext, useState, ReactNode } from "react";

export type Mode = "CUSTOMER" | "STAFF" | "NONE";

type ModeContextValue = {
  mode: Mode;
  setMode: (m: Mode) => void;
};

const Ctx = createContext<ModeContextValue | null>(null);

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>("NONE");
  const value = { mode, setMode }; // ★オブジェクトで渡す
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMode() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error("useMode must be used within <ModeProvider>");
  }
  return ctx;
}