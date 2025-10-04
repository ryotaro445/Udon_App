// src/pages/MenuAdminPage.tsx
import { useEffect, useMemo, useState } from "react";
import { fetchMenus, createMenu, deleteMenu, updateMenu, type Menu } from "../api/menus";

type Row = Menu & { _editing?: boolean; _temp?: boolean };

export default function MenuAdminPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setErr(null);
    try {
      const data = await fetchMenus();
      setRows(
        (data as Menu[]).map((m) => ({
          ...m,
          stock: (m as any).stock ?? (m as any).quantity ?? (m as any).in_stock ?? 0,
        }))
      );
    } catch (e: any) {
      setErr(e.message || "読み込み失敗");
    }
  };

  useEffect(() => {
    void load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  const addBlank = () => {
    const minId = Math.min(0, ...rows.map((r) => r.id));
    const tmp: Row = {
      id: minId - 1,
      name: "",
      price: 500,
      stock: 10,
      image: "",
      _editing: true,
      _temp: true,
    } as Row;
    setRows((rs) => [tmp, ...rs]);
  };

  const startEdit = (id: number) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, _editing: true } : r)));

  const cancelEdit = (id: number) =>
    setRows((rs) =>
      rs
        .map((r) => (r.id === id ? { ...r, _editing: false } : r))
        .filter((r) => !r._temp)
    );

  const setField = (id: number, key: keyof Menu | "stock", value: any) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [key]: value } : r)));

  const onSave = async (row: Row) => {
    setErr(null);
    if (row._temp) {
      const prev = rows;
      const optimisticId = row.id;
      setLoading(true);
      try {
        setRows((rs) => rs.map((r) => (r.id === optimisticId ? { ...r, _editing: false } : r)));
        const created = await createMenu({
          name: row.name.trim(),
          price: Number(row.price),
          stock: Number((row as any).stock ?? 0),
          image: (row.image || "").trim() || null,
        });
        setRows((rs) => rs.map((r) => (r.id === optimisticId ? { ...(created as any) } : r)));
        await load();
      } catch (e: any) {
        setRows(prev);
        setErr(e.message || "追加に失敗しました");
      } finally {
        setLoading(false);
      }
    } else {
      const prev = rows;
      const patch: any = {
        name: row.name.trim(),
        price: Number(row.price),
        stock: Number((row as any).stock ?? 0),
        image: (row.image || "").trim() || null,
      };
      setLoading(true);
      try {
        setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, ...patch, _editing: false } : r)));
        await updateMenu(row.id, patch);
        await load();
      } catch (e: any) {
        setRows(prev);
        setErr(e.message || "更新に失敗しました");
      } finally {
        setLoading(false);
      }
    }
  };

  const onDelete = async (row: Row) => {
    if (!confirm("削除しますか？")) return;
    const prev = rows;
    setErr(null);
    setRows((rs) => rs.filter((r) => r.id !== row.id));
    try {
      await deleteMenu(row.id);
      await load();
    } catch (e: any) {
      setRows(prev);
      setErr(e.message || "削除失敗");
    }
  };

  const totalPreview = useMemo(
    () => rows.reduce((acc, r) => acc + Number(r.price ?? 0), 0),
    [rows]
  );

  return (
    <div className="max-w-7xl w-full min-w-0 mx-auto p-6 space-y-4 [writing-mode:horizontal-tb]">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">メニュー管理（スタッフ）</h1>
        <div className="flex gap-2">
          <button
            data-testid="btn-reload"
            onClick={load}
            disabled={loading}
            className="px-3 py-2 rounded-lg border bg-white hover:bg-slate-50 disabled:opacity-40"
          >
            再取得
          </button>
          <button
            data-testid="btn-add"
            onClick={addBlank}
            disabled={loading}
            className="px-3 py-2 rounded-lg bg-black text-white shadow hover:bg-gray-800 disabled:opacity-40"
          >
            追加
          </button>
        </div>
      </header>

      {err && (
        <div role="alert" data-testid="alert-error" className="p-3 rounded-lg bg-red-100 text-red-700">
          {err}
        </div>
      )}

      <div className="rounded-2xl border bg-white overflow-hidden divide-y">
        {rows.map((m) => {
          const editing = !!m._editing;
          const stock = (m as any).stock ?? 0;
          const validImg = (m.image || "").trim().startsWith("http");
          return (
            <div
              key={m.id}
              data-testid="menu-row"
              className="grid grid-cols-[160px_1fr_160px_160px_auto] gap-6 md:gap-8 items-start p-4"
            >
              {/* 画像 */}
              <div>
                {editing ? (
                  <>
                    <input
                      data-testid="inp-image"
                      placeholder="画像URL"
                      value={m.image || ""}
                      onChange={(e) => setField(m.id, "image", e.target.value)}
                      className="w-[160px] rounded-md border px-2 py-1 text-sm"
                    />
                    {m.image && validImg && (
                      <img
                        src={m.image}
                        alt="preview"
                        className="w-[160px] h-[96px] object-cover rounded-lg border mt-2"
                      />
                    )}
                  </>
                ) : m.image ? (
                  <img
                    src={m.image}
                    alt={m.name}
                    className="w-[160px] h-[96px] object-cover rounded-lg border"
                  />
                ) : (
                  <div className="w-[160px] h-[96px] rounded-lg border border-dashed text-xs text-slate-400 grid place-items-center">
                    No Image
                  </div>
                )}
              </div>

              {/* 名前 */}
              <div className="min-w-0">
                {editing ? (
                  <input
                    data-testid="inp-name"
                    placeholder="商品名"
                    value={m.name}
                    onChange={(e) => setField(m.id, "name", e.target.value)}
                    className="w-full rounded-md border px-3 py-2"
                  />
                ) : (
                  <div className="font-semibold break-words">{m.name}</div>
                )}
              </div>

              {/* 価格 */}
              <div>
                {editing ? (
                  <input
                    data-testid="inp-price"
                    type="number"
                    placeholder="価格"
                    value={m.price}
                    onChange={(e) => setField(m.id, "price", Number(e.target.value))}
                    className="w-full rounded-md border px-3 py-2"
                  />
                ) : (
                  <div>¥{Number(m.price).toLocaleString()}</div>
                )}
              </div>

              {/* 在庫 */}
              <div>
                {editing ? (
                  <input
                    data-testid="inp-stock"
                    type="number"
                    placeholder="在庫"
                    value={stock}
                    onChange={(e) => setField(m.id, "stock", Number(e.target.value))}
                    className="w-full rounded-md border px-3 py-2"
                  />
                ) : (
                  <div>在庫: {stock}</div>
                )}
              </div>

              {/* アクション */}
              <div className="flex gap-2 justify-end">
                {editing ? (
                  <>
                    <button
                      data-testid="btn-save"
                      onClick={() => onSave(m)}
                      disabled={loading}
                      className="px-3 py-2 rounded-lg bg-black text-white shadow hover:bg-gray-800 disabled:opacity-40"
                    >
                      保存
                    </button>
                    <button
                      data-testid="btn-cancel"
                      onClick={() => cancelEdit(m.id)}
                      disabled={loading}
                      className="px-3 py-2 rounded-lg border bg-white hover:bg-slate-50 disabled:opacity-40"
                    >
                      キャンセル
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      data-testid="btn-edit"
                      onClick={() => startEdit(m.id)}
                      disabled={loading}
                      className="px-3 py-2 rounded-lg border bg-white hover:bg-slate-50 disabled:opacity-40"
                    >
                      編集
                    </button>
                    <button
                      data-testid="btn-delete"
                      onClick={() => onDelete(m)}
                      disabled={loading}
                      className="px-3 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-40"
                    >
                      削除
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
        {rows.length === 0 && <div className="p-4 text-slate-500">メニューがありません</div>}
      </div>

      <div className="text-right text-xs text-slate-500">
        合計価格プレビュー: {totalPreview.toLocaleString()} 円
      </div>
    </div>
  );
}