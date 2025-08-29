import { APIGatewayProxyEvent } from "aws-lambda";

const ALLOWED_ORIGINS = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

export const makeResponse =
  (event: APIGatewayProxyEvent) =>
  (statusCode: number, body: unknown, extra: Record<string, string> = {}) => {
    const origin = event.headers?.origin ?? event.headers?.Origin ?? "";
    const allowOrigin = ALLOWED_ORIGINS.has(origin)
      ? origin
      : "http://localhost:5173";
    return {
      statusCode,
      headers: {
        "Access-Control-Allow-Origin": allowOrigin,
        "Access-Control-Allow-Headers":
          "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
        "Access-Control-Allow-Methods": "GET,DELETE,OPTIONS",
        "Access-Control-Allow-Credentials": "true",
        Vary: "Origin",
        "Content-Type": "application/json",
        ...extra,
      },
      body: JSON.stringify(body ?? {}),
    };
  };

export const getUserId = (event: APIGatewayProxyEvent) => {
  // REST API (Cognito User Pools authorizer)
  // @ts-ignore
  const rest = event.requestContext?.authorizer?.claims?.sub;
  // HTTP API (JWT authorizer)
  // @ts-ignore
  const http = event.requestContext?.authorizer?.jwt?.claims?.sub;
  return rest ?? http;
};
export const getDeviceId = (event: APIGatewayProxyEvent) =>
  event.pathParameters?.deviceId ??
  event.queryStringParameters?.deviceId ?? // <-- tuki querylle
  undefined;
