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
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export const handler = async (event: IoTStatusEvent): Promise<void> => {
  console.log("Received IoT status event:", JSON.stringify(event, null, 2));

  const { deviceId } = event;

  if (!deviceId) {
    console.error("Missing required  deviceId ");
    throw new Error("Invalid event: deviceId is required");
  }

  const updatedAt = new Date().toISOString();

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

    await ddb.send(
      new UpdateCommand({
        TableName: DEVICES_TABLE,
        Key: {
          userId,
          deviceId,
        },
        UpdateExpression: "SET #updatedAt = :updatedAt",
        ExpressionAttributeNames: {
          "#updatedAt": "updatedAt",
        },
        ExpressionAttributeValues: {
          ":updatedAt": updatedAt,
        },
      })
    );

    console.log(
      `Successfully updated device ${deviceId} updatedAt: ${updatedAt}`
    );
  } catch (error) {
    console.error("Error updating device status:", error);
    throw error;
  }
};
