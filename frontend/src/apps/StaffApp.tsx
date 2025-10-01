import { Routes, Route, Navigate } from "react-router-dom";
import StaffLayout from "../layouts/StaffLayout";
import MenuAdminPage from "../pages/MenuAdminPage";
import AnalyticsPage from "../pages/AnalyticsPage";
import BoardPage from "../pages/BoardPage";
import NoticesPage from "../pages/NoticesPage";

export function StaffApp() {
  return (
    <StaffLayout>
      <Routes>
        <Route path="menu-admin" element={<MenuAdminPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="notices" element={<BoardPage canPost />} />
        {/* お知らせ専用ページがあるなら差し替え可能 */}
        <Route path="" element={<Navigate to="menu-admin" replace />} />
        <Route path="*" element={<Navigate to="menu-admin" replace />} />
      </Routes>
    </StaffLayout>
  );
}