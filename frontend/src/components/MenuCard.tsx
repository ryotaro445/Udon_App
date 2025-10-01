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

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:8000";

export default function MenuCard({
  m,
  onAdd,
  onOpenComment,
}: {
  m: Menu;
  onAdd?: (m: MenuForCart, qty: number) => void;
  onOpenComment?: (id: number) => void;
}) {
  const [qty, setQty] = useState<number>(isE2E() ? 1 : 0);
  const [likeCount, setLikeCount] = useState<number>(0);
  const [isLiking, setIsLiking] = useState<boolean>(false);

  // ---- 初期カウント取得 ----
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/api/menus/${m.id}/likes`);
        if (!r.ok) return;
        const js = await r.json();
        if (mounted) setLikeCount(Number(js?.count ?? 0));
      } catch {
        /* noop */
      }
    })();
    return () => {
      mounted = false;
    };
  }, [m.id]);

  // 「＋」で数量を増やす
  const inc = () => setQty((v) => v + 1);

  // 「追加」：qty が 0 なら 1 にしてカートへ投入
  const addNow = () => {
    const useQty = qty > 0 ? qty : 1;
    onAdd?.({ id: m.id, price: m.price, stock: m.stock }, useQty);
    setQty(isE2E() ? 1 : 0);
  };

  // ---- いいね：押すだけ（重複はサーバ側でidempotent扱い） ----
  const doLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      // userToken を用意（無ければ作って保存）
      let token = localStorage.getItem("userToken") ?? "";
      if (!token) {
        // crypto.randomUUID が無い環境でも動くフォールバック
        const fallback = Math.random().toString(36).slice(2);
        token = (globalThis.crypto?.randomUUID?.() as string | undefined)
          ? `DEMO-${crypto.randomUUID()}`
          : `DEMO-${fallback}`;
        localStorage.setItem("userToken", token);
      }

      const r = await fetch(`${API_BASE}/api/menus/${m.id}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Token": token,
        },
      });

      if (r.ok) {
        const js = await r.json(); // {new: boolean, count: number}
        if (typeof js?.count === "number") setLikeCount(js.count);
      } else {
        // 409/400 等は据え置き（必要なら再取得）
        // const re = await fetch(`${API_BASE}/api/menus/${m.id}/likes`);
        // if (re.ok) setLikeCount((await re.json()).count ?? likeCount);
      }
    } catch {
      /* noop */
    } finally {
      setIsLiking(false);
    }
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

      <div className="flex gap-2 items-center">
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

        {/* いいねボタン（右寄せ） */}
        <button
          data-testid={`like-${m.id}`}
          onClick={doLike}
          disabled={isLiking}
          className="rounded px-3 py-1 border ml-auto"
          title="いいね"
          aria-label="いいね"
        >
          ❤️ {likeCount}
        </button>
      </div>
    </article>
  );
}