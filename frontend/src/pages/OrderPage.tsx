import { useEffect, useMemo, useState } from "react";
import { useTable } from "../context/TableCtx";
import TableBanner from "../components/TableBanner";
import MenuCard, { type Menu, type MenuForCart } from "../components/MenuCard";
import MenuDetail from "../components/MenuDetail";
import Toast from "../components/Toast";
import { fetchMenus } from "../api/menus";
import CartBar from "../components/CartBar";

type CartItem = { menuId: number; qty: number };
const API = import.meta.env.VITE_API_BASE;

export default function OrderPage() {
  const { table, clear } = useTable();

  const [menus, setMenus] = useState<Menu[]>([]);
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem("cart");
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  const [commentId, setCommentId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    try {
      const data = await fetchMenus();
      setMenus(data as Menu[]);
    } catch (e: any) {
      setError(e?.message ?? "メニュー取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  const onAdd = (m: MenuForCart, addQty: number) => {
    if (typeof m.stock === "number" && m.stock <= 0) {
      setToast("在庫がありません");
      return;
    }
    const inCart = cart.find((c) => c.menuId === m.id)?.qty ?? 0;
    if (typeof m.stock === "number" && inCart + addQty > m.stock) {
      setToast("在庫を超えています");
      return;
    }
    setCart((prev) => {
      const idx = prev.findIndex((x) => x.menuId === m.id);
      const next = [...prev];
      if (idx >= 0) next[idx] = { ...next[idx], qty: Math.max(0, next[idx].qty + addQty) };
      else next.push({ menuId: m.id, qty: addQty });
      localStorage.setItem("cart", JSON.stringify(next.filter((x) => x.qty > 0)));
      return next.filter((x) => x.qty > 0);
    });
  };

  const total = useMemo(
    () =>
      cart.reduce((sum, it) => {
        const m = menus.find((x) => x.id === it.menuId);
        return sum + (m ? m.price * it.qty : 0);
      }, 0),
    [cart, menus]
  );

  const submitOrder = async () => {
    if (cart.length === 0) return;

    try {
      const res = await fetch(`${API}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table_no: table ?? 0,
          items: cart.map((c) => ({ menu_id: c.menuId, quantity: c.qty })),
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.detail ?? "注文に失敗しました");
      }

      setToast("注文を受け付けました");
      setCart([]);
      localStorage.setItem("cart", JSON.stringify([]));
      await load();
    } catch (e: any) {
      setToast(e?.message ?? "注文に失敗しました");
    }
  };

  return (
    <div className="p-4 space-y-4">
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      <TableBanner table={table} onClear={clear} />

      {loading && <div>読み込み中…</div>}
      {error && <div className="text-red-600">{error}</div>}

      {/* メニュー一覧 */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
        {menus.map((m) => (
          <MenuCard
            key={m.id}
            m={m}
            onAdd={onAdd}
            onOpenComment={(id) => setCommentId(id)}
            inCart={cart.find((c) => c.menuId === m.id)?.qty ?? 0}
          />
        ))}
      </div>

      {/* 合計と注文ボタン（下固定バー） */}
      <CartBar total={total} disabled={cart.length === 0} onSubmit={submitOrder} />

      {commentId !== null && (
        <MenuDetail menuId={commentId} onClose={() => setCommentId(null)} />
      )}
    </div>
  );
}