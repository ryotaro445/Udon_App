import { useNavigate } from "react-router-dom";
import { useMode } from "../context/ModeCtx";
import React from "react";

export default function ModeSelect() {
  const navigate = useNavigate();
  const { setMode } = useMode();

  const staffPass =
    import.meta.env.VITE_STAFF_PASS ??
    import.meta.env.VITE_STAFF_PASSWORD ??
    "admin";

  const pickCustomer = () => {
    setMode("customer");
    navigate("/order?table=12");
  };

  const pickStaff = () => {
    const input = window.prompt("従業員パスワードを入力してください") ?? "";
    if (input.trim() === staffPass) {
      // ★ 追加: トークン保存（サーバは STAFF_TOKEN と照合）
      try { localStorage.setItem("staffToken", input.trim()); } catch {}
      setMode("staff");
      navigate("/menu-admin");
    } else {
      window.alert("パスワードが違います");
    }
  };

  return (
    <main className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900 p-6">
      {/* ...（UIは変更なし）... */}
      <div className="flex justify-center gap-12 flex-wrap">
        <button aria-label="お客様モード" onClick={pickCustomer} className="w-56 aspect-square rounded-2xl bg-black text-white">お客様</button>
        <button aria-label="従業員モード" onClick={pickStaff} className="w-56 aspect-square rounded-2xl border">従業員</button>
      </div>
    </main>
  );
}