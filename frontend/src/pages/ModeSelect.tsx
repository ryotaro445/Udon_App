// src/pages/ModeSelect.tsx
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
    try { localStorage.setItem("mode", "customer"); } catch {}
    navigate("/c/order?table=12");
  };

  const pickStaff = () => {
    const input = window.prompt("従業員パスワードを入力してください") ?? "";
    if (input.trim() === staffPass) {
      try {
        localStorage.setItem("staffToken", input.trim());
        localStorage.setItem("mode", "staff");
      } catch {}
      setMode("staff");
      navigate("/s/menu-admin");
    } else {
      window.alert("パスワードが違います");
    }
  };

  return (
    <main className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900 p-6">
      <section
        className="w-full max-w-4xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm"
        aria-labelledby="mode-title"
      >
        {/* 細かい説明テキストをすべて削除 */}
        <header className="px-8 pt-8 pb-6 text-center">
          <h1 id="mode-title" className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            利用モードを選択
          </h1>
        </header>

        <div className="px-8 pb-8">
          <div className="flex justify-center gap-12 flex-wrap">
            <button
              aria-label="お客様モード"
              onClick={pickCustomer}
              className="w-56 aspect-square flex flex-col items-center justify-center
                         rounded-2xl bg-black text-white shadow-md ring-offset-2 transition
                         active:scale-[0.99]
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-black/40
                         dark:bg-slate-800 dark:hover:bg-slate-700"
              data-testid="btn-customer"
            >
              <div className="text-6xl mb-3" aria-hidden>🛎️</div>
              <div className="text-xl font-bold">お客様</div>
              {/* 「注文・掲示板」削除 */}
            </button>

            <button
              aria-label="従業員モード"
              onClick={pickStaff}
              className="w-56 aspect-square flex flex-col items-center justify-center
                         rounded-2xl border border-slate-300 bg-white shadow-sm transition hover:bg-slate-50
                         active:scale-[0.99]
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 ring-offset-2
                         dark:bg-slate-900 dark:border-slate-700 dark:hover:bg-slate-800"
              data-testid="btn-staff"
            >
              <div className="text-6xl mb-3" aria-hidden>🧑‍🍳</div>
              <div className="text-xl font-bold">従業員</div>
              {/* 「メニュー編集・在庫・分析」削除 */}
            </button>
          </div>

          {/* 下部の注意文（パスワード入力・環境変数）削除 */}
        </div>
      </section>
    </main>
  );
}