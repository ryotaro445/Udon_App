// src/pages/ModeGuard.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useMode } from "../context/ModeCtx";

export default function ModeGuard({ allow }: { allow: "customer" | "staff" }) {
  const { mode } = useMode();
  // localStorage に保存された値も見て、ページ更新後も維持
  const saved = (localStorage.getItem("mode") ?? "").toLowerCase();
  const effective = (mode !== "NONE" ? mode : (saved as any)) as
    | "customer"
    | "staff"
    | "NONE";

  if (effective !== allow) return <Navigate to="/mode" replace />;
  return <Outlet />;
}