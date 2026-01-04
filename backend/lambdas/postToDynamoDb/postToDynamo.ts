import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { HandlerEvent } from "../utils/types";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const TEMPS_TABLE = process.env.TABLE_NAME!;
const DEVICES_TABLE = process.env.DEVICES_TABLE!;

export const handler = async (event: HandlerEvent) => {
  console.log("Received event:", JSON.stringify(event));

  const { deviceId, temperature, humidity, timestamp } = event;
  if (
    !deviceId ||
    typeof temperature !== "number" ||
    typeof humidity !== "number" ||
    !timestamp
  ) {
    return { statusCode: 400, body: "Invalid payload" };
  }

  const userId = event.userId ?? "unknown";
  const item = { deviceId, timestamp, userId, temperature, humidity };

  try {
    await ddb.send(new PutCommand({ TableName: TEMPS_TABLE, Item: item }));

    // Päivitä Devices.updatedAt jokaisella lukemalla (jos userId mukana)
    if (event.userId) {
      const updatedAt = new Date().toISOString();
      await ddb.send(
        new UpdateCommand({
          TableName: DEVICES_TABLE,
          Key: { userId: event.userId, deviceId },
          UpdateExpression: "SET #updatedAt = :updatedAt",
          ConditionExpression:
            "attribute_exists(userId) AND attribute_exists(deviceId)",
          ExpressionAttributeNames: { "#updatedAt": "updatedAt" },
          ExpressionAttributeValues: { ":updatedAt": updatedAt },
        })
      );
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    console.error("Write failed:", e);
    return { statusCode: 500, body: "DDB write failed" };
  }
};
