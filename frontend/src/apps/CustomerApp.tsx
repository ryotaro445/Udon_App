// frontend/src/apps/CustomerApp.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import CustomerLayout from "../layouts/CustomerLayout";
import OrderPage from "../pages/OrderPage";

export function CustomerApp() {
  return (
    <CustomerLayout>
      <Routes>
        {/* お客様用ページは注文のみ */}
        <Route path="order" element={<OrderPage />} />
        {/* デフォルト & フォールバック */}
        <Route path="" element={<Navigate to="order" replace />} />
        <Route path="*" element={<Navigate to="order" replace />} />
      </Routes>
    </CustomerLayout>
  );
}

export default CustomerApp;