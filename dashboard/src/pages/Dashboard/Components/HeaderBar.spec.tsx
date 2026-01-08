import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { HeaderBar } from "src/pages/Dashboard/Components/HeaderBar";

vi.mock("react-i18next", async () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

describe("pages/Dashboard/Components/HeaderBar.tsx", () => {
  it("renders title, actionsRight, and logout button", async () => {
    const user = userEvent.setup();
    const onLogout = vi.fn();

    render(<HeaderBar onLogout={onLogout} actionsRight={<div>R</div>} />);
    expect(
      screen.getByRole("heading", { name: "appTitle" })
    ).toBeInTheDocument();
    expect(screen.getByText("R")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "logout" }));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
