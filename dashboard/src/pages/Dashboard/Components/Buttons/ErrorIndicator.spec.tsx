import { render, screen } from "@testing-library/react";
import ErrorIndicator from "src/pages/Dashboard/Components/Buttons/ErrorIndicator";

describe("pages/Dashboard/Components/Buttons/ErrorIndicator.tsx", () => {
  it("renders role=img with title", () => {
    render(<ErrorIndicator title="Boom" size={20} />);
    expect(screen.getByRole("img", { name: "Boom" })).toBeInTheDocument();
  });
});
