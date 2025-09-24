// frontend/src/pages/ProtectedRoute.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useMode } from "../context/ModeCtx";

const isE2E = import.meta.env.VITE_E2E === "1";

// 表記ゆれ・保存先ゆれを吸収
function normalizeRole(input?: string | null): "customer" | "staff" | null {
  const v = (input ?? "").toString().trim().toLowerCase();
  if (v === "customer") return "customer";
  if (v === "staff") return "staff";
  return null;
}

function readRoleFallback(): "customer" | "staff" | null {
  const keys = ["role", "mode", "app_mode", "udon.mode"];
  for (const k of keys) {
    try {
      const v = localStorage.getItem(k) ?? sessionStorage.getItem(k);
      const n = normalizeRole(v);
      if (n) return n;
    } catch {}
  }
  // cookie に置いている場合
  const m = (document.cookie || "").match(/(?:^|;\s*)mode=([^;]+)/);
  if (m) return normalizeRole(m[1]);
  return null;
}

export default function ProtectedRoute({
  allow,
}: { allow: ("customer" | "staff")[] }) {
  const { role } = useMode();           // Context（非同期初期化の可能性あり）
  const loc = useLocation();

  // 1) まず context → だめなら storage/cookie から補完
  const roleNorm = normalizeRole(role) ?? readRoleFallback();

  // 2) E2E は緩和（デモ安定化）
  if (isE2E) {
    if (!roleNorm) {
      // E2E でも最低限 /mode へ誘導したいなら下を残す
      return <Navigate to="/mode" replace state={{ from: loc }} />;
    }
    // 許可ロールでない場合の分岐
    if (!allow.includes(roleNorm)) {
      return <Navigate to={roleNorm === "staff" ? "/menu-admin" : "/order"} replace />;
    }
    return <Outlet />;
  }

  // 3) 本番ガード：ロール未確定は /mode
  if (!roleNorm) return <Navigate to="/mode" replace state={{ from: loc }} />;

  if (!allow.includes(roleNorm)) {
    return <Navigate to={roleNorm === "staff" ? "/menu-admin" : "/order"} replace />;
  }

  return <Outlet />;
}