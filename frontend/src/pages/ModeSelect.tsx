// src/pages/ModeSelect.tsx
import { useNavigate } from "react-router-dom";
import { useMode } from "../context/ModeCtx";
import React from "react";

export default function ModeSelect() {
  const navigate = useNavigate();
  const { setMode } = useMode();

  // フロント側の従業員パス（未設定なら admin）
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
      // サーバ照合用トークンも保存（http.ts が X-Staff-Token を付ける）
      try { localStorage.setItem("staffToken", input.trim()); } catch {}
      setMode("staff");
      navigate("/menu-admin");
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
        <header className="px-8 pt-8 pb-6 text-center">
          <p className="text-xs tracking-wide text-slate-500 dark:text-slate-400">モード選択</p>
          <h1 id="mode-title" className="mt-1 text-3xl font-bold text-slate-900 dark:text-slate-100">
            利用モードを選択
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            デモではどちらかを選んでお進みください
          </p>
        </header>

        <div className="px-8 pb-8">
          <div className="flex justify-center gap-12 flex-wrap">
            {/* お客様モード（黒ボタン＋ベルの挿絵） */}
            <button
              aria-label="お客様モード"
              onClick={pickCustomer}
              className="w-56 aspect-square flex flex-col items-center justify-center
                         rounded-2xl bg-black text-white
                         shadow-md ring-offset-2 transition
                         active:scale-[0.99]
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-black/40
                         dark:bg-slate-800 dark:hover:bg-slate-700"
              data-testid="btn-customer"
            >
              <div className="text-6xl mb-3" aria-hidden>🛎️</div>
              <div className="text-xl font-bold">お客様</div>
              <div className="mt-2 text-sm opacity-80">注文・掲示板</div>
            </button>

            {/* 従業員モード（白ボタン＋コックの挿絵） */}
            <button
              aria-label="従業員モード"
              onClick={pickStaff}
              className="w-56 aspect-square flex flex-col items-center justify-center
                         rounded-2xl border border-slate-300 bg-white
                         shadow-sm transition hover:bg-slate-50
                         active:scale-[0.99]
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 ring-offset-2
                         dark:bg-slate-900 dark:border-slate-700 dark:hover:bg-slate-800"
              data-testid="btn-staff"
            >
              <div className="text-6xl mb-3" aria-hidden>🧑‍🍳</div>
              <div className="text-xl font-bold">従業員</div>
              <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                メニュー編集・在庫・分析
              </div>
            </button>
          </div>

          <div className="mt-8 rounded-xl bg-slate-50 dark:bg-slate-900/60 p-4 text-xs text-slate-600 dark:text-slate-400 text-center">
            <p>※ 従業員モードはパスワード入力があります。</p>
            <p className="mt-1">
              環境変数 <code className="font-mono">VITE_STAFF_PASS</code> 未設定時は{" "}
              <code className="font-mono">admin</code>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}