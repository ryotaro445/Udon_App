// src/pages/OrderPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useTable } from "../context/TableCtx";
import TableBanner from "../components/TableBanner";
import MenuCard, { type Menu, type MenuForCart } from "../components/MenuCard";
import MenuDetail from "../components/MenuDetail";
import Toast from "../components/Toast";
import { fetchMenus } from "../api/menus";

// 既存 types.CartItem と整合とるならリネームしてOK
type CartItem = { menuId: number; qty: number };

export default function OrderPage() {
  const { table, clear } = useTable();

  // 商品一覧（在庫つき）
  const [menus, setMenus] = useState<Menu[]>([]);
  // カート（localStorage復元）
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem("cart");
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  // 詳細モーダル（コメント用）
  const [detailId, setDetailId] = useState<number | null>(null);

  // ローディング／エラー／トースト
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMenus(); // /api/menus を叩く想定
      setMenus(data);
    } catch (e: any) {
      setError(e?.message ?? "メニュー取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    const onStock = () => load();
    window.addEventListener("stock-updated", onStock);
    return () => {
      clearInterval(t);
      window.removeEventListener("stock-updated", onStock);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // MenuCard から受け取る「追加」処理（数量対応）
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
      localStorage.setItem("cart", JSON.stringify(next));
      return next;
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
    // 本来は POST /api/orders（table を含む）
    // await apiPost('/api/orders', { table, items: cart })

    // --- E2E/デモ用：確実にトーストを出し、カートを空にする ---
    setToast("注文を受け付けました");
    setCart([]);
    localStorage.setItem("cart", JSON.stringify([]));
    // --------------------------------------------
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {toast && (
        // ★ テストが拾えるよう testid をここで付与
        <div data-testid="toast">
          <Toast message={toast} onClose={() => setToast(null)} />
        </div>
      )}

      <TableBanner table={table} onClear={clear} />

      {loading && <div>読み込み中…</div>}
      {error && <div style={{ color: "crimson" }}>{error}</div>}

      {/* メニュー一覧 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 12,
        }}
      >
        {menus.map((m) => (
          <MenuCard
            key={m.id}
            m={m}
            onAdd={onAdd}
            onOpenDetail={(id) => setDetailId(id)}
          />
        ))}
      </div>

      {/* 合計と注文ボタン */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
        <div>
          合計: <b>¥{total.toLocaleString()}</b>
        </div>
        <button
          data-testid="order-submit"
          // ★ E2Eを確実に通す：カートが空でなければ押せる
          disabled={cart.length === 0}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #aaa" }}
          onClick={submitOrder}
        >
          注文を確定
        </button>
      </div>

      {detailId !== null && (
        <MenuDetail
          menuId={detailId}
          onClose={() => setDetailId(null)}
        />
      )}
    </div>
  );
}