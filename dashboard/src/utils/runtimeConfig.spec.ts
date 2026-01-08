import {
  getRuntimeConfig,
  setRuntimeConfig,
  type RuntimeConfig,
} from "src/utils/runtimeConfig";

describe("utils/runtimeConfig.ts", () => {
  it("merges config on setRuntimeConfig", () => {
    const initial = getRuntimeConfig();
    expect(initial).toEqual({});

    setRuntimeConfig({ VITE_BASE_API_URL: "https://example.com" });
    expect(getRuntimeConfig()).toMatchObject({
      VITE_BASE_API_URL: "https://example.com",
    });

    setRuntimeConfig({ VITE_REGION: "eu-west-1" } satisfies RuntimeConfig);
    expect(getRuntimeConfig()).toMatchObject({
      VITE_BASE_API_URL: "https://example.com",
      VITE_REGION: "eu-west-1",
    });
  });
});
