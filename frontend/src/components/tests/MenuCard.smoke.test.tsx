// src/components/tests/MenuCard.smoke.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import MenuCard from "../MenuCard";

beforeEach(() => {
  (globalThis.fetch as any) = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({}),
  });
});
afterEach(() => vi.resetAllMocks());

describe("MenuCard (smoke)", () => {
  it("名前だけでも表示できる", () => {
    const m = { id: 1, name: "かけうどん", price: 390, stock: 1 };
    render(<MenuCard m={m as any} />);
    expect(screen.getByText("かけうどん")).toBeInTheDocument();
  });
});