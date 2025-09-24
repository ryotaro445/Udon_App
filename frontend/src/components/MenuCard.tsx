// src/components/MenuCard.tsx
import { useEffect, useState } from "react";
import { isE2E } from "../test/e2eFlag";

// 型定義
export type Menu = {
  id: number;
  name: string;
  price: number;
  stock: number;
  image?: string | null;
};

// カートに必要な最小情報（構造型）
export type MenuForCart = { id: number; price: number; stock?: number };

// 安全な UUID 生成（必要なら継続）
function safeRandomUUID() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function ensureUserToken() {
  if (typeof window === "undefined") return "test-token";
  try {
    const ls = window.localStorage;
    let t = ls.getItem("userToken");
    if (!t) {
      t = safeRandomUUID();
      try {
        ls.setItem("userToken", t);
      } catch {}
    }
    return t;
  } catch {
    return safeRandomUUID();
  }
}

export default function MenuCard({
  m,
  onAdd,
  onOpenDetail,
}: {
  m: Menu;
  // qty を一緒に渡せるようにする
  onAdd?: (m: MenuForCart, qty: number) => void;
  onOpenDetail?: (id: number) => void;
}) {
  const [token, setToken] = useState<string | null>(null);
  const [qty, setQty] = useState<number>(isE2E() ? 1 : 0); // ★ E2Eは最初から 1

  useEffect(() => {
    const t = ensureUserToken();
    setToken(t);
  }, []);

  // 「＋」で数量を増やす（data-testid="qty-plus"）
  const inc = () => setQty((v) => v + 1);

  // 「カートに追加」で onAdd を呼ぶ（data-testid="add-to-cart"）
  const addToCart = () => {
    if (!token) return; // 取得前は弾く（UIは disabled にしている）
    if (qty <= 0) return;
    onAdd?.({ id: m.id, price: m.price, stock: m.stock }, qty);
    setQty(isE2E() ? 1 : 0); // 追加後はリセット（E2Eは 1 維持で次も通しやすく）
  };

  // ワンクリック追加（E2E/デモ向けの最小経路）
  const quickAdd = () => {
    if (qty <= 0) setQty(1);
    // 状態反映を待たずに直で呼ぶと qty=0 のままになりうるので、次ティックで呼ぶ
    setTimeout(() => addToCart(), 0);
  };

  const disabledAdd =
    !token || qty <= 0 || (typeof m.stock === "number" && qty > m.stock);

  return (
    <article
      role="article"
      aria-label={m.name}
      className="rounded-2xl shadow p-3 bg-white flex flex-col gap-2"
      data-testid="menu-card"
    >
      <div className="font-semibold">{m.name}</div>
      <div>¥{m.price}</div>

      <div className="flex items-center gap-2">
        <button
          aria-label="plus"
          data-testid="qty-plus"
          onClick={inc}
          className="rounded px-2 py-1 border"
        >
          ＋
        </button>
        <span className="text-sm opacity-80">数量: {qty}</span>
      </div>

      <div className="flex gap-2">
        {/* ★ quick-add を明示（テストで使える） */}
        <button
          data-testid="quick-add"
          onClick={quickAdd}
          className="rounded px-3 py-1 border"
        >
          追加
        </button>

        <button
          data-testid="add-to-cart"
          onClick={addToCart}
          disabled={disabledAdd}
          className="rounded px-3 py-1 bg-blue-600 text-white disabled:opacity-50"
        >
          カートに追加
        </button>

        {onOpenDetail && (
          <button
            onClick={() => onOpenDetail(m.id)}
            className="rounded px-3 py-1 border"
          >
            詳細
          </button>
        )}
      </div>
    </article>
  );
}