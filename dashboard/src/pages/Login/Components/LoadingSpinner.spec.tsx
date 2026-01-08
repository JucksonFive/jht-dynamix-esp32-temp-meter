import { render, screen } from "@testing-library/react";
import { LoadingSpinner } from "src/pages/Login/Components/LoadingSpinner";

describe("pages/Login/Components/LoadingSpinner.tsx", () => {
  it("renders status role and sr-only label", () => {
    render(<LoadingSpinner label="Please wait" />);
    expect(
      screen.getByRole("status", { name: "Please wait" })
    ).toBeInTheDocument();
    expect(screen.getByText("Please wait")).toBeInTheDocument();
  });
});
