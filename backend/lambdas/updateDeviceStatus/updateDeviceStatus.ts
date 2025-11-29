import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  UpdateCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const DEVICES_TABLE = process.env.DEVICES_TABLE!;

interface IoTStatusEvent {
  deviceId: string;
  status: "online" | "offline";
  timestamp?: string;
  userId?: string;
}

/**
 * Lambda function triggered by IoT Core when devices publish to devices/+/status
 *
 * IoT Rule listens to: devices/+/status
 *
 * Expected message format from ESP32:
 * Topic: devices/{deviceId}/status
 * Payload: {
 *   "deviceId": "esp32-12345",
 *   "status": "online" | "offline",
 *   "userId": "user-uuid",  // optional, will be looked up if not provided
 *   "timestamp": "2024-01-01T12:00:00.000Z"  // optional, will use current time if not provided
 * }
 *
 * Updates the Devices table with the device status and lastSeen timestamp
 */
export const handler = async (event: IoTStatusEvent): Promise<void> => {
  console.log("Received IoT status event:", JSON.stringify(event, null, 2));

  const { deviceId, status, timestamp } = event;

  if (!deviceId || !status) {
    console.error("Missing required fields: deviceId or status");
    throw new Error("Invalid event: deviceId and status are required");
  }

  // Use provided timestamp or current time
  const lastSeen = timestamp || new Date().toISOString();

  try {
    let userId = event.userId;

    // If userId is not provided, scan the table to find it
    // Note: This is less efficient but works without a GSI on deviceId
    // For production with many devices, consider adding a GSI on deviceId
    if (!userId) {
      console.log(`userId not provided, scanning for deviceId: ${deviceId}`);
      const scanResult = await ddb.send(
        new ScanCommand({
          TableName: DEVICES_TABLE,
          FilterExpression: "deviceId = :deviceId",
          ExpressionAttributeValues: {
            ":deviceId": deviceId,
          },
          Limit: 1,
        })
      );

      if (!scanResult.Items || scanResult.Items.length === 0) {
        console.error(`Device ${deviceId} not found in Devices table`);
        throw new Error(`Device ${deviceId} not registered`);
      }

      userId = scanResult.Items[0].userId;
      console.log(`Found userId: ${userId} for deviceId: ${deviceId}`);
    }

    const now = new Date().toISOString();

    await ddb.send(
      new UpdateCommand({
        TableName: DEVICES_TABLE,
        Key: {
          userId,
          deviceId,
        },
        UpdateExpression:
          "SET #status = :status, #lastSeen = :lastSeen, #updatedAt = :updatedAt",
        ExpressionAttributeNames: {
          "#lastSeen": "lastSeen",
          "#updatedAt": "updatedAt",
        },
        ExpressionAttributeValues: {
          ":lastSeen": lastSeen,
          ":updatedAt": now,
        },
      })
    );

    console.log(
      `Successfully updated device ${deviceId} status to ${status} at ${lastSeen}`
    );
  } catch (error) {
    console.error("Error updating device status:", error);
    throw error;
  }
};
