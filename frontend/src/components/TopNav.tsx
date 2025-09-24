import { Link, useLocation } from "react-router-dom";

function Item({ to, label }: { to: string; label: string }) {
  const loc = useLocation();
  const active = loc.pathname === to;
  return (
    <Link
      to={to}
      style={{
        padding: "8px 10px",
        borderRadius: 8,
        textDecoration: "none",
        color: active ? "#fff" : "#333",
        background: active ? "#333" : "transparent",
        border: "1px solid #ccc",
      }}
    >
      {label}
    </Link>
  );
}

export default function TopNav() {
  return (
    <nav style={{ display: "flex", gap: 8, marginBottom: 12 }}>
      <Item to="/scan" label="スキャン" />
      <Item to="/order" label="注文" />
      <Item to="/kitchen" label="キッチン" />
      <Item to="/board" label="掲示板" />
      <Item to="/staff" label="スタッフ" />
      <Item to="/analytics" label="分析" />
    </nav>
  );
}