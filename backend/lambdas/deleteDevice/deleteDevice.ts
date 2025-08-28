import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { getDeviceId, getUserId, makeResponse } from "../utils/utils";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = process.env.TABLE_NAME!;

export const handler = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  const response = makeResponse(event);

  // CORS preflight (keeps parity with your other handlers that short‑circuit OPTIONS)
  if (event.httpMethod === "OPTIONS") return response(204, {});

  const userId = getUserId(event);
  const deviceId = getDeviceId(event);

  if (!userId)
    return response(401, { message: "Unauthorized: Missing UserId" });
  if (!deviceId) return response(400, { message: "Missing deviceId" });

  try {
    await ddb.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { userId, deviceId },
        // Ensure we 404 when the mapping doesn't exist
        ConditionExpression:
          "attribute_exists(userId) AND attribute_exists(deviceId)",
      })
    );

    return response(200, { message: `Device ${deviceId} deleted` });
  } catch (err: any) {
    if (err?.name === "ConditionalCheckFailedException") {
      return response(404, { message: `Device ${deviceId} not found` });
    }
    console.error("Delete failed", err);
    return response(500, { message: "Server error" });
  }
};
