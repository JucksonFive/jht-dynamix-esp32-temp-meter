import { render, screen } from "@testing-library/react";

import { SidePanelHeader } from "src/pages/Dashboard/Components/SidePanel/SidePanelHeader";

vi.mock("../Buttons/InfoButton", async () => ({
  InfoButton: () => <div data-testid="info" />,
}));

describe("pages/Dashboard/Components/SidePanel/SidePanelHeader.tsx", () => {
  it("renders title and info button", () => {
    render(<SidePanelHeader title="Devices" />);
    expect(
      screen.getByRole("heading", { name: "Devices" })
    ).toBeInTheDocument();
    expect(screen.getByTestId("info")).toBeInTheDocument();
  });
});
