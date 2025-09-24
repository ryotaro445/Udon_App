// src/components/MenuCard.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import MenuCard from "./MenuCard";

describe("MenuCard", () => {
  it("plus ボタンで onAdd が呼ばれる", async () => {
    const m = { id: 1, name: "かけ", price: 390, stock: 10 };
    const onAdd = vi.fn();

    render(<MenuCard m={m as any} onAdd={onAdd as any} />);

    // 現在のUIは「いいね」ではなく「＋」ボタン（aria-label="plus"）
    const btn = await screen.findByRole("button", { name: /plus|＋|\+/i });
    fireEvent.click(btn);

    expect(onAdd).toHaveBeenCalled();
    // token も内部で生成される想定なので、第2引数に渡る
    const callArgs = onAdd.mock.calls[0];
    expect(callArgs?.[0]).toBe(1);             // id
    expect(typeof callArgs?.[1]).toBe("string"); // token
  });
});