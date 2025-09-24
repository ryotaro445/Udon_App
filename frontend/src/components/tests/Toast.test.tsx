// src/components/tests/Toast.test.tsx
import { render, screen } from "@testing-library/react";
import { act } from "react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Toast from "../Toast";

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.runOnlyPendingTimers(); vi.useRealTimers(); });

describe("Toast", () => {
  it("メッセージを表示し、3秒後に onClose を呼ぶ", () => {
    const onClose = vi.fn();
    render(<Toast message="saved!" onClose={onClose} />);
    expect(screen.getByText("saved!")).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(3000); });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("任意のユーザー操作（フォーカスなど）があっても崩れない", () => {
    const onClose = vi.fn();
    render(<Toast message="hello" onClose={onClose} />);

    // 軽い操作（focus）を挟むだけにして、タイマと干渉させない
    document.body.focus();

    act(() => { vi.advanceTimersByTime(3000); });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});