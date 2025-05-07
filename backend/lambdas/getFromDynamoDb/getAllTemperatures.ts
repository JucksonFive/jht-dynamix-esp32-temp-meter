import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";
import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = process.env.TABLE_NAME!;

export const handler = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  const deviceId = event.queryStringParameters?.deviceId;

  if (deviceId) {
    return getTemp(deviceId);
  }

  const result = await client.send(new ScanCommand({ TableName: TABLE_NAME }));
  return {
    statusCode: 200,
    body: JSON.stringify(result.Items),
  };
};

async function getTemp(deviceId: string): Promise<APIGatewayProxyResult> {
  try {
    const result = await client.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          deviceId,
        },
      })
    );

    if (!result.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Reading not found" }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(result.Item),
    };
  } catch (err) {
    console.error("Error reading from DynamoDB", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Failed to fetch data" }),
    };
  }
}
