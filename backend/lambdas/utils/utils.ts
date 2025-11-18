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

    if (origin && !ALLOWED_ORIGINS.has(origin)) {
      return {
        statusCode: 403,
        headers: {
          Vary: "Origin",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: "CORS origin not allowed" }),
      };
    }

    const baseHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      Vary: "Origin, Access-Control-Request-Method, Access-Control-Request-Headers",
      ...extra,
    };

    if (origin) {
      baseHeaders["Access-Control-Allow-Origin"] = origin;
      baseHeaders["Access-Control-Allow-Headers"] =
        "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token";
      baseHeaders["Access-Control-Allow-Methods"] =
        "GET,POST,PUT,DELETE,OPTIONS";
    }

    return {
      statusCode,
      headers: baseHeaders,
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
