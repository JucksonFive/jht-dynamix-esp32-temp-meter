import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { DeviceStatus } from "lambdas/utils/enums";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const DEVICES_TABLE = process.env.DEVICES_TABLE!;

type StatusEvent = {
  userId: string;
  deviceId: string;
  status: DeviceStatus;
  ts?: string;
};

export const handler = async (event: StatusEvent) => {
  console.log("Status event:", JSON.stringify(event));

  const { userId, deviceId, status, ts } = event;
  const nowIso = new Date().toISOString();

  if (!userId || !deviceId) {
    console.error("Missing userId or deviceId in event");
    return { ok: false };
  }

  await ddb.send(
    new UpdateCommand({
      TableName: DEVICES_TABLE,
      Key: { userId, deviceId },
      UpdateExpression:
        "SET #status = :status, lastSeenAt = :lastSeenAt, updatedAt = :updatedAt",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":status": status,
        ":lastSeenAt": ts ?? nowIso,
        ":updatedAt": nowIso,
      },
    })
  );

  return { ok: true };
};
