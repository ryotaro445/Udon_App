import { createContext, useContext, useMemo, useState } from "react";
import type { TableInfo } from "../types";

export type TableCtx = {
  table: TableInfo | null;
  setTable: (t: TableInfo | null) => void;
  clear: () => void;
};

const Ctx = createContext<TableCtx | null>(null);

export function TableProvider({ children }: { children: React.ReactNode }) {
  const [table, setTable] = useState<TableInfo | null>(() => {
    try {
      const raw = localStorage.getItem("tableInfo");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const value = useMemo(
    () => ({
      table,
      setTable: (t: TableInfo | null) => {
        setTable(t);
        if (t) localStorage.setItem("tableInfo", JSON.stringify(t));
        else localStorage.removeItem("tableInfo");
      },
      clear: () => {
        setTable(null);
        localStorage.removeItem("tableInfo");
      },
    }),
    [table]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTable() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTable must be used within <TableProvider>");
  return ctx;
}