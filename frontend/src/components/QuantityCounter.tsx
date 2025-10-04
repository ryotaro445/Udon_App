import React from "react";

type Props = {
  qty: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
};

export default function QuantityCounter({ qty, onChange, min = 0, max = Infinity }: Props) {
  const dec = () => { if (qty > min) onChange(qty - 1); };
  const inc = () => { if (qty < max) onChange(qty + 1); };

  return (
    <div className="flex items-center gap-2">
      <button
        aria-label="minus"
        onClick={dec}
        disabled={qty <= min}
        className="w-9 h-9 flex items-center justify-center rounded-md border bg-white text-xl
                   disabled:opacity-40 hover:bg-gray-50"
      >
        −
      </button>
      <span className="w-10 text-center tabular-nums">{qty}</span>
      <button
        aria-label="plus"
        onClick={inc}
        disabled={qty >= max}
        className="w-9 h-9 flex items-center justify-center rounded-md border bg-white text-xl
                   disabled:opacity-40 hover:bg-gray-50"
      >
        ＋
      </button>
    </div>
  );
}