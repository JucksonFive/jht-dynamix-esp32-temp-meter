import axios from "axios";

import {
  deleteUserDevice,
  fetchAllUserReadings,
  fetchDashboardConfig,
  fetchReadingBounds,
  fetchUserDevices,
  fetchUserReadings,
  getLatestReadingPerDevice,
} from "./api";
import { Mock } from "vitest";

vi.mock("axios", async () => {
  return {
    default: {
      request: vi.fn(),
    },
  };
});

vi.mock("@aws-amplify/auth", async () => {
  return {
    fetchAuthSession: vi.fn(async () => ({
      tokens: {
        idToken: { toString: () => "id-token" },
      },
    })),
  };
});

vi.mock("../utils/runtimeConfig", async () => {
  return {
    resolveBaseApiUrl: () => "https://api.example.test",
    getRuntimeConfig: () => ({}),
    setRuntimeConfig: vi.fn(),
  };
});

describe("services/api.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetchUserReadings maps params to query", async () => {
    (axios.request as unknown as Mock).mockResolvedValueOnce({
      data: { items: [], nextKey: null },
    });

    await fetchUserReadings({
      from: "2025-12-24",
      to: "2025-12-25",
      deviceIds: ["a", "b"],
      limit: 10,
      nextKey: "n",
    });

    expect(axios.request).toHaveBeenCalledTimes(1);
    expect(axios.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "GET",
        url: "https://api.example.test/user-readings",
        params: {
          from: "2025-12-24",
          to: "2025-12-25",
          deviceId: "a,b",
          limit: "10",
          nextKey: "n",
        },
        headers: { Authorization: "Bearer id-token" },
      })
    );
  });

  it("fetchAllUserReadings paginates until nextKey is null", async () => {
    (axios.request as unknown as Mock)
      .mockResolvedValueOnce({
        data: {
          items: [
            {
              deviceId: "a",
              timestamp: "t1",
              temperature: 1,
              humidity: 1,
              userId: "u",
            },
          ],
          nextKey: "k",
        },
      })
      .mockResolvedValueOnce({
        data: {
          items: [
            {
              deviceId: "a",
              timestamp: "t2",
              temperature: 2,
              humidity: 1,
              userId: "u",
            },
          ],
          nextKey: null,
        },
      });

    const items = await fetchAllUserReadings({
      from: "f",
      to: "t",
      pageSize: 1,
    });
    expect(items).toHaveLength(2);
    expect(axios.request).toHaveBeenCalledTimes(2);
  });

  it("deleteUserDevice uses DELETE and passes deviceId query param", async () => {
    (axios.request as unknown as Mock).mockResolvedValueOnce({
      data: { message: "ok" },
    });
    await deleteUserDevice("dev-1");
    expect(axios.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "DELETE",
        url: "https://api.example.test/delete-user-device",
        params: { deviceId: "dev-1" },
      })
    );
  });

  it("fetchUserDevices passes abort signal", async () => {
    const ac = new AbortController();
    (axios.request as unknown as Mock).mockResolvedValueOnce({ data: [] });
    await fetchUserDevices({ signal: ac.signal });
    expect(axios.request).toHaveBeenCalledWith(
      expect.objectContaining({ signal: ac.signal })
    );
  });

  it("fetchReadingBounds hits /bounds", async () => {
    (axios.request as unknown as Mock).mockResolvedValueOnce({
      data: { min: null, max: null },
    });
    const res = await fetchReadingBounds();
    expect(res).toEqual({ min: null, max: null });
    expect(axios.request).toHaveBeenCalledWith(
      expect.objectContaining({ url: "https://api.example.test/bounds" })
    );
  });

  it("fetchDashboardConfig uses fetch and stores runtime config", async () => {
    const { setRuntimeConfig } = await import("../utils/runtimeConfig");

    globalThis.fetch = vi.fn(async () => {
      return {
        ok: true,
        json: async () => ({ VITE_BASE_API_URL: "x" }),
      } as any;
    }) as any;

    const res = await fetchDashboardConfig();
    expect(res).toEqual({ VITE_BASE_API_URL: "x" });
    expect(setRuntimeConfig).toHaveBeenCalledWith({ VITE_BASE_API_URL: "x" });
  });

  it("getLatestReadingPerDevice keeps latest timestamp per device", () => {
    const m = getLatestReadingPerDevice([
      {
        deviceId: "a",
        timestamp: "2025-12-24T00:00:00Z",
        temperature: 1,
        humidity: 0,
        userId: "u",
      },
      {
        deviceId: "a",
        timestamp: "2025-12-24T01:00:00Z",
        temperature: 2,
        humidity: 0,
        userId: "u",
      },
      {
        deviceId: "b",
        timestamp: "2025-12-24T00:30:00Z",
        temperature: 3,
        humidity: 0,
        userId: "u",
      },
    ]);
    expect(m.get("a")).toBe("2025-12-24T01:00:00Z");
    expect(m.get("b")).toBe("2025-12-24T00:30:00Z");
  });
});
