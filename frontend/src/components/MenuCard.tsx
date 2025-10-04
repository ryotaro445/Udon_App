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
const IMG_H = "h-28 md:h-32";

export default function MenuCard({
  m,
  onAdd,
  onOpenComment,
  inCart, // 参照のみ
}: {
  m: Menu;
  onAdd?: (m: MenuForCart, qty: number) => void;
  onOpenComment?: (id: number) => void;
  inCart?: number;
}) {
  const [likeCount, setLikeCount] = useState<number>(0);
  const [liked, setLiked] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);

  // userToken
  let token = localStorage.getItem("userToken") ?? "";
  if (!token) {
    const fallback = Math.random().toString(36).slice(2);
    token =
      (globalThis.crypto?.randomUUID?.() as string | undefined)
        ? `DEMO-${crypto.randomUUID()}`
        : `DEMO-${fallback}`;
    localStorage.setItem("userToken", token);
  }

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
      } catch {}
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [m.id]);

  const soldOut = Number.isFinite(m.stock) ? m.stock <= 0 : false;

  const addNow = () => {
    if (soldOut) return;
    onAdd?.({ id: m.id, price: m.price, stock: m.stock }, 1); // 1個だけ追加
  };

  const toggleLike = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (!liked) {
        setLiked(true);
        setLikeCount((v) => v + 1);
        const r = await fetch(`${API_BASE}/api/menus/${m.id}/like`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-User-Token": token },
        });
        if (r.ok) {
          const js = await r.json();
          if (typeof js?.count === "number") setLikeCount(js.count);
          setLiked(true);
        } else {
          setLiked(false);
          setLikeCount((v) => Math.max(0, v - 1));
        }
      } else {
        setLiked(false);
        setLikeCount((v) => Math.max(0, v - 1));
        const r = await fetch(`${API_BASE}/api/menus/${m.id}/like`, {
          method: "DELETE",
          headers: { "X-User-Token": token },
        });
        if (r.ok) {
          const js = await r.json();
          if (typeof js?.count === "number") setLikeCount(js.count);
          setLiked(false);
        } else {
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
      data-testid="menu-card"
      className="w-full rounded-2xl bg-white shadow p-3 flex flex-col gap-2 border [writing-mode:horizontal-tb]"
    >
      {/* 画像 */}
      <div className="relative">
        {m.image ? (
          <img
            src={m.image}
            alt={m.name}
            className={`w-full ${IMG_H} object-cover rounded-xl border`}
          />
        ) : (
          <div className={`w-full ${IMG_H} grid place-items-center rounded-xl border border-dashed text-slate-400`}>
            No Image
          </div>
        )}
        {soldOut && (
          <span className="absolute top-2 right-2 text-xs bg-red-600 text-white px-2 py-1 rounded">
            売り切れ
          </span>
        )}
      </div>

      {/* タイトル・価格（在庫の表示はナシ） */}
      <div className="font-semibold truncate">{m.name}</div>
      <div className="text-slate-700">¥{m.price.toLocaleString()}</div>

      {/* 操作ボタン（カード側は追加だけ） */}
      <div className="flex gap-2 items-center">
        <button
          data-testid="add"
          onClick={addNow}
          disabled={soldOut}
          className="px-3 py-2 rounded-lg bg-black text-white font-semibold shadow hover:bg-gray-800 disabled:opacity-40"
        >
          追加
        </button>

        {onOpenComment && (
          <button
            data-testid="open-comment"
            onClick={() => onOpenComment(m.id)}
            className="px-3 py-2 rounded-lg border bg-white hover:bg-slate-50"
          >
            コメント
          </button>
        )}

        <button
          data-testid={`like-${m.id}`}
          onClick={toggleLike}
          disabled={busy}
          title={liked ? "いいねを取り消す" : "いいね"}
          aria-label="いいね"
          className={`ml-auto px-3 py-2 rounded-lg border bg-white hover:bg-slate-50 disabled:opacity-40 ${liked ? "bg-slate-100" : ""}`}
        >
          {liked ? "💖" : "🤍"} {likeCount}
        </button>
      </div>
    </article>
  );
}