// frontend/src/pages/MenuAdminPage.tsx
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
          // スキーマ揺れ吸収（stock/quantity/in_stock のどれかが来る想定）
          stock: (m as any).stock ?? (m as any).quantity ?? (m as any).in_stock ?? 0,
        }))
      );
    } catch (e: any) {
      setErr(e.message || "読み込み失敗");
    }
  };
  useEffect(() => {
    void load();
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
      // 追加 楽観的更新 → 失敗でロールバック
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
      } catch (e: any) {
        setRows(prev);
        setErr(e.message || "追加に失敗しました");
      } finally {
        setLoading(false);
      }
    } else {
      // 更新（PATCH）
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
    // 楽観的削除
    setRows((rs) => rs.filter((r) => r.id !== row.id));
    try {
      await deleteMenu(row.id);
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
    <div style={{ maxWidth: 960, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>メニュー管理（スタッフ）</h1>
      {err && (
        <div role="alert" data-testid="alert-error" style={{ color: "#b00020", marginBottom: 8 }}>
          {err}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button data-testid="btn-reload" onClick={load} disabled={loading}>
          再取得
        </button>
        <button data-testid="btn-add" onClick={addBlank} disabled={loading}>
          追加
        </button>
      </div>

      <div style={{ border: "1px solid #eee", borderRadius: 12, overflow: "hidden" }}>
        {rows.map((m) => {
          const editing = !!m._editing;
          const stock = (m as any).stock ?? 0;
          const validImg = (m.image || "").trim().startsWith("http");
          return (
            <div
              key={m.id}
              data-testid="menu-row"
              style={{
                display: "grid",
                gridTemplateColumns: "112px 1fr 120px 120px auto",
                gap: 12,
                alignItems: "center",
                padding: 12,
                borderBottom: "1px solid #f2f2f2",
              }}
            >
              <div>
                {editing ? (
                  <>
                    <input
                      data-testid="inp-image"
                      placeholder="画像URL"
                      value={m.image || ""}
                      onChange={(e) => setField(m.id, "image", e.target.value)}
                      style={{ width: 112 }}
                    />
                    {m.image && validImg && (
                      <img
                        src={m.image}
                        alt="preview"
                        style={{
                          width: 112,
                          height: 72,
                          objectFit: "cover",
                          borderRadius: 8,
                          border: "1px solid #eee",
                          marginTop: 6,
                        }}
                      />
                    )}
                  </>
                ) : m.image ? (
                  <img
                    src={m.image}
                    alt={m.name}
                    style={{ width: 112, height: 72, objectFit: "cover", borderRadius: 8, border: "1px solid #eee" }}
                  />
                ) : (
                  <div
                    style={{
                      width: 112,
                      height: 72,
                      borderRadius: 8,
                      border: "1px dashed #ccc",
                      display: "grid",
                      placeItems: "center",
                      fontSize: 12,
                      color: "#999",
                    }}
                  >
                    No Image
                  </div>
                )}
              </div>

              <div>
                {editing ? (
                  <input
                    data-testid="inp-name"
                    placeholder="商品名"
                    value={m.name}
                    onChange={(e) => setField(m.id, "name", e.target.value)}
                    style={{ width: "100%" }}
                  />
                ) : (
                  <div style={{ fontWeight: 600 }}>{m.name}</div>
                )}
              </div>

              <div>
                {editing ? (
                  <input
                    data-testid="inp-price"
                    type="number"
                    placeholder="価格"
                    value={m.price}
                    onChange={(e) => setField(m.id, "price", Number(e.target.value))}
                    style={{ width: 120 }}
                  />
                ) : (
                  <>¥{Number(m.price).toLocaleString()}</>
                )}
              </div>

              <div>
                {editing ? (
                  <input
                    data-testid="inp-stock"
                    type="number"
                    placeholder="在庫"
                    value={stock}
                    onChange={(e) => setField(m.id, "stock", Number(e.target.value))}
                    style={{ width: 120 }}
                  />
                ) : (
                  <>在庫: {stock}</>
                )}
              </div>

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                {editing ? (
                  <>
                    <button data-testid="btn-save" onClick={() => onSave(m)} disabled={loading}>
                      保存
                    </button>
                    <button data-testid="btn-cancel" onClick={() => cancelEdit(m.id)} disabled={loading}>
                      キャンセル
                    </button>
                  </>
                ) : (
                  <>
                    <button data-testid="btn-edit" onClick={() => startEdit(m.id)} disabled={loading}>
                      編集
                    </button>
                    <button data-testid="btn-delete" onClick={() => onDelete(m)} disabled={loading}>
                      削除
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
        {rows.length === 0 && <div style={{ padding: 12 }}>メニューがありません</div>}
      </div>

      <div style={{ marginTop: 8, textAlign: "right", fontSize: 12, color: "#666" }}>
        合計価格プレビュー: {totalPreview.toLocaleString()} 円
      </div>
    </div>
  );
}