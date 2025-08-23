import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import {
  APIGatewayEvent,
  APIGatewayProxyEventV2WithJWTAuthorizer,
  APIGatewayProxyResult,
  APIGatewayProxyResultV2,
} from "aws-lambda";
import { getUserId, makeResponse } from "../utils/utils";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = process.env.TABLE_NAME!;
const GSI_NAME = process.env.GSI_NAME!; // userId-timestamp-index

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyResultV2> => {
  const userId = getUserId(event);
  const qs = event.queryStringParameters ?? {};
  const from = qs.from;
  const to = qs.to;
  const response = makeResponse(event);

  if (!userId)
    return response(401, { message: "Unauthorized: Missing UserId" });

  const exprValues: Record<string, any> = { ":userId": userId };
  let keyCondition = "userId = :userId";
  if (from && to) {
    keyCondition += " AND #ts BETWEEN :from AND :to";
    exprValues[":from"] = from;
    exprValues[":to"] = to;
  } else if (from) {
    keyCondition += " AND #ts >= :from";
    exprValues[":from"] = from;
  } else if (to) {
    keyCondition += " AND #ts <= :to";
    exprValues[":to"] = to;
  }

  // sivutusparametrit
  const limit = qs.limit ? Math.min(parseInt(qs.limit, 10) || 0, 1000) : 500;
  const exclusiveStartKey = qs.nextKey
    ? JSON.parse(decodeURIComponent(qs.nextKey))
    : undefined;

  try {
    const result = await ddb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: GSI_NAME,
        KeyConditionExpression: keyCondition,
        ExpressionAttributeValues: exprValues,
        ExpressionAttributeNames: { "#ts": "timestamp" },
        ScanIndexForward: false, // newest first
        Limit: limit,
        ExclusiveStartKey: exclusiveStartKey,
      })
    );

    const items = result.Items ?? [];
    const nextKey = result.LastEvaluatedKey
      ? encodeURIComponent(JSON.stringify(result.LastEvaluatedKey))
      : null;

    return response(200, { items, nextKey });
  } catch (e) {
    console.error("Query failed", e);
    return response(500, { message: "Server error" });
  }
};
