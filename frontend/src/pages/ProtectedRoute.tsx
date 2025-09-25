import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useMode } from "../context/ModeCtx";

const isE2E = import.meta.env.VITE_E2E === "1";

// 正規化関数
function normalizeRole(input?: string | null): "customer" | "staff" | null {
  const v = (input ?? "").toString().trim().toLowerCase();
  if (v === "customer") return "customer";
  if (v === "staff") return "staff";
  return null;
}

// fallback で localStorage / cookie を参照
function readRoleFallback(): "customer" | "staff" | null {
  const keys = ["role", "mode", "app_mode", "udon.mode"];
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

export default function ProtectedRoute({
  allow,
}: { allow: ("customer" | "staff")[] }) {
  const { mode } = useMode();     // ← role → mode に統一
  const loc = useLocation();

  const roleNorm = normalizeRole(mode) ?? readRoleFallback();

  // E2E の場合はゆるめ
  if (isE2E) {
    if (!roleNorm) return <Navigate to="/mode" replace state={{ from: loc }} />;
    if (!allow.includes(roleNorm)) {
      return (
        <Navigate
          to={roleNorm === "staff" ? "/menu-admin" : "/order"}
          replace
        />
      );
    }
    return <Outlet />;
  }

  // 本番用
  if (!roleNorm) return <Navigate to="/mode" replace state={{ from: loc }} />;
  if (!allow.includes(roleNorm)) {
    return (
      <Navigate
        to={roleNorm === "staff" ? "/menu-admin" : "/order"}
        replace
      />
    );
  }

  return <Outlet />;
}