import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AuthActions } from "src/pages/Login/Components/AuthActions";

vi.mock("react-i18next", async () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

describe("pages/Login/Components/AuthActions.tsx", () => {
  it("disables auth button when disabled=true and calls handlers", async () => {
    const user = userEvent.setup();
    const onAuth = vi.fn();
    const onToggleMode = vi.fn();

    const { rerender } = render(
      <AuthActions
        mode="signin"
        loading={false}
        error={null}
        disabled
        onAuth={onAuth}
        onToggleMode={onToggleMode}
      />
    );

    const primary = screen.getByRole("button", { name: "authSignIn" });
    expect(primary).toBeDisabled();

    rerender(
      <AuthActions
        mode="signin"
        loading
        error="x"
        disabled={false}
        onAuth={onAuth}
        onToggleMode={onToggleMode}
      />
    );

    const btn = screen.getByRole("button", { name: /authSigningInEllipsis/i });
    expect(btn).toHaveAttribute("aria-busy", "true");

    await user.click(screen.getByRole("button", { name: "authCreateAccount" }));
    expect(onToggleMode).toHaveBeenCalledTimes(1);
  });
});
