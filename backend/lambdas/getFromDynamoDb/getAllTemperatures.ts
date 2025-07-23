import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = process.env.TABLE_NAME!;

export const handler = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  const deviceId = event.queryStringParameters?.deviceId;

  try {
    if (deviceId) {
      const result = await client.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          KeyConditionExpression: "deviceId = :deviceId",
          ExpressionAttributeValues: {
            ":deviceId": deviceId,
          },
        })
      );

      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify(result.Items),
      };
    }

    const result = await client.send(
      new ScanCommand({ TableName: TABLE_NAME })
    );

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(result.Items),
    };
  } catch (err) {
    console.error("Error fetching data:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Server error" }),
    };
  }
};
