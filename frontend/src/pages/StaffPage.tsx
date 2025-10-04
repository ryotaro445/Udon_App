import { useState } from "react";

type Item = { id: number; name: string; stock: number };

export default function StaffPage() {
  const [items, setItems] = useState<Item[]>([
    { id: 1, name: "かけうどん", stock: 10 },
    { id: 2, name: "ぶっかけ", stock: 5 },
  ]);

  const inc = (id: number, d: number) =>
    setItems(list =>
      list.map(it =>
        it.id === id
          ? { ...it, stock: Math.max(0, it.stock + d) }
          : it
      )
    );

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">スタッフ（在庫管理）</h2>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-2 border">商品</th>
            <th className="p-2 border">在庫</th>
            <th className="p-2 border">操作</th>
          </tr>
        </thead>
        <tbody>
          {items.map(it => (
            <tr key={it.id}>
              <td className="p-2 border">{it.name}</td>
              <td
                className={`p-2 border ${
                  it.stock === 0 ? "text-red-500 font-semibold" : ""
                }`}
              >
                {it.stock}
              </td>
              <td className="p-2 border">
                <div className="flex gap-2">
                  <button
                    onClick={() => inc(it.id, -1)}
                    className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300"
                  >
                    -1
                  </button>
                  <button
                    onClick={() => inc(it.id, +1)}
                    className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300"
                  >
                    +1
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-4 text-sm text-gray-600">
        ※ 在庫0の品は注文画面で「注文不可」にできます。
      </p>
    </div>
  );
}