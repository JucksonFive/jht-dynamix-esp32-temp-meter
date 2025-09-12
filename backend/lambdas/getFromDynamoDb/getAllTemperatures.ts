import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { makeResponse } from "lambdas/utils/utils";

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

      return makeResponse(event)(200, result.Items);
    }

    const result = await client.send(
      new ScanCommand({ TableName: TABLE_NAME })
    );

    return makeResponse(event)(200, result.Items);
  } catch (err) {
    console.error("Error fetching data:", err);
    return makeResponse(event)(500, { message: "Internal Server Error" });
  }
};
