import { getRuntimeConfig } from "./utils/runtimeConfig";

export const buildAmplifyConfig = () => {
  const cfg = getRuntimeConfig();

  return {
    Auth: {
      Cognito: {
        userPoolId:
          cfg.VITE_COGNITO_USER_POOL_ID ||
          import.meta.env.VITE_COGNITO_USER_POOL_ID,
        userPoolClientId:
          cfg.VITE_COGNITO_USER_POOL_CLIENT_ID ||
          import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID,
      },
    },
    API: {
      REST: {
        JTApi: {
          endpoint: cfg.VITE_BASE_API_URL || import.meta.env.VITE_BASE_API_URL,
          region: cfg.VITE_REGION || import.meta.env.VITE_REGION,
        },
      },
    },
  };
};

export default buildAmplifyConfig;
