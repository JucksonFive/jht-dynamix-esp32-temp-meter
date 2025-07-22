export default {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID,
    },
  },
  API: {
    REST: {
      JTApi: {
        endpoint: import.meta.env.VITE_API_URL,
        region: import.meta.env.VITE_REGION,
      },
    },
  },
};
