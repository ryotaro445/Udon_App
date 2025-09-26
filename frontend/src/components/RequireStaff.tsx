import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMode } from "../context/ModeCtx";

export default function RequireStaff({ children }: { children: ReactNode }) {
  const { mode } = useMode();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("staffToken");
    if ((mode !== "staff" && mode !== "STAFF") || !token) {
      navigate("/mode");
    }
  }, [mode, navigate]);

  return <>{children}</>;
}