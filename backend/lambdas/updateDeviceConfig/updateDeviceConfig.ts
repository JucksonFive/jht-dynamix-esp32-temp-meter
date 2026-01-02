import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getDeviceId, getUserId, makeResponse } from "../utils/utils";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = process.env.DEVICES_TABLE!;

const parseThreshold = (value: unknown) => {
  if (value === null) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
};

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const response = makeResponse(event);

  if (event.httpMethod === "OPTIONS") return response(204, {});
  if (event.httpMethod !== "PUT")
    return response(405, { message: "Method Not Allowed" });

  const userId = getUserId(event);
  const deviceId = getDeviceId(event);

  if (!userId) return response(401, { message: "Unauthorized" });
  if (!deviceId) return response(400, { message: "Missing deviceId" });
  if (!event.body) return response(400, { message: "Missing body" });

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return response(400, { message: "Invalid JSON" });
  }

  if (!Object.prototype.hasOwnProperty.call(payload, "temperatureThreshold")) {
    return response(400, { message: "Missing temperatureThreshold" });
  }

  const temperatureThreshold = parseThreshold(payload.temperatureThreshold);
  if (temperatureThreshold === undefined) {
    return response(400, {
      message: "temperatureThreshold must be a number or null",
    });
  }

  const now = new Date().toISOString();
  const ExpressionAttributeNames: Record<string, string> = {
    "#updatedAt": "updatedAt",
    "#userId": "userId",
    "#deviceId": "deviceId",
    "#temperatureThreshold": "temperatureThreshold",
  };
  const ExpressionAttributeValues: Record<string, unknown> = {
    ":updatedAt": now,
  };

  let UpdateExpression = "SET #updatedAt = :updatedAt";
  if (temperatureThreshold === null) {
    UpdateExpression += " REMOVE #temperatureThreshold";
  } else {
    UpdateExpression += ", #temperatureThreshold = :temperatureThreshold";
    ExpressionAttributeValues[":temperatureThreshold"] = temperatureThreshold;
  }

  try {
    await ddb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { userId, deviceId },
        UpdateExpression,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
        ConditionExpression:
          "attribute_exists(#userId) AND attribute_exists(#deviceId)",
      })
    );

    return response(200, {
      deviceId,
      temperatureThreshold,
    });
  } catch (err: any) {
    if (err?.name === "ConditionalCheckFailedException") {
      return response(404, { message: "Device not found" });
    }
    console.error("Update device config failed", err);
    return response(500, { message: "Internal error" });
  }
};
