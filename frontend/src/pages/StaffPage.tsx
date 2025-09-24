import { useState } from "react";

type Item = { id: number; name: string; stock: number };

export default function StaffPage() {
  const [items, setItems] = useState<Item[]>([
    { id: 1, name: "かけうどん", stock: 10 },
    { id: 2, name: "ぶっかけ", stock: 5 },
  ]);

  const inc = (id: number, d: number) =>
    setItems(list => list.map(it => (it.id === id ? { ...it, stock: Math.max(0, it.stock + d) } : it)));

  return (
    <div>
      <h2>スタッフ（在庫管理）</h2>
      <table>
        <thead><tr><th>商品</th><th>在庫</th><th>操作</th></tr></thead>
        <tbody>
          {items.map(it => (
            <tr key={it.id}>
              <td>{it.name}</td>
              <td>{it.stock}</td>
              <td>
                <button onClick={() => inc(it.id, -1)}>-1</button>{" "}
                <button onClick={() => inc(it.id, +1)}>+1</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ marginTop: 8, color: "#555" }}>※ 在庫0の品は注文画面で「注文不可」にできます。</p>
    </div>
  );
}