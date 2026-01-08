import reportWebVitals from "src/reportWebVitals";

vi.mock("web-vitals", async () => {
  return {
    getCLS: vi.fn(),
    getFID: vi.fn(),
    getFCP: vi.fn(),
    getLCP: vi.fn(),
    getTTFB: vi.fn(),
  };
});

describe("reportWebVitals.ts", () => {
  it("does nothing when handler is not provided", async () => {
    reportWebVitals(undefined);
    const mod = await import("web-vitals");
    expect(mod.getCLS).not.toHaveBeenCalled();
  });

  it("registers all web-vitals callbacks when handler is provided", async () => {
    const handler = vi.fn();
    reportWebVitals(handler);

    // allow dynamic import promise to resolve
    await Promise.resolve();

    const mod = await import("web-vitals");
    expect(mod.getCLS).toHaveBeenCalledWith(handler);
    expect(mod.getFID).toHaveBeenCalledWith(handler);
    expect(mod.getFCP).toHaveBeenCalledWith(handler);
    expect(mod.getLCP).toHaveBeenCalledWith(handler);
    expect(mod.getTTFB).toHaveBeenCalledWith(handler);
  });
});
