import { APIGatewayProxyEvent } from "aws-lambda";

const allowedOriginsEnv =
  process.env.ALLOWED_ORIGINS! || process.env.WEB_APP_ORIGIN!;
const ALLOWED_ORIGINS = new Set(
  allowedOriginsEnv
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean)
);

export const makeResponse =
  (event: APIGatewayProxyEvent) =>
  (statusCode: number, body: unknown, extra: Record<string, string> = {}) => {
    const origin = event.headers.origin ?? event.headers.Origin ?? "";

    if (!ALLOWED_ORIGINS.has(origin)) {
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
        "Access-Control-Allow-Origin": origin,
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
  const rest = event.requestContext?.authorizer?.claims?.sub;
  const http = event.requestContext?.authorizer?.jwt?.claims?.sub;
  return rest ?? http;
};

export const getDeviceId = (event: APIGatewayProxyEvent) =>
  event.pathParameters?.deviceId ??
  event.queryStringParameters?.deviceId ??
  undefined;
