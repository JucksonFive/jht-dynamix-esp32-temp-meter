// backend/lambdas/getReadingBounds/index.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayEvent } from "aws-lambda";

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME!;
const GSI_NAME = "userId-timestamp-index";

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

export const handler = async (event: APIGatewayEvent) => {
  const userId = event.requestContext?.authorizer?.claims?.sub; // Cognito sub
  if (!userId) return makeResponse(event)(401, { message: "Unauthorized" });

  const earliestQ = await client.send(
    new QueryCommand({
      TableName: TABLE,
      IndexName: GSI_NAME,
      KeyConditionExpression: "#uid = :uid",
      ExpressionAttributeNames: { "#uid": "userId" },
      ExpressionAttributeValues: { ":uid": userId },
      ScanIndexForward: true,
      Limit: 1,
    })
  );

  const latestQ = await client.send(
    new QueryCommand({
      TableName: TABLE,
      IndexName: GSI_NAME,
      KeyConditionExpression: "#uid = :uid",
      ExpressionAttributeNames: { "#uid": "userId" },
      ExpressionAttributeValues: { ":uid": userId },
      ScanIndexForward: false,
      Limit: 1,
    })
  );

  const minTs = earliestQ.Items?.[0]?.timestamp ?? null;
  const maxTs = latestQ.Items?.[0]?.timestamp ?? null;

  return makeResponse(event)(200, { min: minTs, max: maxTs });
};
