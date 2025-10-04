// src/components/CartBar.tsx
import React from "react";

export type CartLine = {
  menuId: number;
  name: string;
  price: number;
  qty: number;
  maxQty?: number; // 在庫上限（未指定なら∞）
};

export default function CartBar({
  lines,
  total,
  disabled,
  onSubmit,
  onInc,
  onDec,
  onRemove,
}: {
  lines: CartLine[];
  total: number;
  disabled: boolean;
  onSubmit: () => void;
  onInc: (menuId: number) => void;
  onDec: (menuId: number) => void;
  onRemove: (menuId: number) => void;
}) {
  return (
    <div className="sticky bottom-0 left-0 right-0 z-40 border-t bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-4">
        {/* 注文リスト */}
        <div className="min-w-0 flex-1">
          {lines.length === 0 ? (
            <div className="text-sm text-slate-500">カートは空です</div>
          ) : (
            <ul className="flex flex-wrap gap-2 max-h-28 overflow-y-auto pr-2">
              {lines.map((l) => {
                const limit = Number.isFinite(l.maxQty ?? Infinity)
                  ? (l.maxQty as number)
                  : Infinity;
                const plusDisabled = l.qty >= limit;
                const minusDisabled = l.qty <= 0;
                return (
                  <li
                    key={l.menuId}
                    className="flex items-center gap-2 rounded-lg border px-2 py-1 text-sm bg-white"
                  >
                    <span className="font-medium truncate max-w-[12rem]" title={l.name}>
                      {l.name}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onDec(l.menuId)}
                        disabled={minusDisabled}
                        className="w-7 h-7 grid place-items-center rounded-md border bg-white disabled:opacity-40 hover:bg-gray-50"
                        aria-label={`${l.name} を1減らす`}
                      >
                        −
                      </button>
                      <span className="min-w-[24px] text-center">{l.qty}</span>
                      <button
                        onClick={() => onInc(l.menuId)}
                        disabled={plusDisabled}
                        className="w-7 h-7 grid place-items-center rounded-md border bg-white disabled:opacity-40 hover:bg-gray-50"
                        aria-label={`${l.name} を1増やす`}
                      >
                        ＋
                      </button>
                    </div>
                    <span className="text-slate-500">
                      ¥{(l.price * l.qty).toLocaleString()}
                    </span>
                    <button
                      onClick={() => onRemove(l.menuId)}
                      className="ml-1 rounded-md border px-2 py-0.5 text-xs hover:bg-slate-50"
                      aria-label={`${l.name} を取り消す`}
                    >
                      取消
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* 合計と確定 */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-sm font-semibold">
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