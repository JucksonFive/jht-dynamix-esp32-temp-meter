import { act, renderHook, waitFor } from "@testing-library/react";
import { useReadings } from "src/hooks/useReadings";

const fetchAllUserReadings = vi.fn();
const getLatestReadingPerDevice = vi.fn();

vi.mock("../services/api", async () => ({
  fetchAllUserReadings: (...args: any[]) => fetchAllUserReadings(...args),
  getLatestReadingPerDevice: (...args: any[]) =>
    getLatestReadingPerDevice(...args),
}));

describe("hooks/useReadings.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("maps readings into device data and lastSeen map", async () => {
    const items = [
      {
        deviceId: "a",
        timestamp: "t1",
        temperature: 1,
        humidity: 0,
        userId: "u",
      },
      {
        deviceId: "b",
        timestamp: "t2",
        temperature: 2,
        humidity: 0,
        userId: "u",
      },
    ];

    fetchAllUserReadings.mockResolvedValue(items);
    getLatestReadingPerDevice.mockImplementation(() => new Map([["a", "t1"]]));

    const user = { userId: "u" };
    const range = { from: "2025-12-24", to: "2025-12-25" };

    const { result } = renderHook(() =>
      useReadings(user, range, { intervalMs: 0 })
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    // StrictMode/test environment may trigger effects more than once.
    expect(fetchAllUserReadings).toHaveBeenCalled();
    expect(result.current.error).toBeNull();
    expect(result.current.data).toEqual([
      { id: "a", temperature: 1, timestamp: "t1" },
      { id: "b", temperature: 2, timestamp: "t2" },
    ]);
    expect(result.current.lastSeen).toBeInstanceOf(Map);
  });

  it("polls when intervalMs > 0", async () => {
    vi.useFakeTimers();

    fetchAllUserReadings.mockResolvedValue([]);
    getLatestReadingPerDevice.mockImplementation(() => new Map());

    const user = { userId: "u" };
    const range = { from: "2025-12-24", to: "2025-12-25" };

    const { unmount } = renderHook(() =>
      useReadings(user, range, { intervalMs: 1000 })
    );

    // Flush effects and the initial async load.
    await act(async () => {
      await Promise.resolve();
    });

    expect(fetchAllUserReadings).toHaveBeenCalled();
    const callsAfterMount = fetchAllUserReadings.mock.calls.length;

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(fetchAllUserReadings.mock.calls.length).toBeGreaterThan(
      callsAfterMount
    );

    unmount();
  });
});
