import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ToggleAuthModeButton } from "src/pages/Login/Components/Buttons/ToggleAuthModeButton";

vi.mock("react-i18next", async () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

describe("pages/Login/Components/Buttons/ToggleAuthModeButton.tsx", () => {
  it("shows correct text per mode and calls onToggleMode", async () => {
    const user = userEvent.setup();
    const onToggleMode = vi.fn();

    const { rerender } = render(
      <ToggleAuthModeButton mode="signin" onToggleMode={onToggleMode} />
    );
    expect(
      screen.getByRole("button", { name: "authCreateAccount" })
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button"));
    expect(onToggleMode).toHaveBeenCalledTimes(1);

    rerender(
      <ToggleAuthModeButton mode="signup" onToggleMode={onToggleMode} />
    );
    expect(
      screen.getByRole("button", { name: "authAlreadyAccount" })
    ).toBeInTheDocument();
  });
});
