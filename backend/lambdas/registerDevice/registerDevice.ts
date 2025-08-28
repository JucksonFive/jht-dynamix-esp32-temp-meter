import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { makeResponse } from "../utils/utils";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = process.env.DEVICES_TABLE!;

const getUserId = (event: APIGatewayProxyEvent): string | undefined => {
  // REST API + Cognito User Pools authorizer
  const v1 = (event.requestContext as any)?.authorizer?.claims;
  if (v1?.sub) return v1.sub as string;
  // HTTP API v2 (varalla, jos joskus siirryt)
  const v2 = (event.requestContext as any)?.authorizer?.jwt?.claims;
  if (v2?.sub) return v2.sub as string;
  return undefined;
};

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const response = makeResponse(event);

  if (event.httpMethod === "OPTIONS") return response(204, {});
  if (event.httpMethod !== "POST")
    return response(405, { message: "Method Not Allowed" });

  const userId = getUserId(event);
  if (!userId) return response(401, { message: "Unauthorized" });

  if (!event.body) return response(400, { message: "Missing body" });
  let parsed: { deviceId?: string; deviceName?: string } = {};
  try {
    parsed = JSON.parse(event.body);
  } catch {
    return response(400, { message: "Invalid JSON" });
  }

  const deviceId = (parsed.deviceId ?? "").trim();
  if (!/^[A-Za-z0-9_\-:.]{1,64}$/.test(deviceId)) {
    return response(400, { message: "Invalid deviceId" });
  }

  const now = new Date().toISOString();
  const item = {
    userId,
    deviceId,
    deviceName: (parsed.deviceName ?? deviceId).slice(0, 64),
    createdAt: now,
    updatedAt: now,
  };

  try {
    await ddb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
        ConditionExpression:
          "attribute_not_exists(#u) AND attribute_not_exists(#d)",
        ExpressionAttributeNames: { "#u": "userId", "#d": "deviceId" },
      })
    );
    return response(201, item);
  } catch (err: any) {
    if (err?.name === "ConditionalCheckFailedException") {
      return response(409, { message: "Device already registered" });
    }
    console.error(err);
    return response(500, { message: "Internal error" });
  }
};
