import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = process.env.TABLE_NAME!;
const GSI_NAME = process.env.GSI_NAME!; // userId-timestamp-index

const response = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: {
    "Access-Control-Allow-Origin": "http://localhost:5173",
    "Access-Control-Allow-Headers":
      "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
  },
  body: JSON.stringify(body),
});

const getUserId = (event: APIGatewayEvent) => {
  // REST API (Cognito User Pools authorizer)
  // @ts-ignore
  const rest = event.requestContext?.authorizer?.claims?.sub;
  // HTTP API (JWT authorizer)
  // @ts-ignore
  const http = event.requestContext?.authorizer?.jwt?.claims?.sub;
  return rest ?? http;
};
export const handler = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  const userId = getUserId(event);
  const qs = event.queryStringParameters ?? {};
  const from = qs.from;
  const to = qs.to;

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
