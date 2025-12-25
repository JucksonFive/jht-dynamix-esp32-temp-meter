import { render, screen } from "@testing-library/react";

import { AuthButtonContent } from "./AuthButtonContent";

vi.mock("react-i18next", async () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

describe("pages/Login/Components/Buttons/AuthButtonContent.tsx", () => {
  it("shows sign-in text when not loading", () => {
    render(<AuthButtonContent mode="signin" loading={false} />);
    expect(screen.getByText("authSignIn")).toBeInTheDocument();
  });

  it("shows spinner and ellipsis when loading", () => {
    render(<AuthButtonContent mode="signup" loading />);
    expect(
      screen.getByRole("status", { name: "authSigningUp" })
    ).toBeInTheDocument();
    expect(screen.getByText("authSigningUpEllipsis")).toBeInTheDocument();
  });
});
