import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { getUserId, makeResponse } from "../utils/utils";

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const DEVICES_TABLE = process.env.DEVICES_TABLE!;

/**
 * Fetches all devices registered to the authenticated user.
 * Uses the GSI on the devices table to query by userId.
 */
export const handler = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  const token = event.headers.Authorization?.split(" ")[1];
  if (!token) {
    return makeResponse(event)(401, { message: "Unauthorized" });
  }

  try {
    const userId = getUserId(event);
    if (!userId) {
      return makeResponse(event)(403, { message: "Invalid Token" });
    }

    const result = await client.send(
      new QueryCommand({
        TableName: DEVICES_TABLE,
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: {
          ":userId": userId,
        },
      })
    );

    return makeResponse(event)(200, result.Items);
  } catch (err) {
    console.error("Error fetching devices:", err);
    return makeResponse(event)(500, {
      message: "Server error while fetching devices",
    });
  }
};
