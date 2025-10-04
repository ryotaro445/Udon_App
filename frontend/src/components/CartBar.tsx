import React from "react";

export type CartViewItem = {
  id: number;
  name: string;
  price: number;
  qty: number;
};

export default function CartBar({
  items,
  total,
  onInc,
  onDec,
  onRemove,
  onSubmit,
  disabled,
}: {
  items: CartViewItem[];
  total: number;
  onInc: (id: number) => void;
  onDec: (id: number) => void;
  onRemove: (id: number) => void;
  onSubmit: () => void;
  disabled: boolean;
}) {
  return (
    <div className="sticky bottom-0 left-0 right-0 bg-white border-t px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-start gap-4">
        {/* 縦に羅列 */}
        <div className="flex-1 min-w-0">
          <ul className="max-h-56 overflow-auto space-y-2 pr-2">
            {items.map((it) => (
              <li
                key={it.id}
                className="flex items-center gap-3 rounded-lg border px-3 py-2 bg-slate-50"
              >
                <div className="truncate">{it.name}</div>

                <div className="ml-auto flex items-center gap-2">
                  <button
                    aria-label="minus"
                    onClick={() => onDec(it.id)}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-md border bg-white hover:bg-gray-50"
                  >
                    −
                  </button>
                  <span className="inline-flex items-center justify-center w-10 h-8 rounded-md border bg-white text-center">
                    {it.qty}
                  </span>
                  <button
                    aria-label="plus"
                    onClick={() => onInc(it.id)}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-md border bg-white hover:bg-gray-50"
                  >
                    ＋
                  </button>

                  <span className="w-20 text-right tabular-nums">
                    ¥{(it.price * it.qty).toLocaleString()}
                  </span>

                  <button
                    onClick={() => onRemove(it.id)}
                    className="px-2 py-1 rounded-md border text-sm hover:bg-red-50 border-red-300 text-red-600"
                  >
                    取消
                  </button>
                </div>
              </li>
            ))}
            {items.length === 0 && (
              <li className="text-slate-500 text-sm px-1">まだ商品がありません</li>
            )}
          </ul>
        </div>

        {/* 合計＆確定 */}
        <div className="shrink-0 flex items-center gap-4">
          <div className="text-lg font-semibold whitespace-nowrap">
            合計: ¥{new Intl.NumberFormat("ja-JP").format(total)}
          </div>
          <button
            onClick={onSubmit}
            disabled={disabled}
            className="px-4 py-2 rounded-lg bg-black text-white font-semibold disabled:opacity-40 hover:bg-gray-800"
          >
            注文を確定
          </button>
        </div>
      </div>
    </div>
  );
}