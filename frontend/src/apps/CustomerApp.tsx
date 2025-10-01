import { Routes, Route, Navigate } from "react-router-dom";
import CustomerLayout from "../layouts/CustomerLayout";
import OrderPage from "../pages/OrderPage";
import BoardPage from "../pages/BoardPage";
import NoticesPage from "../pages/NoticesPage";

export function CustomerApp() {
  return (
    <CustomerLayout>
      <Routes>
        <Route path="order" element={<OrderPage />} />
        <Route path="board" element={<BoardPage canPost={false} />} />
        <Route path="notices" element={<NoticesPage />} />
        <Route path="" element={<Navigate to="order" replace />} />
        <Route path="*" element={<Navigate to="order" replace />} />
      </Routes>
    </CustomerLayout>
  );
}