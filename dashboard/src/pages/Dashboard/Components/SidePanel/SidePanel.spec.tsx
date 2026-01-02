import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SidePanel } from "./SidePanel";

vi.mock("react-i18next", async () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

let selection: string[] = [];
const setSelectedDeviceIds = vi.fn((updater: any) => {
  if (typeof updater === "function") selection = updater(selection);
  else selection = updater;
});

vi.mock("../../../../contexts/AppContext", async () => ({
  useAppContext: () => ({
    devices: [
      { deviceId: "a", userId: "u", createdAt: "c", updatedAt: "u" },
      { deviceId: "b", userId: "u", createdAt: "c", updatedAt: "u" },
    ],
    selectedDeviceIds: selection,
    setSelectedDeviceIds,
    handleDeviceDeleted: vi.fn(),
    lastSeen: new Map(),
    latestTemperatures: new Map(),
  }),
}));

vi.mock("../Buttons/SelectAllDevicesButton", async () => ({
  default: (props: any) => (
    <div>
      <button onClick={props.onSelectAll}>selectAll</button>
      <button onClick={props.onUnselectAll}>unselectAll</button>
    </div>
  ),
}));
vi.mock("./DeviceList", async () => ({
  DeviceList: () => <div data-testid="list" />,
}));
vi.mock("./SidePanelHeader", async () => ({
  SidePanelHeader: () => <div data-testid="hdr" />,
}));

describe("pages/Dashboard/Components/SidePanel/SidePanel.tsx", () => {
  beforeEach(() => {
    selection = [];
    setSelectedDeviceIds.mockClear();
  });

  it("selects all and unselects all via handlers", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<SidePanel />);

    await user.click(screen.getByRole("button", { name: "selectAll" }));
    expect(selection.sort()).toEqual(["a", "b"]);

    // Re-render so mocked context values update and handlers
    // see the latest selectedDeviceIds.
    rerender(<SidePanel />);

    await user.click(screen.getByRole("button", { name: "unselectAll" }));
    expect(selection).toEqual([]);
  });
});
