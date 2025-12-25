import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeviceSelectButton } from "./DeviceSelectButton";

vi.mock("./DeviceStatusIndicator", async () => ({
  default: ({ isOnline }: any) => (
    <div data-testid="status">{isOnline ? "online" : "offline"}</div>
  ),
}));
vi.mock("./DeviceInfo", async () => ({
  default: ({ id }: any) => <div data-testid="info">{id}</div>,
}));

describe("pages/Dashboard/Components/Buttons/DeviceSelectButton.tsx", () => {
  it("calls onSelect and computes online status", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    vi.spyOn(Date, "now").mockReturnValue(
      new Date("2025-12-24T00:05:00Z").getTime()
    );

    render(
      <DeviceSelectButton
        id="dev-1"
        lastSeen="2025-12-24T00:04:30Z"
        active={false}
        onSelect={onSelect}
        title="t"
      />
    );

    expect(screen.getByTestId("status")).toHaveTextContent("online");
    await user.click(screen.getByRole("button"));
    expect(onSelect).toHaveBeenCalledWith("dev-1");
  });
});
