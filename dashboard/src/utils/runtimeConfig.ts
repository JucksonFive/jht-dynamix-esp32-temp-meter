export type RuntimeConfig = {
  VITE_BASE_API_URL?: string;
  VITE_COGNITO_USER_POOL_ID?: string;
  VITE_COGNITO_USER_POOL_CLIENT_ID?: string;
  VITE_REGION?: string;
};

let config: RuntimeConfig = {};

export const getRuntimeConfig = () => config;
export const setRuntimeConfig = (next: RuntimeConfig) => {
  config = { ...config, ...next };
};

export const resolveBaseApiUrl = () => import.meta.env.VITE_API_URL;
