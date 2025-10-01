// src/apps/StaffApp.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import StaffLayout from "../layouts/StaffLayout";
import MenuAdminPage from "../pages/MenuAdminPage";
import AnalyticsPage from "../pages/AnalyticsPage";
// 掲示板編集が別UIなら StaffNoticesPage を用意して差し替え可
import NoticesPage from "../pages/NoticesPage";

export function StaffApp() {
  return (
    <StaffLayout>
      <Routes>
        <Route path="menu-admin" element={<MenuAdminPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="notices" element={<NoticesPage />} />
        <Route path="" element={<Navigate to="menu-admin" replace />} />
        <Route path="*" element={<Navigate to="menu-admin" replace />} />
      </Routes>
    </StaffLayout>
  );
}