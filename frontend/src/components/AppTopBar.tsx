import { Link, useNavigate } from "react-router-dom";
import { useMode } from "../context/ModeCtx";

export default function AppTopBar() {
  const { role, setRole } = useMode();
  const nav = useNavigate();

  const switchMode = () => {
    // 簡易切替：いったん解除 → 選択画面へ
    setRole(null);
    nav("/mode");
  };

  return (
    <header className="w-full flex items-center justify-between p-3 shadow">
      <nav className="flex items-center gap-4">
        <Link to="/order">注文</Link>
        <Link to="/menu-admin">メニュー管理</Link>
      </nav>
      <div className="flex items-center gap-3">
        <span>現在: {role ?? "未選択"}</span>
        <button className="rounded-xl px-3 py-1 shadow" onClick={switchMode}>モード切替</button>
      </div>
    </header>
  );
}