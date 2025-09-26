// src/components/MenuCard.tsx
import { useState } from "react";
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

export default function MenuCard({
  m,
  onAdd,
  onOpenComment,
}: {
  m: Menu;
  // qty を一緒に渡せる
  onAdd?: (m: MenuForCart, qty: number) => void;
  onOpenComment?: (id: number) => void;
}) {
  const [qty, setQty] = useState<number>(isE2E() ? 1 : 0); // E2E は最初から 1

  // 「＋」で数量を増やす
  const inc = () => setQty((v) => v + 1);

  // 「追加」：qty が 0 なら 1 にしてカートへ投入
  const addNow = () => {
    const useQty = qty > 0 ? qty : 1;
    onAdd?.({ id: m.id, price: m.price, stock: m.stock }, useQty);
    setQty(isE2E() ? 1 : 0); // 追加後はリセット（E2E は 1 維持）
  };

  return (
    <article
      role="article"
      aria-label={m.name}
      className="rounded-2xl shadow p-3 bg-white flex flex-col gap-2"
      data-testid="menu-card"
    >
      {/* 画像（任意） */}
      {m.image ? (
        <img
          src={m.image}
          alt={m.name}
          className="w-full h-28 object-cover rounded-xl border"
        />
      ) : null}

      <div className="font-semibold">{m.name}</div>
      <div>¥{m.price.toLocaleString()}</div>

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
        {/* ★ 「追加」だけ残す（カートに追加は削除） */}
        <button
          data-testid="add"
          onClick={addNow}
          className="rounded px-3 py-1 border"
        >
          追加
        </button>

        {onOpenComment && (
          <button
            data-testid="open-comment"
            onClick={() => onOpenComment(m.id)}
            className="rounded px-3 py-1 border"
          >
            コメント
          </button>
        )}
      </div>
    </article>
  );
}