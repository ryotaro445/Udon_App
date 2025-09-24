import { useEffect, useState } from "react";
import { fetchMenus, addStock, setStock, Menu } from "../api/menus";

export default function InventoryStaffPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setMenus(await fetchMenus());
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onAdd = async (id: number, delta: number) => {
    try {
      const m = await addStock(id, delta);
      setMenus(ms => ms.map(x => (x.id === id ? m : x)));
      window.dispatchEvent(new Event("stock-updated"));
    } catch (e: any) {
      alert(e.message || "更新に失敗しました");
    }
  };

  const onSet = async (id: number, value: number) => {
    try {
      const m = await setStock(id, value);
      setMenus(ms => ms.map(x => (x.id === id ? m : x)));
      window.dispatchEvent(new Event("stock-updated"));
    } catch (e: any) {
      alert(e.message || "更新に失敗しました");
    }
  };

  if (loading) return <div>Loading...</div>;
  if (err) return <div style={{ color: "red" }}>{err}</div>;

  return (
    <div>
      <h2 style={{ margin: "12px 0" }}>在庫管理</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left" }}>メニュー</th>
            <th>価格</th>
            <th>在庫</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {menus.map(m => (
            <tr key={m.id}>
              <td>{m.name}</td>
              <td>¥{m.price}</td>
              <td style={{ textAlign: "center" }}>{m.stock}</td>
              <td style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                <button onClick={() => onAdd(m.id, -1)} disabled={m.stock <= 0}>-1</button>
                <button onClick={() => onAdd(m.id, +1)}>+1</button>
                <input
                  type="number"
                  min={0}
                  defaultValue={m.stock}
                  onBlur={(e) => onSet(m.id, Math.max(0, Number(e.target.value)))}
                  style={{ width: 80 }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}