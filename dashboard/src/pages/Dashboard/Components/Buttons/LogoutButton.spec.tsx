import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LogoutButton } from "./LogoutButton";

vi.mock("react-i18next", async () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

describe("pages/Dashboard/Components/Buttons/LogoutButton.tsx", () => {
  it("renders translated label and calls onLogout", async () => {
    const user = userEvent.setup();
    const onLogout = vi.fn();
    render(<LogoutButton onLogout={onLogout} />);
    await user.click(screen.getByRole("button", { name: "logout" }));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
