// src/App.tsx
import { Routes, Route, Navigate, MemoryRouter } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";

// モード選択/ガード
import ModeSelect from "./pages/ModeSelect";
import ProtectedRoute from "./pages/ProtectedRoute";
import AppTopBar from "./components/AppTopBar";

// 画面
import OrderPage from "./pages/OrderPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import BoardPage from "./pages/BoardPage";
import NoticesPage from "./pages/NoticesPage";
import MenuAdminPage from "./pages/MenuAdminPage";
import StaffLoginPage from "./pages/StaffLoginPage";



// 先頭付近に追加
(function bootstrapE2E() {
  try {
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("e2e") === "1") {
      // E2E時は必ず CUSTOMER & table=12 を投入
      localStorage.setItem("mode", "CUSTOMER");
      if (!localStorage.getItem("table")) {
        localStorage.setItem("table", sp.get("table") ?? "12");
      }
    }
  } catch {}
})();


// === ルーティング本体だけを切り出し（テストでも流用しやすい） ===
export function AppRoutes() {
  return (
    <Routes>
      {/* モード選択 */}
      <Route path="/mode" element={<ModeSelect />} />

      {/* お客様/共通（どちらのモードでも閲覧可にしておく例） */}
      <Route element={<ProtectedRoute allow={["customer", "staff"]} />}>
        <Route path="/order" element={<OrderPage />} />
        <Route path="/board" element={<BoardPage />} />
        <Route path="/notices" element={<NoticesPage />} />
      </Route>

      {/* 従業員専用 */}
      <Route element={<ProtectedRoute allow={["staff"]} />}>
        <Route path="/menu-admin" element={<MenuAdminPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
      </Route>

      {/* 補助：従業員ログイン画面（使わないなら削除OK） */}
      <Route path="/staff-login" element={<StaffLoginPage />} />

      {/* 既定遷移＆ワイルドカード */}
      <Route path="/" element={<Navigate to="/mode" replace />} />
      <Route path="*" element={<Navigate to="/mode" replace />} />
    </Routes>
  );
}

// === 本番用：従来どおり default export ===
export default function App() {
  return (
    <AppLayout>
      <AppTopBar />
      <AppRoutes />
    </AppLayout>
  );
}

// === テスト用：初期パスを指定してレンダリングしたい時に使う ===
export function AppTest({ initialPath = "/" }: { initialPath?: string }) {
  return (
    <MemoryRouter initialEntries={[initialPath]}>
      <App />
    </MemoryRouter>
  );
}