// src/pages/BoardPage.test.tsx
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

import BoardPage from "./BoardPage";
import { ModeProvider } from "../context/ModeCtx";
import { ToastProvider } from "../components/ui/ToastProvider";

const renderWithProviders = (ui: React.ReactElement, initialPath = "/board") => {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <ModeProvider>
        <ToastProvider>{ui}</ToastProvider>
      </ModeProvider>
    </MemoryRouter>
  );
};

describe("BoardPage", () => {
  const originalFetch = global.fetch as any;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock as any;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("通常投稿は成功扱い", async () => {
    const user = userEvent.setup();

    // 初期GET -> 空
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify([]), { status: 200 })
    );
    // POST -> 成功
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 201 }));
    // 再GET -> 1件返る
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          { id: 1, title: "ok", body: "hello", author: "me", createdAt: Date.now() },
        ]),
        { status: 200 }
      )
    );

    renderWithProviders(
      <Routes>
        <Route path="/board" element={<BoardPage />} />
      </Routes>
    );

    await user.type(screen.getByPlaceholderText("タイトル"), "ok");
    await user.type(screen.getByPlaceholderText("本文"), "hello");
    await user.type(screen.getByPlaceholderText("投稿者"), "me");
    await user.click(screen.getByRole("button", { name: "投稿" }));

    // 再取得後の表示
    await screen.findByText("ok");

    // 初期GET・POST・再GETの最低3回
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("NG投稿はエラー表示", async () => {
    const user = userEvent.setup();

    // 初期GET -> 空
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify([]), { status: 200 })
    );
    // POST -> 400
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 400 }));

    renderWithProviders(
      <Routes>
        <Route path="/board" element={<BoardPage />} />
      </Routes>
    );

    await user.type(screen.getByPlaceholderText("タイトル"), "bad");
    await user.type(screen.getByPlaceholderText("本文"), "kill you");
    await user.type(screen.getByPlaceholderText("投稿者"), "x");
    await user.click(screen.getByRole("button", { name: "投稿" }));

    // UI 側のエラー表示（英語メッセ含め広めに拾う）
    await waitFor(() => {
      expect(
        screen.getByText(/Request failed|NG|エラー|不正|失敗|投稿に失敗/i)
      ).toBeInTheDocument();
    });

    // 初期GET + 失敗POST の最低2回
    expect(fetchMock).toHaveBeenCalledTimes(2);

    // リストは空のまま
    expect(screen.getByText("投稿はまだありません")).toBeInTheDocument();
  });
});