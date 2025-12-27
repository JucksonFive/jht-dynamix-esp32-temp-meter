import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppProvider, useAppContext } from "./AppContext";

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
      <button onClick={() => ctx.setSelectedDeviceIds(["a", "b"])}>
        setSel
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
      </AppProvider>
    );

    expect(screen.getByTestId("boot").textContent).toBe("true");

    await waitFor(() =>
      expect(screen.getByTestId("boot").textContent).toBe("false")
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
      </AppProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId("boot").textContent).toBe("false")
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
      </AppProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId("boot").textContent).toBe("false")
    );
    expect(screen.getByTestId("user").textContent).toBe("john");

    await user.click(screen.getByRole("button", { name: "logout" }));
    expect(signOut).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(screen.getByTestId("user").textContent).toBe("none")
    );
  });
});
