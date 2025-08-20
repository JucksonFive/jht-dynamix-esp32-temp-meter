// backend/lambdas/getReadingBounds/index.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayEvent } from "aws-lambda";

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE!;
const GSI = "UserTimeIndex";

export const handler = async (event: APIGatewayEvent) => {
  const userId = event.requestContext?.authorizer?.claims?.sub; // Cognito sub
  if (!userId) return { statusCode: 401, body: "Unauthorized" };

  const earliestQ = await client.send(
    new QueryCommand({
      TableName: TABLE,
      IndexName: GSI,
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
      IndexName: GSI,
      KeyConditionExpression: "#uid = :uid",
      ExpressionAttributeNames: { "#uid": "userId" },
      ExpressionAttributeValues: { ":uid": userId },
      ScanIndexForward: false,
      Limit: 1,
    })
  );

  const minTs = earliestQ.Items?.[0]?.timestamp ?? null;
  const maxTs = latestQ.Items?.[0]?.timestamp ?? null;

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ min: minTs, max: maxTs }),
  };
};
