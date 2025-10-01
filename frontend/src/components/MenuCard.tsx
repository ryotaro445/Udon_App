// src/components/MenuCard.tsx
import { useEffect, useState } from "react";
import { isE2E } from "../test/e2eFlag";

export type Menu = {
  id: number;
  name: string;
  price: number;
  stock: number;
  image?: string | null;
};
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
  const [liked, setLiked] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);

  // userToken 準備（無ければ生成）
  let token = localStorage.getItem("userToken") ?? "";
  if (!token) {
    const fallback = Math.random().toString(36).slice(2);
    token = (globalThis.crypto?.randomUUID?.() as string | undefined)
      ? `DEMO-${crypto.randomUUID()}`
      : `DEMO-${fallback}`;
    localStorage.setItem("userToken", token);
  }

  // 初期ロード：count と自分の liked 状態を並列取得
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [r1, r2] = await Promise.all([
          fetch(`${API_BASE}/api/menus/${m.id}/likes`),
          fetch(`${API_BASE}/api/menus/${m.id}/like/me`, {
            headers: { "X-User-Token": token },
          }),
        ]);
        if (mounted && r1.ok) {
          const js1 = await r1.json();
          setLikeCount(Number(js1?.count ?? 0));
        }
        if (mounted && r2.ok) {
          const js2 = await r2.json();
          setLiked(Boolean(js2?.liked));
        }
      } catch {
        /* noop */
      }
    })();
    return () => {
      mounted = false;
    };
    // token は固定化されるので依存に入れなくてOK
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [m.id]);

  const inc = () => setQty((v) => v + 1);

  const addNow = () => {
    const useQty = qty > 0 ? qty : 1;
    onAdd?.({ id: m.id, price: m.price, stock: m.stock }, useQty);
    setQty(isE2E() ? 1 : 0);
  };

  // トグル：liked → DELETE、未liked → POST（楽観的更新＋サーバ値同期）
  const toggleLike = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (!liked) {
        // 楽観的に +1 & liked=true
        setLiked(true);
        setLikeCount((v) => v + 1);

        const r = await fetch(`${API_BASE}/api/menus/${m.id}/like`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-User-Token": token,
          },
        });
        if (r.ok) {
          const js = await r.json(); // {new, count}
          if (typeof js?.count === "number") setLikeCount(js.count);
          setLiked(true);
        } else {
          // 失敗したらロールバック
          setLiked(false);
          setLikeCount((v) => Math.max(0, v - 1));
        }
      } else {
        // 楽観的に -1 & liked=false
        setLiked(false);
        setLikeCount((v) => Math.max(0, v - 1));

        const r = await fetch(`${API_BASE}/api/menus/${m.id}/like`, {
          method: "DELETE",
          headers: { "X-User-Token": token },
        });
        if (r.ok) {
          const js = await r.json(); // {deleted, count}
          if (typeof js?.count === "number") setLikeCount(js.count);
          setLiked(false);
        } else {
          // 失敗したらロールバック
          setLiked(true);
          setLikeCount((v) => v + 1);
        }
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <article
      role="article"
      aria-label={m.name}
      className="rounded-2xl shadow p-3 bg-white flex flex-col gap-2"
      data-testid="menu-card"
    >
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

        {/* いいね（トグル） */}
        <button
          data-testid={`like-${m.id}`}
          onClick={toggleLike}
          disabled={busy}
          className={`rounded px-3 py-1 border ml-auto ${
            liked ? "bg-gray-200" : ""
          }`}
          title={liked ? "いいねを取り消す" : "いいね"}
          aria-label="いいね"
        >
          {liked ? "💖" : "🤍"} {likeCount}
        </button>
      </div>
    </article>
  );
}