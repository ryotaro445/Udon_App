import { Link, useLocation } from "react-router-dom";

const showAnalytics = import.meta.env.VITE_SHOW_ANALYTICS === "1";
const showKitchen   = import.meta.env.VITE_SHOW_KITCHEN === "1";

export default function AppNav() {
  const { pathname } = useLocation();

  const Item = ({ to, label, disabled }: { to: string; label: string; disabled?: boolean }) => {
    if (disabled) {
      return (
        <span
          aria-disabled="true"
          className="px-3 py-2 rounded text-gray-400 cursor-not-allowed"
          title="準備中"
        >
          {label}
        </span>
      );
    }
    const active = pathname.startsWith(to);
    return (
      <Link
        to={to}
        className={`px-3 py-2 rounded ${active ? "bg-black text-white" : "hover:bg-gray-100"}`}
      >
        {label}
      </Link>
    );
  };

  return (
    <nav className="flex gap-2 p-3 border-b">
      <Item to="/mode" label="モード" />
      <Item to="/order?table=12" label="注文" />
      <Item to="/menu-admin" label="メニュー管理" />
      {/* 未実装は非表示 または disabled */}
      {showAnalytics ? <Item to="/analytics" label="Analytics" /> : null}
      {!showKitchen ? <Item to="#" label="キッチン（準備中）" disabled /> : <Item to="/kitchen" label="キッチン" />}
    </nav>
  );
}