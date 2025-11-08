// frontend/src/components/MenuCard.tsx
import { type FC } from "react";

export type Menu = {
  id: number;
  name: string;
  price: number;
  image?: string | null;
  // stock/in_stock は使わない
};

export type MenuForCart = { id: number; price: number };

const IMG_H = "h-28 md:h-32";

const MenuCard: FC<{
  m: Menu;
  onAdd?: (m: MenuForCart, qty: number) => void;
  inCart?: number;
}> = ({ m, onAdd, inCart }) => {
  const addNow = () => onAdd?.({ id: m.id, price: m.price }, 1);

  return (
    <article
      role="article"
      aria-label={m.name}
      data-testid="menu-card"
      className="w-full rounded-2xl bg-white shadow p-3 flex flex-col gap-2 border [writing-mode:horizontal-tb]"
    >
      <div className="relative">
        {m.image ? (
          <img
            src={m.image}
            alt={m.name}
            className={`w-full ${IMG_H} object-cover rounded-xl border`}
          />
        ) : (
          <div
            className={`w-full ${IMG_H} grid place-items-center rounded-xl border border-dashed text-slate-400`}
          >
            No Image
          </div>
        )}
      </div>

      <div className="font-semibold truncate">{m.name}</div>
      <div className="text-slate-700">¥{m.price.toLocaleString()}</div>

      <div className="flex gap-2 items-center">
        <button
          data-testid="add"
          onClick={addNow}
          className="px-3 py-2 rounded-lg bg-black text-white font-semibold shadow hover:bg-gray-800"
        >
          追加{typeof inCart === "number" && inCart > 0 ? `（${inCart}）` : ""}
        </button>
      </div>
    </article>
  );
};

export default MenuCard;