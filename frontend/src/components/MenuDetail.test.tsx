// src/components/MenuDetail.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import MenuDetail from "./MenuDetail";

// fetch を時系列でモックするユーティリティ
function queueFetch(...responses: Array<Response>) {
  let i = 0;
  vi.spyOn(global, "fetch").mockImplementation((_input: RequestInfo, _init?: RequestInit) => {
    const res = responses[i++];
    return Promise.resolve(res ?? new Response("Not Found", { status: 404 }));
  });
}

describe("MenuDetail", () => {
  it("post comment then reload list", async () => {
    // 1. 初回 GET（コメント0件）
    const firstGet = new Response(JSON.stringify([]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

    // 2. POST 成功
    const post = new Response(JSON.stringify({ id: 1, text: "hi", user: "anon" }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });

    // 3. 再GET（1件になっている）
    const secondGet = new Response(JSON.stringify([{ id: 1, text: "hi", user: "anon" }]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

    queueFetch(firstGet, post, secondGet);

    render(<MenuDetail menuId={1} onClose={() => {}} />);

    // 入力 → 送信
    fireEvent.change(screen.getByPlaceholderText("コメントを入力"), {
      target: { value: "hi" },
    });
    fireEvent.click(screen.getByText("送信"));

    // 再取得後に "hi" が一覧へ表示
    const item = await screen.findByText("hi");
    expect(item).toBeInTheDocument();
  });
});