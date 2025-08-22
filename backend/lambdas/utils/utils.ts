import { APIGatewayEvent } from "aws-lambda";

const ALLOWED_ORIGINS = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

export const makeResponse =
  (event: APIGatewayEvent) => (statusCode: number, body: unknown) => {
    const reqOrigin = event.headers?.origin || event.headers?.Origin;
    const allowOrigin =
      reqOrigin && ALLOWED_ORIGINS.has(reqOrigin)
        ? reqOrigin
        : "http://localhost:5173"; // fallback devissä tai prod-domain myöhemmin

    return {
      statusCode,
      headers: {
        "Access-Control-Allow-Origin": allowOrigin,
        "Access-Control-Allow-Headers":
          "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
        "Access-Control-Allow-Methods": "GET,OPTIONS",
      },
      body: JSON.stringify(body),
    };
  };
