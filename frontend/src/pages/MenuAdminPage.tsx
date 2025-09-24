import { useEffect, useState } from "react";
import { fetchMenus, createMenu, deleteMenu, type Menu } from "../api/menus";

export default function MenuAdminPage() {
  const [rows, setRows] = useState<Menu[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState<number>(500);
  const [stock, setStock] = useState<number>(10);
  const [image, setImage] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setErr(null);
    try { setRows(await fetchMenus()); }
    catch (e:any) { setErr(e.message || "読み込み失敗"); }
  };
  useEffect(() => { void load(); }, []);

  const submit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await createMenu({ name: name.trim(), price: Number(price), stock: Number(stock), image: image.trim() || null });
      setName(""); setPrice(500); setStock(10); setImage("");
      await load();
    } catch (e:any) { setErr(e.message || "追加に失敗しました"); }
    finally { setLoading(false); }
  };

  const remove = async (id: number) => {
    if (!confirm("削除しますか？")) return;
    try { await deleteMenu(id); await load(); }
    catch (e:any) { alert(e.message || "削除失敗"); }
  };

  // 画像URLが正しそうか簡易チェック（任意）
  const validImg = image.trim().startsWith("http");

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>メニュー管理（スタッフ）</h1>
      {err && <div style={{ color:"#b00020", marginBottom:8 }}>{err}</div>}

      <div style={{ border:"1px solid #eee", borderRadius:12, padding:12, marginBottom:16 }}>
        <div style={{ fontWeight:600, marginBottom:8 }}>新規追加</div>
        <div style={{ display:"grid", gap:8 }}>
          <input placeholder="商品名" value={name} onChange={e=>setName(e.target.value)} />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
            <input type="number" placeholder="価格" value={price} onChange={e=>setPrice(Number(e.target.value))} />
            <input type="number" placeholder="在庫" value={stock} onChange={e=>setStock(Number(e.target.value))} />
            <input placeholder="画像URL (任意)" value={image} onChange={e=>setImage(e.target.value)} />
          </div>

          {image && (
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ fontSize:12, opacity:.7 }}>{validImg ? "プレビュー" : "URLが正しくない可能性があります"}</div>
              {validImg && (
                <img
                  src={image}
                  alt="preview"
                  style={{ width:120, height:80, objectFit:"cover", borderRadius:8, border:"1px solid #eee" }}
                  onError={(e)=>((e.target as HTMLImageElement).style.opacity="0.3")}
                />
              )}
            </div>
          )}

          <div>
            <button onClick={submit} disabled={loading}>{loading ? "追加中..." : "追加"}</button>
          </div>
        </div>
      </div>

      <div style={{ border:"1px solid #eee", borderRadius:12 }}>
        {rows.map(m => (
          <div key={m.id} style={{ display:"grid", gridTemplateColumns:"96px 1fr 120px 120px auto", gap:12, alignItems:"center", padding:12, borderBottom:"1px solid #f2f2f2" }}>
            <div>
              {m.image ? (
                <img src={m.image} alt={m.name} style={{ width:96, height:64, objectFit:"cover", borderRadius:8, border:"1px solid #eee" }} />
              ) : (
                <div style={{ width:96, height:64, borderRadius:8, border:"1px dashed #ccc", display:"grid", placeItems:"center", fontSize:12, color:"#999" }}>No Image</div>
              )}
            </div>
            <div style={{ fontWeight:600 }}>{m.name}</div>
            <div>¥{m.price.toLocaleString()}</div>
            <div>在庫: {m.stock}</div>
            <button onClick={() => remove(m.id)}>削除</button>
          </div>
        ))}
        {rows.length === 0 && <div style={{ padding:12 }}>メニューがありません</div>}
      </div>
    </div>
  );
}