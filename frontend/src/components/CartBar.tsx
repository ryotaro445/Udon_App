import React from "react";

type ItemRow = {
  menuId: number;
  name: string;
  price: number;
  qty: number;
};

export default function CartBar({
  total,
  disabled,
  items,
  onSubmit,
  onInc,
  onDec,
  onRemove,
}: {
  total: number;
  disabled: boolean;
  items: ItemRow[];
  onSubmit: () => void;
  onInc: (menuId: number) => void;
  onDec: (menuId: number) => void;
  onRemove: (menuId: number) => void;
}) {
  return (
    <div className="sticky bottom-0 left-0 right-0 bg-white border-t px-4 py-3 [writing-mode:horizontal-tb]">
      <div className="flex items-start gap-6">
        {/* 注文一覧（横スクロール） */}
        <div className="flex-1 min-w-0 overflow-x-auto">
          <div className="flex gap-3">
            {items.map((it) => (
              <div
                key={it.menuId}
                className="shrink-0 rounded-xl border px-3 py-2 bg-white"
              >
                {/* 1行を安定レイアウトにするため inline-flex */}
                <div className="inline-flex items-center gap-3">
                  <div className="font-medium max-w-[7.5rem] truncate">
                    {it.name}
                  </div>

                  {/* 数量コントロール（高さ/幅を統一） */}
                  <div className="inline-flex items-center gap-1">
                    <button
                      onClick={() => onDec(it.menuId)}
                      className="w-8 h-8 rounded-md border grid place-items-center hover:bg-gray-50"
                      aria-label="decrement"
                    >
                      －
                    </button>
                    <div className="w-10 h-8 rounded-md border grid place-items-center text-sm select-none">
                      {it.qty}
                    </div>
                    <button
                      onClick={() => onInc(it.menuId)}
                      className="w-8 h-8 rounded-md border grid place-items-center hover:bg-gray-50"
                      aria-label="increment"
                    >
                      ＋
                    </button>
                  </div>

                  <div className="text-sm text-slate-600 tabular-nums">
                    ¥{(it.price * it.qty).toLocaleString()}
                  </div>

                  <button
                    onClick={() => onRemove(it.menuId)}
                    className="text-sm px-2 py-1 rounded-md border hover:bg-gray-50"
                  >
                    取消
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 合計＆確定 */}
        <div className="flex items-center gap-4">
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