// src/tests/testUtils.tsx
import { ReactNode } from "react";
import { render } from "@testing-library/react";
import { MemoryRouter, type MemoryRouterProps } from "react-router-dom";

// ここを修正（../ にする）
import { TableProvider } from "../context/TableCtx";
import { ModeProvider } from "../context/ModeCtx";
import { ToastProvider } from "../components/ui/ToastProvider";

export function renderWithProviders(
  ui: ReactNode,
  opts?: { router?: MemoryRouterProps }
) {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter {...(opts?.router || {})}>
      <ToastProvider>
        <ModeProvider>
          <TableProvider>{children}</TableProvider>
        </ModeProvider>
      </ToastProvider>
    </MemoryRouter>
  );
  return render(<Wrapper>{ui}</Wrapper>);
}