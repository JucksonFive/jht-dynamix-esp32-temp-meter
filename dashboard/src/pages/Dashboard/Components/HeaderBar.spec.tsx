import { render, screen } from "@testing-library/react";

import { HeaderBar } from "src/pages/Dashboard/Components/HeaderBar";

vi.mock("react-i18next", async () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

describe("pages/Dashboard/Components/HeaderBar.tsx", () => {
  it("renders title and actionsRight", () => {
    render(<HeaderBar actionsRight={<div>R</div>} />);
    expect(
      screen.getByRole("heading", { name: "appTitle" }),
    ).toBeInTheDocument();
    expect(screen.getByText("R")).toBeInTheDocument();
  });

  it("hides actions container when actionsRight is not provided", () => {
    render(<HeaderBar />);
    expect(
      screen.getByRole("heading", { name: "appTitle" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("R")).not.toBeInTheDocument();
  });
});
