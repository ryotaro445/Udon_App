import { useEffect, useMemo, useState } from "react";
import { useTable } from "../context/TableCtx";
import TableBanner from "../components/TableBanner";
import MenuCard, { type Menu, type MenuForCart } from "../components/MenuCard";
import MenuDetail from "../components/MenuDetail";
import Toast from "../components/Toast";
import { fetchMenus } from "../api/menus";
import CartBar, { type CartViewItem } from "../components/CartBar";

type CartItem = { menuId: number; qty: number };
const API = import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:8000";

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

  // 追加（カードの＋／−は削除済み。ここでは Add のみ許可）
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
      if (idx >= 0) next[idx] = { ...next[idx], qty: next[idx].qty + addQty };
      else next.push({ menuId: m.id, qty: addQty });
      const stored = next.filter((x) => x.qty > 0);
      localStorage.setItem("cart", JSON.stringify(stored));
      return stored;
    });
  };

  // カート操作（合計バー側の＋／−／取消）
  const inc = (id: number) =>
    setCart((prev) => {
      const m = menus.find((x) => x.id === id);
      const next = prev.map((c) =>
        c.menuId === id
          ? {
              ...c,
              qty: Math.min(
                c.qty + 1,
                typeof m?.stock === "number" ? m.stock : Number.POSITIVE_INFINITY
              ),
            }
          : c
      );
      localStorage.setItem("cart", JSON.stringify(next));
      return next;
    });

  const dec = (id: number) =>
    setCart((prev) => {
      const next = prev
        .map((c) => (c.menuId === id ? { ...c, qty: Math.max(0, c.qty - 1) } : c))
        .filter((c) => c.qty > 0);
      localStorage.setItem("cart", JSON.stringify(next));
      return next;
    });

  const remove = (id: number) =>
    setCart((prev) => {
      const next = prev.filter((c) => c.menuId !== id);
      localStorage.setItem("cart", JSON.stringify(next));
      return next;
    });

  const itemsForCart: CartViewItem[] = useMemo(() => {
    return cart
      .map((c) => {
        const m = menus.find((x) => x.id === c.menuId);
        if (!m) return null;
        return { id: m.id, name: m.name, price: m.price, qty: c.qty };
      })
      .filter(Boolean) as CartViewItem[];
  }, [cart, menus]);

  const total = useMemo(
    () => itemsForCart.reduce((sum, it) => sum + it.price * it.qty, 0),
    [itemsForCart]
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
    <div className="p-4 space-y-4" style={{ writingMode: "horizontal-tb" }}>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      <TableBanner table={table} onClear={clear} />

      {loading && <div>読み込み中…</div>}
      {error && <div className="text-red-600">{error}</div>}

      {/* 12 カラム格子（カード側に数量UIなし） */}
      <div className="grid min-w-0 grid-cols-12 gap-4 sm:gap-5 md:gap-6">
        {menus.map((m) => (
          <div key={m.id} className="col-span-12 sm:col-span-6 md:col-span-4 xl:col-span-3 2xl:col-span-2">
            <MenuCard
              m={m}
              onAdd={onAdd}
              onOpenComment={(id) => setCommentId(id)}
              inCart={cart.find((c) => c.menuId === m.id)?.qty ?? 0}
            />
          </div>
        ))}
      </div>

      <CartBar
        items={itemsForCart}
        total={total}
        onInc={inc}
        onDec={dec}
        onRemove={remove}
        onSubmit={submitOrder}
        disabled={itemsForCart.length === 0}
      />

      {commentId !== null && (
        <MenuDetail menuId={commentId} onClose={() => setCommentId(null)} />
      )}
    </div>
  );
}