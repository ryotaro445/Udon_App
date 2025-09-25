import { createContext, useContext, useState, ReactNode } from "react";

export type Mode = "customer" | "staff" | "NONE";

type ModeContextValue = {
  mode: Mode;
  setMode: (m: Mode) => void;
};

const Ctx = createContext<ModeContextValue | null>(null);

export function ModeProvider({ children }: { children: ReactNode }) {
  // ← ここで useState を使って状態を管理
  const [mode, setMode] = useState<Mode>("NONE");

  const value: ModeContextValue = { mode, setMode };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMode() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error("useMode must be used within <ModeProvider>");
  }
  return ctx;
}