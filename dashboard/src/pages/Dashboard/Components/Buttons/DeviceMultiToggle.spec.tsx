import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DeviceMultiToggle from "./DeviceMultiToggle";

vi.mock("react-i18next", async () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

describe("pages/Dashboard/Components/Buttons/DeviceMultiToggle.tsx", () => {
  it("reflects active state and calls onToggle", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<DeviceMultiToggle active onToggle={onToggle} />);
    const cb = screen.getByRole("checkbox");
    expect(cb).toBeChecked();
    await user.click(cb);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
