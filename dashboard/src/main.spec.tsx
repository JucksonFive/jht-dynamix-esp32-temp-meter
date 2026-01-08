describe("main.tsx", () => {
  it("bootstraps: loads dashboard config, configures Amplify, and renders App", async () => {
    vi.resetModules();

    const render = vi.fn();
    const createRoot = vi.fn(() => ({ render }));
    const configure = vi.fn();
    const fetchDashboardConfig = vi.fn(async () => ({
      VITE_BASE_API_URL: "x",
    }));
    const setRuntimeConfig = vi.fn();
    const buildAmplifyConfig = vi.fn(() => ({ Auth: { Cognito: {} } }));

    vi.doMock("react-dom/client", () => ({
      default: { createRoot },
    }));
    vi.doMock("aws-amplify", () => ({
      Amplify: { configure },
    }));
    vi.doMock("./services/api", () => ({
      fetchDashboardConfig,
    }));
    vi.doMock("./utils/runtimeConfig", () => ({
      setRuntimeConfig,
    }));
    vi.doMock("./amplify-config", () => ({
      buildAmplifyConfig,
    }));
    vi.doMock("./App", () => ({ default: () => null }));
    vi.doMock("./contexts/AppContext", () => ({
      AppProvider: ({ children }: any) => children,
    }));

    document.body.innerHTML = '<div id="root"></div>';

    await import("src/main");
    await Promise.resolve();

    expect(fetchDashboardConfig).toHaveBeenCalledTimes(1);
    expect(setRuntimeConfig).toHaveBeenCalledWith({ VITE_BASE_API_URL: "x" });
    expect(buildAmplifyConfig).toHaveBeenCalledTimes(1);
    expect(configure).toHaveBeenCalledWith({ Auth: { Cognito: {} } });
    expect(createRoot).toHaveBeenCalledWith(document.getElementById("root"));
    expect(render).toHaveBeenCalledTimes(1);
  });
});
