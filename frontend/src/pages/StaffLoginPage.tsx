import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function StaffLoginPage() {
  const [v, setV] = useState("");
  const nav = useNavigate();
  const loc = useLocation() as any;
  const from = loc.state?.from || "/board";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!v.trim()) return;
    localStorage.setItem("staffToken", v.trim());
    nav(from, { replace: true });
  };

  return (
    <div style={{ maxWidth: 420, margin: "60px auto", padding: 16 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>スタッフログイン</h1>
      <form onSubmit={submit} style={{ display: "grid", gap: 8 }}>
        <input type="password" placeholder="スタッフ用トークン" value={v} onChange={e=>setV(e.target.value)} />
        <button type="submit">ログイン</button>
      </form>
      <div style={{ marginTop: 8, fontSize: 12, opacity: .7 }}>
        入力したトークンはこの端末のブラウザ（localStorage）に保存されます。
      </div>
    </div>
  );
}