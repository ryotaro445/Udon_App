// frontend/src/apps/StaffApp.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import StaffLayout from "../layouts/StaffLayout";
import MenuAdminPage from "../pages/MenuAdminPage";
import AnalyticsPage from "../pages/AnalyticsPage";
import BoardPage from "../pages/BoardPage";

export function StaffApp() {
  return (
    <StaffLayout>
      <Routes>
        {/* スタッフ共通メニュー */}
        <Route path="menu-admin" element={<MenuAdminPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />

        {/* タブ直リンク（ショートカット） */}
        <Route
          path="analytics/forecast"
          element={<Navigate to="../analytics?tab=forecast" replace />}
        />
        <Route
          path="analytics/heatmap"
          element={<Navigate to="../analytics?tab=heatmap" replace />}
        />

        <Route path="notices" element={<BoardPage canPost />} />

        {/* デフォルト（メニュー管理へ） */}
        <Route path="" element={<Navigate to="menu-admin" replace />} />
        <Route path="*" element={<Navigate to="menu-admin" replace />} />
      </Routes>
    </StaffLayout>
  );
}