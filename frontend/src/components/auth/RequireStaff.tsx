import { Navigate, useLocation } from "react-router-dom";

export function getStaffToken(): string | null {
  // 画面入力 > .env（後方互換）
  return localStorage.getItem("staffToken") || (import.meta.env.VITE_STAFF_TOKEN as string) || null;
}

export default function RequireStaff({ children }: { children: React.ReactNode }) {
  const token = getStaffToken();
  const loc = useLocation();
  if (!token) return <Navigate to="/staff-login" state={{ from: loc.pathname }} replace />;
  return <>{children}</>;
}