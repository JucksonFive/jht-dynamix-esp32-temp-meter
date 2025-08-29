import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { getDeviceId, getUserId, makeResponse } from "../utils/utils";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const sqs = new SQSClient({});
const TABLE_NAME = process.env.DEVICES_TABLE!;
const DELETE_QUEUE_URL = process.env.DELETE_QUEUE_URL!;

export const handler = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  const response = makeResponse(event);

  // CORS preflight (keeps parity with your other handlers that short‑circuit OPTIONS)
  if (event.httpMethod === "OPTIONS") return response(204, {});

  const userId: string | undefined = getUserId(event);
  const deviceId = getDeviceId(event);

  if (!userId)
    return response(401, { message: "Unauthorized: Missing UserId" });
  if (!deviceId) return response(400, { message: "Missing deviceId" });

  try {
    // First, delete the device from the user's list of devices
    await ddb.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { userId, deviceId },
        // Ensure we 404 when the mapping doesn't exist
        ConditionExpression: "attribute_exists(#u) AND attribute_exists(#d)",
        ExpressionAttributeNames: {
          "#u": "userId",
          "#d": "deviceId",
        },
      })
    );

    // Then, send a message to the SQS queue to purge its readings
    await sqs.send(
      new SendMessageCommand({
        QueueUrl: DELETE_QUEUE_URL,
        MessageBody: JSON.stringify({ userId, deviceId }),
      })
    );

    return response(200, {
      message: `Device ${deviceId} deleted and readings purge initiated`,
    });
  } catch (err: any) {
    if (err?.name === "ConditionalCheckFailedException") {
      return response(404, { message: `Device ${deviceId} not found` });
    }
    console.error("Delete failed", { err });
    return response(500, { message: "Server error" });
  }
};
