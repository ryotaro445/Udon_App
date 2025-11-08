// frontend/src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import ModeSelect from "./pages/ModeSelect";
import ModeGuard from "./pages/ModeGuard";
import { CustomerApp } from "./apps/CustomerApp";
import { StaffApp } from "./apps/StaffApp";

export default function App() {
  return (
    <Routes>
      {/* 🔒 従業員モード配下 */}
      <Route element={<ModeGuard allow="staff" />}>
        <Route path="/s/*" element={<StaffApp />} />
      </Route>

      {/* 🔒 お客様モード配下 */}
      <Route element={<ModeGuard allow="customer" />}>
        <Route path="/c/*" element={<CustomerApp />} />
      </Route>

      {/* 🧭 モード選択ページ */}
      <Route path="/mode" element={<ModeSelect />} />

      {/* 🧩 旧ルート互換（直接叩いた場合） */}
      <Route path="/analytics" element={<Navigate to="/s/analytics" replace />} />
      <Route path="/s/analytics/forecast" element={<Navigate to="/s/analytics?tab=forecast" replace />} />
      <Route path="/s/analytics/heatmap" element={<Navigate to="/s/analytics?tab=heatmap" replace />} />

      {/* 🏠 デフォルト遷移 */}
      <Route path="/" element={<Navigate to="/mode" replace />} />
      <Route path="*" element={<Navigate to="/mode" replace />} />
    </Routes>
  );
}