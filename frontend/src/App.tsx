// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import ModeSelect from "./pages/ModeSelect";
import ModeGuard from "./pages/ModeGuard";
import { CustomerApp } from "./apps/CustomerApp";
import { StaffApp } from "./apps/StaffApp";

// E2Eブート（必要なら残す）
(function bootstrapE2E() {
  try {
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("e2e") === "1") {
      localStorage.setItem("mode", "CUSTOMER");
      if (!localStorage.getItem("table")) {
        localStorage.setItem("table", sp.get("table") ?? "12");
      }
    }
  } catch {}
})();

export default function App() {
  return (
    <Routes>
      {/* モード選択 */}
      <Route path="/mode" element={<ModeSelect />} />

      {/* お客様専用ツリー */}
      <Route element={<ModeGuard allow="customer" />}>
        <Route path="/c/*" element={<CustomerApp />} />
      </Route>

      {/* 従業員専用ツリー */}
      <Route element={<ModeGuard allow="staff" />}>
        <Route path="/s/*" element={<StaffApp />} />
      </Route>

      {/* 既定遷移 */}
      <Route path="/" element={<Navigate to="/mode" replace />} />
      <Route path="*" element={<Navigate to="/mode" replace />} />
    </Routes>
  );
}