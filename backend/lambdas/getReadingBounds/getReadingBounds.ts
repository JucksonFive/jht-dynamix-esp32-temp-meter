// backend/lambdas/getReadingBounds/index.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayEvent } from "aws-lambda";
import { makeResponse } from "../utils/utils";

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = process.env.TABLE_NAME!;
const GSI_NAME = "userId-timestamp-index";

export const handler = async (event: APIGatewayEvent) => {
  const userId = event.requestContext?.authorizer?.claims?.sub; // Cognito sub
  if (!userId) return makeResponse(event)(401, { message: "Unauthorized" });

  const earliestQ = await client.send(
    new QueryCommand({
      TableName: TABLE_NAME,
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
      TableName: TABLE_NAME,
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
