import { buildAmplifyConfig } from "./amplify-config";

vi.mock("./utils/runtimeConfig", async () => {
  return {
    getRuntimeConfig: () => ({
      VITE_COGNITO_USER_POOL_ID: "pool",
      VITE_COGNITO_USER_POOL_CLIENT_ID: "client",
      VITE_BASE_API_URL: "https://api",
      VITE_REGION: "eu-north-1",
    }),
  };
});

describe("amplify-config.ts", () => {
  it("buildAmplifyConfig prefers runtime config", () => {
    const cfg = buildAmplifyConfig();
    expect(cfg.Auth.Cognito.userPoolId).toBe("pool");
    expect(cfg.Auth.Cognito.userPoolClientId).toBe("client");
    expect(cfg.API.REST.JTApi.endpoint).toBe("https://api");
    expect(cfg.API.REST.JTApi.region).toBe("eu-north-1");
  });
});
