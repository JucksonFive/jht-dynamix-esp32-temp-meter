import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
  QueryCommand,
  QueryCommandOutput,
} from "@aws-sdk/lib-dynamodb";
import { SQSHandler, SQSRecord } from "aws-lambda";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = process.env.TABLE_NAME!; // Temperatures table

const BATCH_WRITE_MAX = 25;

/**
 * Deletes all temperature readings for a given deviceId.
 * This function is triggered by an SQS message containing the deviceId.
 */
export const handler: SQSHandler = async (event) => {
  console.log(`Received ${event.Records.length} SQS record(s) to process.`);

  for (const record of event.Records) {
    try {
      await processRecord(record);
    } catch (error) {
      console.error("Failed to process record, it will be retried.", {
        messageId: record.messageId,
        error,
      });
      // Re-throw to let SQS handle the retry, moving to DLQ after max retries.
      throw error;
    }
  }
};

async function processRecord(record: SQSRecord) {
  let body: { deviceId?: string };
  try {
    body = JSON.parse(record.body || "{}");
  } catch {
    console.error("Invalid JSON in SQS message body", { body: record.body });
    // No re-throw, as this message is poison and won't succeed on retry.
    return;
  }

  const { deviceId } = body;
  if (!deviceId) {
    console.error("Missing 'deviceId' in SQS message body", { body });
    return;
  }

  console.log(`Starting purge for deviceId: ${deviceId}`);

  let totalDeleted = 0;
  let lastEvaluatedKey: Record<string, unknown> | undefined;

  do {
    const queryResult: QueryCommandOutput = await ddb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "deviceId = :deviceId",
        ExpressionAttributeValues: {
          ":deviceId": deviceId,
        },
        // We only need the primary keys to perform the delete
        ProjectionExpression: "deviceId, #ts",
        ExpressionAttributeNames: {
          "#ts": "timestamp",
        },
        ExclusiveStartKey: lastEvaluatedKey,
      }),
    );

    // ...
    const items = queryResult.Items || [];
    console.log(`Query found ${items.length} items to delete in this batch.`);

    if (items.length > 0) {
      // Log the keys of the first item to be deleted
      console.log("Sample keys for deletion:", {
        deviceId: items[0].deviceId,
        timestamp: items[0].timestamp,
      });

      const deletedCount = await batchDelete(items);
      // ...
      totalDeleted += deletedCount;
      console.log(
        `Attempted to delete a batch of ${items.length} items. Successfully deleted: ${deletedCount}. Total deleted so far: ${totalDeleted}`,
      );
    }

    lastEvaluatedKey = queryResult.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  console.log(
    `Purge complete for deviceId: ${deviceId}. Total items deleted: ${totalDeleted}.`,
  );
}

/**
 * Deletes a batch of items from DynamoDB using BatchWriteCommand.
 * Handles unprocessed items with retries and exponential backoff.
 * @param items - An array of items, each with at least the primary key attributes.
 * @returns The number of items successfully deleted.
 */
async function batchDelete(items: Record<string, unknown>[]): Promise<number> {
  let totalDeleted = 0;

  // Split items into chunks of BATCH_WRITE_MAX
  for (let i = 0; i < items.length; i += BATCH_WRITE_MAX) {
    const chunk = items.slice(i, i + BATCH_WRITE_MAX);

    const deleteRequests = chunk.map((item) => ({
      DeleteRequest: {
        Key: {
          deviceId: item.deviceId,
          timestamp: item.timestamp,
        },
      },
    }));

    let unprocessedItems = deleteRequests;
    let attempt = 0;
    const MAX_RETRIES = 5;

    while (unprocessedItems.length > 0 && attempt < MAX_RETRIES) {
      if (attempt > 0) {
        const delay = Math.min(100 * 2 ** attempt + Math.random() * 100, 2000);
        console.warn(
          `Retrying ${
            unprocessedItems.length
          } unprocessed items. Attempt ${attempt}. Waiting ${delay.toFixed(
            0,
          )}ms.`,
        );
        await new Promise((res) => setTimeout(res, delay));
      }

      const command = new BatchWriteCommand({
        RequestItems: {
          [TABLE_NAME]: unprocessedItems,
        },
      });

      const result = await ddb.send(command);

      unprocessedItems = (result.UnprocessedItems?.[TABLE_NAME] || []).filter(
        (
          item,
        ): item is {
          DeleteRequest: { Key: { deviceId: string; timestamp: string } };
        } => item.DeleteRequest !== undefined,
      );
      attempt++;
    }

    const successfullyDeletedInChunk = chunk.length - unprocessedItems.length;
    totalDeleted += successfullyDeletedInChunk;

    if (unprocessedItems.length > 0) {
      console.error(
        "Failed to delete all items in a chunk after max retries.",
        {
          unprocessedCount: unprocessedItems.length,
        },
      );
    }
  }

  return totalDeleted;
}
