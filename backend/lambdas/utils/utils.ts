import { APIGatewayProxyEvent } from "aws-lambda";

const ALLOWED_ORIGINS = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://app.jt-dynamix.com",
]);

export const makeResponse =
  (event: APIGatewayProxyEvent) =>
  (statusCode: number, body: unknown, extra: Record<string, string> = {}) => {
    const origin = event.headers.origin ?? event.headers.Origin ?? "";

    if (!ALLOWED_ORIGINS.has(origin)) {
      // Ei paljasteta CORS-allow-originia väärille
      return {
        statusCode: 403,
        headers: {
          Vary: "Origin",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: "CORS origin not allowed" }),
      };
    }

    return {
      statusCode,
      headers: {
        "Access-Control-Allow-Origin": "*", // echo allowed origin
        "Access-Control-Allow-Credentials": "false", // bearer-auth ei tarvitse credentialsia
        "Access-Control-Allow-Headers":
          "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        Vary: "Origin, Access-Control-Request-Method, Access-Control-Request-Headers",
        "Content-Type": "application/json",
        ...extra,
      },
      body: JSON.stringify(body ?? {}),
    };
  };

export const getUserId = (event: APIGatewayProxyEvent) => {
  // REST API (CUP authorizer)
  // @ts-ignore
  const rest = event.requestContext?.authorizer?.claims?.sub;
  // HTTP API (JWT authorizer)
  // @ts-ignore
  const http = event.requestContext?.authorizer?.jwt?.claims?.sub;
  return rest ?? http;
};

export const getDeviceId = (event: APIGatewayProxyEvent) =>
  event.pathParameters?.deviceId ??
  event.queryStringParameters?.deviceId ??
  undefined;
