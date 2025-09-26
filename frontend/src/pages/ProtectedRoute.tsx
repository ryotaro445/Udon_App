// src/pages/ProtectedRoute.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useMode } from "../context/ModeCtx";

const isE2E = import.meta.env.VITE_E2E === "1";

// 正規化
function normalizeRole(input?: string | null): "customer" | "staff" | null {
  const v = (input ?? "").toString().trim().toLowerCase();
  if (v === "customer") return "customer";
  if (v === "staff") return "staff";
  return null;
}

// 予備読み（localStorage / cookie）
function readRoleFallback(): "customer" | "staff" | null {
  const keys = ["mode", "role", "app_mode", "udon.mode"];
  for (const k of keys) {
    try {
      const v = localStorage.getItem(k) ?? sessionStorage.getItem(k);
      const n = normalizeRole(v);
      if (n) return n;
    } catch {}
  }
  const m = (document.cookie || "").match(/(?:^|;\s*)mode=([^;]+)/);
  if (m) return normalizeRole(m[1]);
  return null;
}

export default function ProtectedRoute({ allow }: { allow: ("customer" | "staff")[] }) {
  const { mode } = useMode();
  const loc = useLocation();

  const role = normalizeRole(mode) ?? readRoleFallback();

  // E2E時：最低限の役割チェック
  if (isE2E) {
    if (!role) return <Navigate to="/mode" replace state={{ from: loc }} />;
    if (!allow.includes(role)) {
      return <Navigate to={role === "staff" ? "/menu-admin" : "/order"} replace />;
    }
    return <Outlet />;
  }

  // 本番：厳格
  if (!role) return <Navigate to="/mode" replace state={{ from: loc }} />;
  if (!allow.includes(role)) {
    return <Navigate to={role === "staff" ? "/menu-admin" : "/order"} replace />;
  }
  return <Outlet />;
}