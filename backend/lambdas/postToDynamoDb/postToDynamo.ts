import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const TEMPS_TABLE = process.env.TABLE_NAME!;
const DEVICES_TABLE = process.env.DEVICES_TABLE!;

type Event = {
  deviceId: string;
  temperature: number;
  timestamp: string; // ISO8601
  userId?: string; // optional override
};

export const handler = async (event: Event) => {
  console.log("Received event:", JSON.stringify(event));

  const { deviceId, temperature, timestamp } = event;
  if (!deviceId || typeof temperature !== "number" || !timestamp) {
    console.error("Invalid payload");
    return { statusCode: 400, body: "Invalid payload" };
  }

  // Resolve userId from Devices table
  let userId = event.userId;
  try {
    const res = await ddb.send(
      new GetCommand({ TableName: DEVICES_TABLE, Key: { deviceId } })
    );
    userId = (res.Item as any)?.userId ?? userId ?? "unknown";
  } catch (e) {
    console.warn("Device lookup failed, continuing:", e);
    userId = userId ?? "unknown";
  }

  // Temperatures PK/SK = deviceId + timestamp
  const item = { deviceId, timestamp, userId, temperature };

  try {
    await ddb.send(new PutCommand({ TableName: TEMPS_TABLE, Item: item }));
    console.log("Put OK");
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    console.error("Put failed:", e);
    return { statusCode: 500, body: "DDB write failed" };
  }
};
