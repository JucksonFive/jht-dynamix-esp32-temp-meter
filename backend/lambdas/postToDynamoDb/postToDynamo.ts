import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});

export const handler = async (event: any): Promise<void> => {
  console.log("Received event:", JSON.stringify(event));

  const { deviceId, temperature, timestamp } = event;

  if (!deviceId || temperature === undefined || !timestamp) {
    console.error("Missing required fields");
    return;
  }

  const command = new PutItemCommand({
    TableName: process.env.TABLE_NAME!,
    Item: {
      deviceId: { S: deviceId },
      temperature: { N: temperature.toString() },
      timestamp: { S: timestamp },
    },
  });

  await client.send(command);
};
