import { useNavigate } from "react-router-dom";
import { useMode } from "../context/ModeCtx";
import React from "react";

export default function ModeSelect() {
  const navigate = useNavigate();
  const { setMode } = useMode();

  const staffPass = import.meta.env.VITE_STAFF_PASS ?? "admin";

  const pickCustomer = () => {
    setMode("CUSTOMER");
    navigate("/order");
  };

  const pickStaff = () => {
    const input = window.prompt("従業員パスワードを入力してください") ?? "";
    if (input.trim() === staffPass) {
      setMode("STAFF");
      navigate("/menu-admin");
    } else {
      window.alert("パスワードが違います");
    }
  };

  return (
    <main className="min-h-[100dvh] bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-6">
      <section
        className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm"
        aria-labelledby="mode-title"
      >
        <header className="px-6 pt-6 pb-3 text-center">
          <p className="text-xs tracking-wide text-slate-500 dark:text-slate-400">モード選択</p>
          <h1 id="mode-title" className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
            利用モードを選択
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            デモではどちらかを選んでお進みください
          </p>
        </header>

        <div className="px-6 pb-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* お客様モード */}
            <button
              aria-label="お客様モード"
              onClick={pickCustomer}
              className="group relative overflow-hidden rounded-2xl bg-black text-white p-4 shadow-md ring-offset-2 transition active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-black/40 dark:bg-slate-800 dark:hover:bg-slate-700"
              data-testid="btn-customer"
            >
              <div className="flex items-start gap-3 text-left">
                <div className="text-2xl leading-none" aria-hidden>🛎️</div>
                <div>
                  <div className="text-sm opacity-80">お客様</div>
                  <div className="text-lg font-semibold">お客様モード</div>
                  <div className="mt-1 text-xs opacity-80">注文・掲示板の操作</div>
                </div>
              </div>
              <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-white/20 via-transparent to-white/20" />
            </button>

            {/* 従業員モード */}
            <button
              aria-label="従業員モード"
              onClick={pickStaff}
              className="rounded-2xl border border-slate-300 bg-white p-4 shadow-sm transition hover:bg-slate-50 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 ring-offset-2 dark:bg-slate-900 dark:border-slate-700 dark:hover:bg-slate-800"
              data-testid="btn-staff"
            >
              <div className="flex items-start gap-3 text-left">
                <div className="text-2xl leading-none" aria-hidden>🧑‍🍳</div>
                <div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">従業員</div>
                  <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    従業員モード
                  </div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    メニュー編集・在庫・分析
                  </div>
                </div>
              </div>
            </button>
          </div>

          {/* 補助情報 */}
          <div className="mt-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 p-3 text-xs text-slate-600 dark:text-slate-400">
            <p>※ 従業員モードはパスワード入力があります。</p>
            <p className="mt-0.5">環境変数 <code className="font-mono">VITE_STAFF_PASS</code> 未設定時は <code className="font-mono">admin</code></p>
          </div>
        </div>
      </section>
    </main>
  );
}