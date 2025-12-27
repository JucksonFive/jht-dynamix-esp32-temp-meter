import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SelectAllDevicesButton } from "./SelectAllDevicesButton";

vi.mock("react-i18next", async () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

describe("pages/Dashboard/Components/Buttons/SelectAllDevicesButton.tsx", () => {
  it("calls onSelectAll when not all selected", async () => {
    const user = userEvent.setup();
    const onSelectAll = vi.fn();
    const onUnselectAll = vi.fn();
    render(
      <SelectAllDevicesButton
        total={3}
        selected={0}
        onSelectAll={onSelectAll}
        onUnselectAll={onUnselectAll}
      />
    );

    expect(screen.getByText("selectAll")).toBeInTheDocument();
    await user.click(screen.getByRole("button"));
    expect(onSelectAll).toHaveBeenCalledTimes(1);
    expect(onUnselectAll).not.toHaveBeenCalled();
  });

  it("calls onUnselectAll when all selected and shows all icon", async () => {
    const user = userEvent.setup();
    const onSelectAll = vi.fn();
    const onUnselectAll = vi.fn();
    render(
      <SelectAllDevicesButton
        total={2}
        selected={2}
        onSelectAll={onSelectAll}
        onUnselectAll={onUnselectAll}
      />
    );

    expect(screen.getByText("unselectAll")).toBeInTheDocument();
    expect(screen.getByAltText("all")).toBeInTheDocument();
    await user.click(screen.getByRole("button"));
    expect(onUnselectAll).toHaveBeenCalledTimes(1);
  });

  it("shows partial icon when indeterminate", () => {
    render(
      <SelectAllDevicesButton
        total={3}
        selected={1}
        onSelectAll={() => {}}
        onUnselectAll={() => {}}
      />
    );
    expect(screen.getByAltText("partial")).toBeInTheDocument();
  });
});
