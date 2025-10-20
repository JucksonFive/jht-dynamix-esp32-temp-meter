### Summary

This change introduces structured JSON logging to the `onDeviceMessage` Lambda function using the AWS Lambda Powertools for TypeScript. All log output will now be in a queryable format, and each log entry will be automatically enriched with the `deviceId` from the incoming message payload to improve debugging and monitoring.

### Implementation Plan

1.  **Add Dependency**: Add the `@aws-lambda-powertools/logger` package to `backend/package.json`.
2.  **Update Lambda Handler**: Modify `backend/lambdas/onDeviceMessage.ts` to:
    *   Import and instantiate the Powertools `Logger`.
    *   Extract the `deviceId` from the event payload and add it to the logger's persistent context.
    *   Replace all existing `console.log`, `console.info`, and `console.error` calls with the new structured logger methods (`logger.info`, `logger.error`).
3.  **Add Documentation**: Create a new file `backend/docs/LOG_QUERIES.md` to store example CloudWatch Logs Insights queries as specified in the ticket.

### Code Changes

```diff
diff --git a/backend/docs/LOG_QUERIES.md b/backend/docs/LOG_QUERIES.md
new file mode 100644
index 0000000..f6c0130
--- /dev/null
+++ b/backend/docs/LOG_QUERIES.md
@@ -0,0 +1,22 @@
+# CloudWatch Logs Insights Queries
+
+This document contains useful queries for analyzing structured logs from our Lambda functions in CloudWatch Logs Insights.
+
+## `onDeviceMessage` Lambda
+
+### Find all logs for a specific device
+
+This query is useful for tracing the entire execution flow for a message received from a single device.
+
+```sql
+fields @timestamp, @message, deviceId, level
+| filter deviceId = "test-device-123"
+| sort @timestamp desc
+```
+
+### Count all error-level logs from the function
+
+Use this query to quickly identify and quantify errors occurring within the function. This can be used to create CloudWatch Alarms.
+
+```sql
+filter level = "ERROR"
+| stats count(*)
+```

```

```diff
diff --git a/backend/lambdas/onDeviceMessage.ts b/backend/lambdas/onDeviceMessage.ts
index 5a7e8b6..33f8d5e 100644
--- a/backend/lambdas/onDeviceMessage.ts
+++ b/backend/lambdas/onDeviceMessage.ts
@@ -1,13 +1,18 @@
 import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
 import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
+import { Logger } from "@aws-lambda-powertools/logger";
 
 const client = new DynamoDBClient({});
 const docClient = DynamoDBDocumentClient.from(client);
 const temperaturesTableName = process.env.TEMPERATURES_TABLE_NAME;
 
+const logger = new Logger({
+  serviceName: "onDeviceMessage",
+});
+
 interface DeviceMessage {
   deviceId: string;
-  temperature: number;
+  temperature: number;
   timestamp: number;
 }
 
@@ -16,16 +21,21 @@
  * This function is triggered by an IoT Core rule when a device publishes a message.
  * It validates the message and stores it in the Temperatures DynamoDB table.
  */
-export const handler = async (event: DeviceMessage): Promise<void> => {
-  console.log("Received device message:", JSON.stringify(event));
+export const handler = async (event: DeviceMessage): Promise<void> => {  
+  // Add deviceId to all subsequent log messages
+  logger.appendKeys({
+    deviceId: event.deviceId,
+  });
+
+  logger.info("Received device message", { payload: event });
 
   if (!event.deviceId || typeof event.temperature === "undefined") {
-    console.error("Validation error: Missing deviceId or temperature", event);
+    logger.error("Validation error: Missing deviceId or temperature", { payload: event });
     return;
   }
 
   const now = Date.now();
-  const timestamp = event.timestamp && event.timestamp < now ? event.timestamp : now;
+  const timestamp = event.timestamp && event.timestamp < now ? event.timestamp : now;  
 
   const command = new PutCommand({
     TableName: temperaturesTableName,
@@ -38,9 +48,9 @@
   });
 
   try {
     await docClient.send(command);
-    console.info(`Successfully stored temperature reading for device: ${event.deviceId}`);
+    logger.info(`Successfully stored temperature reading`);
   } catch (error) {
-    console.error("Error storing temperature reading in DynamoDB", error);
+    logger.error("Error storing temperature reading in DynamoDB", error as Error);
     throw error; // Re-throw to indicate failure
   }
 };

```

```diff
diff --git a/backend/package.json b/backend/package.json
index 1a2b3c4..5d6e7f8 100644
--- a/backend/package.json
+++ b/backend/package.json
@@ -6,6 +6,7 @@
     "aws-cdk": "2.121.1",
     "aws-cdk-lib": "2.121.1",
     "constructs": "^10.0.0",
+    "@aws-lambda-powertools/logger": "^2.0.3",
     "dotenv": "^16.3.1",
     "esbuild": "^0.19.11",
     "source-map-support": "^0.5.21"

```

### Tests

#### Manual Verification Steps

1.  Deploy the updated `LambdaStack` to a development environment.
2.  Use the AWS IoT Core MQTT test client to publish a message to the topic that triggers the `onDeviceMessage` function.
    *   **Topic**: `device/+/data` (or as configured in your IoT Rule)
    *   **Payload (Success Case)**:
        ```json
        {
          "deviceId": "test-device-123",
          "temperature": 25.5,
          "timestamp": 1678886400000
        }
        ```
    *   **Payload (Error Case for validation)**:
        ```json
        {
          "temperature": 26.1
        }
        ```
3.  Navigate to the CloudWatch Log Group for the `onDeviceMessage` Lambda function.
4.  **Assert (Success)**: Observe that the latest log entries are in structured JSON format and each entry contains the key-value pair `"deviceId": "test-device-123"`.
5.  **Assert (Error)**: Observe a JSON log entry with `"level": "ERROR"` containing the validation error message.
6.  Navigate to **CloudWatch Logs Insights**.
7.  Select the function's log group and run the following queries:
    *   **Query 1**:
        ```sql
        fields @timestamp, @message, deviceId
        | filter deviceId = "test-device-123"
        | sort @timestamp desc
        ```
        **Assert**: The query returns the log entries from your test.
    *   **Query 2**:
        ```sql
        filter level = "ERROR"
        | stats count(*)
        ```
        **Assert**: The query returns a count of at least 1 after triggering the error case.
8.  Verify that the `backend/docs/LOG_QUERIES.md` file is present in the repository with the correct content.