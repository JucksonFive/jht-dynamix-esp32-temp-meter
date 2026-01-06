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

  const { deviceId, temperature, humidity, timestamp, userId } = event;

  if (
    !deviceId ||
    !userId ||
    typeof temperature !== "number" ||
    typeof humidity !== "number" ||
    !timestamp
  ) {
    return { statusCode: 400, body: "Invalid payload" };
  }

  const item = { deviceId, timestamp, userId, temperature, humidity };

  try {
    await ddb.send(new PutCommand({ TableName: TEMPS_TABLE, Item: item }));

    // Päivitä Devices.updatedAt jokaisella lukemalla (userId validoitu jo yllä)
    const updatedAt = new Date().toISOString();
    console.log(
      "Updating device updatedAt",
      JSON.stringify({ table: DEVICES_TABLE, userId, deviceId, updatedAt })
    );

    try {
      const res = await ddb.send(
        new UpdateCommand({
          TableName: DEVICES_TABLE,
          Key: { userId, deviceId },
          UpdateExpression: "SET #updatedAt = :updatedAt",
          ConditionExpression:
            "attribute_exists(userId) AND attribute_exists(deviceId)",
          ExpressionAttributeNames: { "#updatedAt": "updatedAt" },
          ExpressionAttributeValues: { ":updatedAt": updatedAt },
          ReturnValues: "UPDATED_NEW",
        })
      );
      console.log("Device updatedAt updated", JSON.stringify(res?.Attributes));
    } catch (e) {
      // Älä kaada mittaustallennusta, jos device-riviä ei löydy / ei ole rekisteröity
      console.warn("Device updatedAt update failed", e);
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    console.error("Write failed:", e);
    return { statusCode: 500, body: "DDB write failed" };
  }
};
