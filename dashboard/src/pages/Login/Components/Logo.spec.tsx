import { render, screen } from "@testing-library/react";
import { Logo } from "src/pages/Login/Components/Logo";

describe("pages/Login/Components/Logo.tsx", () => {
  it("renders an accessible svg logo", () => {
    render(<Logo size={64} title="My Logo" text="X" />);
    expect(screen.getByRole("img", { name: "My Logo" })).toBeInTheDocument();
    expect(screen.getByText("X")).toBeInTheDocument();
  });
});
