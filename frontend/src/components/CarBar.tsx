import React from "react";

type Props = {
  total: number;
  disabled: boolean;
  onSubmit: () => void;
};

export default function CartBar({ total, disabled, onSubmit }: Props) {
  return (
    <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t shadow-lg p-4 flex justify-between items-center">
      <div className="text-lg font-bold">合計: ¥{total.toLocaleString()}</div>
      <button
        disabled={disabled}
        onClick={onSubmit}
        className="px-5 py-2 rounded-lg bg-black text-white font-semibold shadow
                   disabled:opacity-40 hover:bg-gray-800"
      >
        注文を確定
      </button>
    </div>
  );
}