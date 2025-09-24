import { render, screen } from "@testing-library/react";
import { TableProvider } from "../context/TableCtx";
import OrderPage from "./OrderPage";
import { it, expect, vi } from "vitest";

// API 層をモック（空配列を返す）
vi.mock("../api/menus", () => ({
  fetchMenus: vi.fn().mockResolvedValue([]),
}));

const renderWithProviders = (ui: React.ReactElement) =>
  render(<TableProvider>{ui}</TableProvider>);

it("起動時に読み込み表示→合計が表示される", async () => {
  renderWithProviders(<OrderPage />);
  expect(screen.getByText("読み込み中…")).toBeInTheDocument();
  expect(screen.getByText(/合計:/)).toBeInTheDocument();
});