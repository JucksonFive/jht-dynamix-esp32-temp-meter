import { act, renderHook, waitFor } from "@testing-library/react";
import { useDevices } from "./useDevices";

vi.mock("react-i18next", async () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

const fetchUserDevices = vi.fn();
vi.mock("../services/api", async () => ({
  fetchUserDevices: (...args: any[]) => fetchUserDevices(...args),
}));

vi.mock("axios", async () => ({
  default: {
    isCancel: (e: any) => Boolean(e?.__CANCEL__),
  },
}));

describe("hooks/useDevices.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty devices and loading=false when user is null", async () => {
    const { result } = renderHook(() => useDevices(null));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.devices).toEqual([]);
  });

  it("fetches devices when user is present", async () => {
    fetchUserDevices.mockResolvedValue([
      {
        deviceId: "d1",
        userId: "u",
        createdAt: "c",
        updatedAt: "u",
      },
    ]);

    const user = { userId: "u" };

    const { result } = renderHook(() => useDevices(user));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // React StrictMode / test environment can trigger effects more than once.
    expect(fetchUserDevices).toHaveBeenCalled();
    expect(result.current.devices.map((d) => d.deviceId)).toEqual(["d1"]);
    expect(result.current.error).toBeNull();
  });

  it("sets translated error on fetch failure (non-cancel)", async () => {
    fetchUserDevices.mockRejectedValue(new Error("boom"));

    const user = { userId: "u" };

    const { result } = renderHook(() => useDevices(user));

    await waitFor(() => expect(result.current.loading).toBe(false));
    await waitFor(() => expect(result.current.error).toBe("fetchDevicesError"));
  });

  it("removeDevice removes from list", async () => {
    fetchUserDevices.mockResolvedValue([
      { deviceId: "a", userId: "u", createdAt: "c", updatedAt: "u" },
      { deviceId: "b", userId: "u", createdAt: "c", updatedAt: "u" },
    ]);

    const user = { userId: "u" };

    const { result } = renderHook(() => useDevices(user));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.removeDevice("a"));
    await waitFor(() => {
      expect(result.current.devices.map((d) => d.deviceId)).toEqual(["b"]);
    });
  });

  it("updateDevice merges updates into device list", async () => {
    fetchUserDevices.mockResolvedValue([
      { deviceId: "a", userId: "u", createdAt: "c", updatedAt: "u" },
    ]);

    const user = { userId: "u" };

    const { result } = renderHook(() => useDevices(user));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() =>
      result.current.updateDevice("a", { temperatureThreshold: 30 })
    );

    await waitFor(() => {
      expect(result.current.devices[0].temperatureThreshold).toBe(30);
    });
  });
});
