// src/components/CartBar.tsx
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
    <div className="sticky bottom-0 left-0 right-0 bg-white border-t px-2 sm:px-4 py-3 pb-[max(theme(spacing.3),env(safe-area-inset-bottom))]">
      {/* モバイルは full-width（max幅制限なし）／SM以上は中央寄せ */}
      <div className="w-full sm:max-w-6xl sm:mx-auto flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
        {/* 明細リスト */}
        <div className="flex-1 min-w-0">
          <ul className="max-h-56 overflow-auto space-y-2 pr-1 sm:pr-2">
            {items.map((it) => (
              <li
                key={it.id}
                className="flex items-center gap-2 sm:gap-3 rounded-lg border px-3 py-2 bg-slate-50"
              >
                {/* モバイルは折り返して全文見せる／SM以上は省略 */}
                <div className="break-words sm:truncate">{it.name}</div>

                <div className="ml-auto flex items-center gap-1 sm:gap-2">
                  <button
                    aria-label="minus"
                    onClick={() => onDec(it.id)}
                    className="inline-flex items-center justify-center w-9 h-9 sm:w-8 sm:h-8 rounded-md border bg-white hover:bg-gray-50"
                  >
                    −
                  </button>
                  <span className="inline-flex items-center justify-center w-10 h-9 sm:h-8 rounded-md border bg-white text-center">
                    {it.qty}
                  </span>
                  <button
                    aria-label="plus"
                    onClick={() => onInc(it.id)}
                    className="inline-flex items-center justify-center w-9 h-9 sm:w-8 sm:h-8 rounded-md border bg-white hover:bg-gray-50"
                  >
                    ＋
                  </button>

                  {/* 料金と＋の間のスペースを圧縮（幅も少しだけ細く） */}
                  <span className="w-16 sm:w-20 text-right tabular-nums">
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

        {/* 合計＆確定：モバイルはボタン→合計の縦並び */}
        <div className="shrink-0 flex flex-col-reverse gap-2 w-full sm:w-auto sm:flex-row sm:items-center sm:gap-4">
          <div className="text-lg font-semibold whitespace-nowrap text-right sm:text-left">
            合計: ¥{new Intl.NumberFormat("ja-JP").format(total)}
          </div>
          <button
            onClick={onSubmit}
            disabled={disabled}
            className="px-4 py-2 rounded-lg bg-black text-white font-semibold disabled:opacity-40 hover:bg-gray-800 w-full sm:w-auto"
          >
            注文を確定
          </button>
        </div>
      </div>
    </div>
  );
}