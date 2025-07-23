import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { GetCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});

export const handler = async (event: any): Promise<void> => {
  console.log("Received event:", JSON.stringify(event));

  const { deviceId, temperature, timestamp } = event;

  if (!deviceId || temperature === undefined || !timestamp) {
    console.error("Missing required fields");
    return;
  }

  const mapping = await client.send(
    new GetCommand({
      TableName: "Devices",
      Key: { deviceId: { S: event.deviceId } },
    })
  );

  const userId = mapping.Item?.userId?.S;

  if (!userId) {
    console.warn(`No user mapping found for device ${event.deviceId}`);
  }

  const command = new PutItemCommand({
    TableName: process.env.TABLE_NAME!,
    Item: {
      deviceId: { S: deviceId },
      temperature: { N: temperature.toString() },
      timestamp: { S: timestamp },
      userId: userId ? { S: userId } : { S: "unknown" },
    },
  });

  await client.send(command);
};
