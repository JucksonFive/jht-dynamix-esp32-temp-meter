import {
  APIGatewayProxyEventV2WithJWTAuthorizer,
  APIGatewayProxyResultV2,
} from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { makeResponse } from "../utils/utils";
import { DeleteCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const tableName = process.env.DEVICE_USER_TABLE!;

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
  const response = makeResponse(event);

  // CORS preflight
  if (event.requestContext.http.method === "OPTIONS") {
    return response(204, {});
  }

  const userId = event.requestContext.authorizer?.jwt?.claims?.sub as
    | string
    | undefined;
  const deviceId = event.pathParameters?.deviceId;

  if (!userId || !deviceId) {
    return response(400, { message: "Missing userId or deviceId" });
  }

  try {
    await client.send(
      new DeleteCommand({
        TableName: tableName,
        Key: { userId, deviceId },
      })
    );
    return response(200, { message: `Device ${deviceId} deleted` });
  } catch (err) {
    console.error("Error deleting device:", err);
    return response(500, { message: "Internal server error" });
  }
};
