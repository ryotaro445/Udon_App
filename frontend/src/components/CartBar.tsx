// src/components/CartBar.tsx
import React from "react";

export default function CartBar({
  total,
  disabled,
  onSubmit,
}: {
  total: number;
  disabled: boolean;
  onSubmit: () => void;
}) {
  return (
    <div className="sticky bottom-0 left-0 right-0 bg-white border-t px-4 py-3 flex items-center gap-4">
      <div className="text-lg font-semibold">
        合計: ¥{new Intl.NumberFormat("ja-JP").format(total)}
      </div>
      <button
        onClick={onSubmit}
        disabled={disabled}
        className="ml-auto px-4 py-2 rounded-lg bg-black text-white font-semibold disabled:opacity-40 hover:bg-gray-800"
      >
        注文を確定
      </button>
    </div>
  );
}