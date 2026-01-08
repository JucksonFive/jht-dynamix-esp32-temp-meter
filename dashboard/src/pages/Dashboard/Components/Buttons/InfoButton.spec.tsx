import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InfoButton } from "src/pages/Dashboard/Components/Buttons/InfoButton";

vi.mock("react-i18next", async () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

describe("pages/Dashboard/Components/Buttons/InfoButton.tsx", () => {
  it("uses translated default aria-label and calls onClick", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<InfoButton onClick={onClick} />);

    const btn = screen.getByRole("button", { name: "sidePanelSelectionHelp" });
    expect(btn).toHaveAttribute("title", "sidePanelSelectionHelp");
    await user.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("prefers explicit ariaLabel/title when provided", () => {
    render(<InfoButton ariaLabel="A" title="T" />);
    const btn = screen.getByRole("button", { name: "A" });
    expect(btn).toHaveAttribute("title", "T");
  });
});
