// src/components/MenuCard.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import MenuCard from "./MenuCard";

describe("MenuCard", () => {
  it("plus ボタンで onAdd が呼ばれる", async () => {
    const m = { id: 1, name: "かけ", price: 390, stock: 10 };
    const onAdd = vi.fn();

    render(<MenuCard m={m as any} onAdd={onAdd as any} />);

    
    const btn = await screen.findByRole("button", { name: /plus|＋|\+/i });
    fireEvent.click(btn);

    expect(onAdd).toHaveBeenCalled();
    
    const callArgs = onAdd.mock.calls[0];
    expect(callArgs?.[0]).toBe(1);             
    expect(typeof callArgs?.[1]).toBe("string"); 
  });
});