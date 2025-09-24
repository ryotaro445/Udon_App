import { Routes, Route } from "react-router-dom";
import { renderWithProviders } from "../tests/testUtils";
import { screen } from "@testing-library/react";
import ModeSelect from "./ModeSelect";
import ProtectedRoute from "./ProtectedRoute";

function Dummy({ text }: { text: string }) {
  return <h2>{text}</h2>;
}

describe("ProtectedRoute", () => {
  test("未選択は /mode にリダイレクト", async () => {
    renderWithProviders(
      <Routes>
        <Route path="/mode" element={<ModeSelect />} />
        <Route element={<ProtectedRoute allow={["staff"]} />}>
          <Route path="/menu-admin" element={<Dummy text="ADMIN PAGE" />} />
        </Route>
      </Routes>,
      { router: { initialEntries: ["/menu-admin"] } }
    );
    expect(await screen.findByText("利用モードを選択")).toBeInTheDocument();
  });
});