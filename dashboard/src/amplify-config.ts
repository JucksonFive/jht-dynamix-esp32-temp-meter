import { Amplify } from "aws-amplify";

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: "eu-north-1_LJrEgFlXO",
      userPoolClientId: "3v99vd33m6f2ersb3th0f1lro1",
    },
  },
  API: {
    REST: {
      JTApi: {
        endpoint:
          "https://ipxyulr5we.execute-api.eu-north-1.amazonaws.com/prod",
        region: "eu-north-1",
      },
    },
  },
});
