import { APIGatewayProxyEventV2 } from "aws-lambda";

const ALLOWED_ORIGINS = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

const getHeader = (event: APIGatewayProxyEventV2, name: string) =>
  event.headers?.[name] ??
  event.headers?.[name.toLowerCase() as keyof typeof event.headers];

export const makeResponse =
  (event: APIGatewayProxyEventV2) =>
  (
    statusCode: number,
    body: unknown,
    extraHeaders: Record<string, string> = {}
  ) => {
    const reqOrigin = (getHeader(event, "Origin") as string | undefined) ?? "";
    const allowOrigin = ALLOWED_ORIGINS.has(reqOrigin)
      ? reqOrigin
      : "http://localhost:5173";

    return {
      statusCode,
      headers: {
        "Access-Control-Allow-Origin": allowOrigin,
        "Access-Control-Allow-Headers":
          "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
        "Access-Control-Allow-Methods": "GET,DELETE,OPTIONS",
        Vary: "Origin",
        "Content-Type": "application/json",
        ...extraHeaders,
      },
      body: JSON.stringify(body),
    };
  };

export const getUserId = (event: APIGatewayProxyEventV2) => {
  // REST API (Cognito User Pools authorizer)
  // @ts-ignore
  const rest = event.requestContext?.authorizer?.claims?.sub;
  // HTTP API (JWT authorizer)
  // @ts-ignore
  const http = event.requestContext?.authorizer?.jwt?.claims?.sub;
  return rest ?? http;
};
