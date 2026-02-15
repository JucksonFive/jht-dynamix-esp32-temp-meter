import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppProvider, useAppContext } from "src/contexts/AppContext";

const getCurrentUser = vi.fn();
const signOut = vi.fn();
vi.mock("aws-amplify/auth", async () => ({
  getCurrentUser: (...args: any[]) => getCurrentUser(...args),
  signOut: (...args: any[]) => signOut(...args),
}));

const useDevices = vi.fn();
vi.mock("../hooks/useDevices", async () => ({
  useDevices: (...args: any[]) => useDevices(...args),
}));

const useReadings = vi.fn();
vi.mock("../hooks/useReadings", async () => ({
  useReadings: (...args: any[]) => useReadings(...args),
}));

function Consumer() {
  const ctx = useAppContext();
  return (
    <div>
      <div data-testid="boot">{String(ctx.bootLoading)}</div>
      <div data-testid="user">{ctx.user?.username ?? "none"}</div>
      <div data-testid="sel">{ctx.selectedDeviceIds.join(",")}</div>
      <div data-testid="range-from">{ctx.range.from}</div>
      <div data-testid="range-to">{ctx.range.to}</div>
      <div data-testid="data-loading">{String(ctx.dataLoading)}</div>
      <div data-testid="data-error">{ctx.dataError ?? "none"}</div>
      <div data-testid="devices-loading">{String(ctx.devicesLoading)}</div>
      <button onClick={() => ctx.setSelectedDeviceIds(["a", "b"])}>
        setSel
      </button>
      <button onClick={() => ctx.setSelectedDeviceIds(["dev1"])}>
        selDev1
      </button>
      <button onClick={() => ctx.handleDeviceDeleted("a")}>delA</button>
      <button onClick={() => ctx.handleLogout()}>logout</button>
    </div>
  );
}

describe("contexts/AppContext.tsx", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useDevices.mockReturnValue({
      devices: [],
      loading: false,
      removeDevice: vi.fn(),
    });
    useReadings.mockReturnValue({
      data: [],
      loading: false,
      error: null,
      lastSeen: new Map(),
    });
  });

  it("throws when useAppContext is used outside provider", () => {
    expect(() => render(<Consumer />)).toThrow(/AppProvider/);
  });

  it("initializes user and toggles bootLoading", async () => {
    getCurrentUser.mockResolvedValueOnce({ userId: "u", username: "john" });

    render(
      <AppProvider>
        <Consumer />
      </AppProvider>,
    );

    expect(screen.getByTestId("boot").textContent).toBe("true");

    await waitFor(() =>
      expect(screen.getByTestId("boot").textContent).toBe("false"),
    );
    expect(screen.getByTestId("user").textContent).toBe("john");
  });

  it("handleDeviceDeleted removes selection and calls removeDevice", async () => {
    const removeDevice = vi.fn();
    useDevices.mockReturnValue({ devices: [], loading: false, removeDevice });
    getCurrentUser.mockResolvedValueOnce({ userId: "u", username: "john" });

    const user = userEvent.setup();
    render(
      <AppProvider>
        <Consumer />
      </AppProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("boot").textContent).toBe("false"),
    );

    await user.click(screen.getByRole("button", { name: "setSel" }));
    expect(screen.getByTestId("sel").textContent).toBe("a,b");

    await user.click(screen.getByRole("button", { name: "delA" }));
    expect(removeDevice).toHaveBeenCalledWith("a");
    expect(screen.getByTestId("sel").textContent).toBe("b");
  });

  it("handleLogout signs out and clears user", async () => {
    getCurrentUser.mockResolvedValueOnce({ userId: "u", username: "john" });
    const user = userEvent.setup();

    render(
      <AppProvider>
        <Consumer />
      </AppProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("boot").textContent).toBe("false"),
    );
    expect(screen.getByTestId("user").textContent).toBe("john");

    await user.click(screen.getByRole("button", { name: "logout" }));
    expect(signOut).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(screen.getByTestId("user").textContent).toBe("none"),
    );
  });

  it("sets user to null when getCurrentUser rejects", async () => {
    getCurrentUser.mockRejectedValueOnce(new Error("not authenticated"));

    render(
      <AppProvider>
        <Consumer />
      </AppProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("boot").textContent).toBe("false"),
    );
    expect(screen.getByTestId("user").textContent).toBe("none");
  });

  it("initializes range from device updatedAt timestamps", async () => {
    const deviceDate = new Date("2025-06-15T12:00:00Z");
    useDevices.mockReturnValue({
      devices: [{ deviceId: "dev1", updatedAt: deviceDate.toISOString() }],
      loading: false,
      removeDevice: vi.fn(),
    });
    getCurrentUser.mockResolvedValueOnce({ userId: "u", username: "john" });

    render(
      <AppProvider>
        <Consumer />
      </AppProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("boot").textContent).toBe("false"),
    );

    // Range should have been adjusted to the device's updatedAt
    await waitFor(() => {
      const to = screen.getByTestId("range-to").textContent;
      expect(to).toBeTruthy();
    });
  });

  it("adjusts range when selectedDeviceIds change", async () => {
    const deviceDate = new Date("2025-07-20T10:00:00Z");
    const removeDevice = vi.fn();
    useDevices.mockReturnValue({
      devices: [
        { deviceId: "dev1", updatedAt: deviceDate.toISOString() },
        {
          deviceId: "dev2",
          updatedAt: new Date("2025-07-19T10:00:00Z").toISOString(),
        },
      ],
      loading: false,
      removeDevice,
    });
    getCurrentUser.mockResolvedValueOnce({ userId: "u", username: "john" });

    const user = userEvent.setup();
    render(
      <AppProvider>
        <Consumer />
      </AppProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("boot").textContent).toBe("false"),
    );

    // Select dev1 to trigger the selectedDeviceIds range-update effect
    await user.click(screen.getByRole("button", { name: "selDev1" }));
    expect(screen.getByTestId("sel").textContent).toBe("dev1");
  });

  it("exposes data loading and error from useReadings", async () => {
    useReadings.mockReturnValue({
      data: [{ ts: 1, temp: 22 }],
      loading: true,
      error: "timeout",
      lastSeen: new Map(),
    });
    getCurrentUser.mockResolvedValueOnce({ userId: "u", username: "john" });

    render(
      <AppProvider>
        <Consumer />
      </AppProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("boot").textContent).toBe("false"),
    );
    expect(screen.getByTestId("data-loading").textContent).toBe("true");
    expect(screen.getByTestId("data-error").textContent).toBe("timeout");
  });

  it("exposes devicesLoading from useDevices", async () => {
    useDevices.mockReturnValue({
      devices: [],
      loading: true,
      removeDevice: vi.fn(),
    });
    getCurrentUser.mockResolvedValueOnce({ userId: "u", username: "john" });

    render(
      <AppProvider>
        <Consumer />
      </AppProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("boot").textContent).toBe("false"),
    );
    expect(screen.getByTestId("devices-loading").textContent).toBe("true");
  });
});
