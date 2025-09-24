import { useEffect, useState } from "react";
import { apiGet } from "../api/client";

type Menu = { id:number; name:string; price:number; image_url?:string };
type MenusResponse = { menu: Menu[] };

export default function MenuPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    apiGet<MenusResponse>("/api/menus")
      .then((data) => setMenus(data.menu))
      .catch((e) => setError(String(e)));
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">メニュー</h1>
      {error && <div className="text-red-600 mb-3">読み込み失敗: {error}</div>}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {menus.map(m => (
          <div key={m.id} className="rounded-2xl shadow p-3 flex flex-col items-center gap-2">
            <img
              src={m.image_url || "/placeholder.png"}
              alt={m.name}
              className="w-full aspect-square object-cover rounded-xl"
            />
            <div className="text-center">
              <div className="font-semibold">{m.name}</div>
              <div className="opacity-70">¥{m.price}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}