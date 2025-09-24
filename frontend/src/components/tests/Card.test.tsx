// src/components/tests/Card.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Card } from "@/components/ui/card";

describe("Card", () => {
  it("子要素を描画する", () => {
    render(<Card>本文です</Card>);

    const body = screen.getByText("本文です");
    expect(body).toBeInTheDocument();
  });
});