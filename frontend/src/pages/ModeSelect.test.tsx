import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import ModeSelect from "./ModeSelect";
import { ModeProvider } from "../context/ModeCtx";

function PathnameProbe() {
  const loc = useLocation();
  return <div data-testid="pathname">{loc.pathname}</div>;
}

function AppRoutes() {
 
  return (
    <Routes>
      <Route path="/mode" element={<ModeSelect />} />
      <Route path="/menu-admin" element={<div>ADMIN PAGE</div>} />
      <Route path="/order" element={<div>ORDER PAGE</div>} />
    </Routes>
  );
}

describe("モード選択と遷移", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.stubGlobal("alert", vi.fn()); // jsdom not implemented を回避
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("従業員モード（パス一致）→ /menu-admin", async () => {
    const pass = (import.meta as any)?.env?.VITE_STAFF_PASS ?? "admin";
    const promptSpy = vi.spyOn(window, "prompt").mockReturnValue(pass);

    render(
      <ModeProvider>
        <MemoryRouter initialEntries={["/mode"]}>
          <AppRoutes />
          <PathnameProbe />
        </MemoryRouter>
      </ModeProvider>
    );

    await user.click(screen.getByRole("button", { name: "従業員モード" }));
    expect(promptSpy).toHaveBeenCalled();

    await waitFor(() => {
      expect(screen.getByTestId("pathname").textContent).toBe("/menu-admin");
    });
  });

  it("お客様モード → /order", async () => {
    render(
      <ModeProvider>
        <MemoryRouter initialEntries={["/mode"]}>
          <AppRoutes />
          <PathnameProbe />
        </MemoryRouter>
      </ModeProvider>
    );

    await user.click(screen.getByRole("button", { name: "お客様モード" }));

    await waitFor(() => {
      expect(screen.getByTestId("pathname").textContent).toBe("/order");
    });
  });
});