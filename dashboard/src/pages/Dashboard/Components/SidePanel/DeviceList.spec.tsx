import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DeviceList } from "src/pages/Dashboard/Components/SidePanel/DeviceList";

vi.mock("react-i18next", async () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

vi.mock("../Buttons/DeviceSelectButton", async () => ({
  DeviceSelectButton: (props: any) => (
    <button onClick={() => props.onSelect(props.id)}>{props.id}</button>
  ),
}));
vi.mock("../Buttons/DeviceMultiToggle", async () => ({
  default: (props: any) => <button onClick={props.onToggle}>toggle</button>,
}));
vi.mock("../Buttons/DeleteDeviceButton", async () => ({
  default: (props: any) => (
    <button onClick={() => props.onDeleted(props.deviceId)}>delete</button>
  ),
}));

describe("pages/Dashboard/Components/SidePanel/DeviceList.tsx", () => {
  it("shows noDevices when empty", () => {
    render(
      <DeviceList
        devices={[]}
        selectedDeviceIds={[]}
        onSelectSingle={() => {}}
        onToggleMulti={() => {}}
        onDeviceDeleted={() => {}}
      />
    );
    expect(screen.getByText("noDevices")).toBeInTheDocument();
  });

  it("wires selection, toggle, and delete handlers", async () => {
    const user = userEvent.setup();
    const onSelectSingle = vi.fn();
    const onToggleMulti = vi.fn();
    const onDeviceDeleted = vi.fn();

    render(
      <DeviceList
        devices={[
          { deviceId: "a", userId: "u", createdAt: "c", updatedAt: "u" },
        ]}
        selectedDeviceIds={[]}
        onSelectSingle={onSelectSingle}
        onToggleMulti={onToggleMulti}
        onDeviceDeleted={onDeviceDeleted}
      />
    );

    await user.click(screen.getByRole("button", { name: "a" }));
    expect(onSelectSingle).toHaveBeenCalledWith("a");
    await user.click(screen.getByRole("button", { name: "toggle" }));
    expect(onToggleMulti).toHaveBeenCalledWith("a");
    await user.click(screen.getByRole("button", { name: "delete" }));
    expect(onDeviceDeleted).toHaveBeenCalledWith("a");
  });
});
