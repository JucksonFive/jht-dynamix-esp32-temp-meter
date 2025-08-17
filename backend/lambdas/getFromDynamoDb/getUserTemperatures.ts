import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = process.env.TABLE_NAME!;
const GSI_NAME = process.env.GSI_NAME!; // userId-timestamp-index

export const handler = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  const userId = event.queryStringParameters?.userId;
  const from = event.queryStringParameters?.from; // ISO8601
  const to = event.queryStringParameters?.to; // ISO8601
  if (!userId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Missing userId" }),
    };
  }

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

  try {
    const result = await ddb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: GSI_NAME,
        KeyConditionExpression: keyCondition,
        ExpressionAttributeValues: exprValues,
        ExpressionAttributeNames: { "#ts": "timestamp" },
        ScanIndexForward: false, // newest first
      })
    );

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(result.Items ?? []),
    };
  } catch (e) {
    console.error("Query failed", e);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Server error" }),
    };
  }
};
