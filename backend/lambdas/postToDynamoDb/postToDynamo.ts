import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { IoTEvent } from "./types";

const client = new DynamoDBClient({});

export const handler = async (event: IoTEvent): Promise<void> => {
  const payload = JSON.parse(event.payload);
  const { deviceId, temperature, humidity, timestamp } = payload;

  const command = new PutItemCommand({
    TableName: process.env.TABLE_NAME,
    Item: {
      deviceId: { S: deviceId },
      temperature: { N: temperature.toString() },
      humidity: { N: humidity.toString() },
      timestamp: { S: timestamp },
    },
  });

  await client.send(command);
};
