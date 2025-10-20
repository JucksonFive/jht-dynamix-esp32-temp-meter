### Summary

This change introduces a feature for users to set custom temperature thresholds on their devices. A new backend endpoint is added to store this configuration, and the dashboard is updated to display a visual alert when the current temperature exceeds the user-defined limit.

### Implementation Plan

1.  **Backend Infrastructure (CDK):**
    *   Create a new Lambda function `updateDeviceConfigLambda` with permissions to update the `deviceUserTable`.
    *   File: `backend/cdk/lib/lambda-stack.ts`
2.  **Backend API (CDK):**
    *   Define a new API Gateway endpoint `PUT /devices/{deviceId}/config`.
    *   Integrate this endpoint with the new `updateDeviceConfigLambda`.
    *   File: `backend/cdk/lib/backend-stack.ts` (assuming this file manages API Gateway)
3.  **Backend Logic (Lambda):**
    *   Implement the handler for the new Lambda to validate input and update the `temperatureThreshold` attribute for a device in DynamoDB.
    *   File: `backend/lambdas/update-device-config.ts` (new file)
4.  **Frontend Types:**
    *   Update the `Device` type to include the optional `temperatureThreshold` property.
    *   File: `dashboard/src/types/index.ts` (assuming an existing types file)
5.  **Frontend API Service:**
    *   Add a new function to the API service layer for making the `PUT` request to update the device's configuration.
    *   File: `dashboard/src/services/api.ts` (assuming an existing API service file)
6.  **Frontend UI (Settings):**
    *   Add a form with a number input and save button to the device details view, allowing users to set and save the threshold.
    *   File: `dashboard/srcsrc/components/DeviceDetails.tsx` (hypothetical file for device settings)
7.  **Frontend UI (Display):**
    *   Update the device card component to apply a conditional CSS class to the temperature display if it exceeds the `temperatureThreshold`.
    *   File: `dashboard/src/components/DeviceCard.tsx` (hypothetical file for device display)

**Assumption:** The existing `GET` endpoint for fetching device data already returns all attributes from DynamoDB, so it will automatically include `temperatureThreshold` without any code changes.

### Code Changes

**1. Backend: CDK Infrastructure**

I'll first define the new Lambda function and grant it permissions in the `LambdaStack`.

```diff
diff --git a/backend/cdk/lib/lambda-stack.ts b/backend/cdk/lib/lambda-stack.ts
index abc1234..def5678 100644
--- a/backend/cdk/lib/lambda-stack.ts
+++ b/backend/cdk/lib/lambda-stack.ts
@@ -1,5 +1,6 @@
 import * as cdk from "aws-cdk-lib";
 import { Table } from "aws-cdk-lib/aws-dynamodb";
+import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
 import { Runtime } from "aws-cdk-lib/aws-lambda";
 import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
 import { Construct } from "constructs";
@@ -8,11 +9,14 @@
   temperaturesTable: Table;
   deviceUserTable: Table;
 }
-
 export class LambdaStack extends cdk.Stack {
   public readonly getDevicesLambda: NodejsFunction;
+  public readonly updateDeviceConfigLambda: NodejsFunction;
 
   constructor(scope: Construct, id: string, props: LambdaStackProps) {
     super(scope, id, props);
 
     // Assume existing getDevicesLambda definition is here...
+
+    this.updateDeviceConfigLambda = new NodejsFunction(
+      this,
+      "UpdateDeviceConfigFunction",
+      {
+        runtime: Runtime.NODEJS_20_X,
+        entry: "lambdas/update-device-config.ts",
+        handler: "handler",
+        environment: {
+          DEVICE_USER_TABLE_NAME: props.deviceUserTable.tableName,
+        },
+      },
+    );
+
+    props.deviceUserTable.grantReadWriteData(this.updateDeviceConfigLambda);
   }
 }

```

Next, I'll create the API Gateway endpoint in the `BackendStack` and connect it to the new Lambda. I will also need to update `backend.ts` to pass the new lambda to the `BackendStack`.

```diff
diff --git a/backend/cdk/lib/backend-stack.ts b/backend/cdk/lib/backend-stack.ts
index ghi9012..jkl3456 100644
--- a/backend/cdk/lib/backend-stack.ts
+++ b/backend/cdk/lib/backend-stack.ts
@@ -1,13 +1,18 @@
 import * as cdk from "aws-cdk-lib";
 import { LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";
 import { IFunction } from "aws-cdk-lib/aws-lambda";
 import { Construct } from "constructs";
 
 interface BackendStackProps extends cdk.StackProps {
   getDevicesLambda: IFunction;
+  updateDeviceConfigLambda: IFunction;
 }
 
 export class BackendStack extends cdk.Stack {
   constructor(scope: Construct, id: string, props: BackendStackProps) {
     super(scope, id, props);
 
     const api = new RestApi(this, "JHTApi", {
       // ... existing RestApi props
     });
 
     const devices = api.root.addResource("devices");
     devices.addMethod("GET", new LambdaIntegration(props.getDevicesLambda));
+
+    const deviceConfig = devices
+      .addResource("{deviceId}")
+      .addResource("config");
+    deviceConfig.addMethod(
+      "PUT",
+      new LambdaIntegration(props.updateDeviceConfigLambda),
+    );
   }
 }
```
```diff
diff --git a/backend/cdk/bin/backend.ts b/backend/cdk/bin/backend.ts
index mno7890..pqr1234 100644
--- a/backend/cdk/bin/backend.ts
+++ b/backend/cdk/bin/backend.ts
@@ -35,6 +35,13 @@
   temperaturesTable: infraStack.temperaturesTable,
   deviceUserTable: infraStack.deviceUserTable,
 });
+
+const backendStack = new BackendStack(app, "BackendStack", {
+  env: { account, region },
+  getDevicesLambda: lambdaStack.getDevicesLambda,
+  updateDeviceConfigLambda: lambdaStack.updateDeviceConfigLambda,
+});
+
 // Create auth stack with Lambda dependencies
 const authStack = new AuthStack(app, "AuthStack", {
```

**2. Backend: New Lambda Function**

This is the code for the new Lambda function that handles updating the device configuration.

```diff
diff --git a/backend/lambdas/update-device-config.ts b/backend/lambdas/update-device-config.ts
new file mode 100644
index 0000000..a1b2c3d
--- /dev/null
+++ b/backend/lambdas/update-device-config.ts
@@ -0,0 +1,52 @@
+import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
+import {
+  DynamoDBDocumentClient,
+  UpdateCommand,
+} from "@aws-sdk/lib-dynamodb";
+import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
+
+const client = new DynamoDBClient({});
+const docClient = DynamoDBDocumentClient.from(client);
+const tableName = process.env.DEVICE_USER_TABLE_NAME;
+
+export const handler = async (
+  event: APIGatewayProxyEvent,
+): Promise<APIGatewayProxyResult> => {
+  const { deviceId } = event.pathParameters || {};
+  if (!deviceId) {
+    return { statusCode: 400, body: "Missing deviceId" };
+  }
+
+  if (!event.body) {
+    return { statusCode: 400, body: "Missing request body" };
+  }
+
+  try {
+    const { temperatureThreshold } = JSON.parse(event.body);
+
+    if (typeof temperatureThreshold !== "number") {
+      return { statusCode: 400, body: "temperatureThreshold must be a number" };
+    }
+
+    const command = new UpdateCommand({
+      TableName: tableName,
+      Key: { deviceId },
+      UpdateExpression: "SET temperatureThreshold = :t",
+      ExpressionAttributeValues: {
+        ":t": temperatureThreshold,
+      },
+      ReturnValues: "UPDATED_NEW",
+    });
+
+    await docClient.send(command);
+
+    return {
+      statusCode: 200,
+      body: JSON.stringify({ message: "Configuration updated successfully" }),
+    };
+  } catch (error) {
+    console.error(error);
+    return { statusCode: 500, body: "Internal Server Error" };
+  }
+};

```

**3. Frontend: Types & API Service**

I'll update the frontend to be aware of the new data structure and API endpoint.

```diff
diff --git a/dashboard/src/types/index.ts b/dashboard/src/types/index.ts
index stu4567..vwx8901 100644
--- a/dashboard/src/types/index.ts
+++ b/dashboard/src/types/index.ts
@@ -1,6 +1,7 @@
 export interface Device {
   deviceId: string;
   name: string;
-  lastTemperature: number;
+  currentTemperature: number;
   lastSeen: string;
+  temperatureThreshold?: number;
 }
```
```diff
diff --git a/dashboard/src/services/api.ts b/dashboard/src/services/api.ts
index yza2345..bcd6789 100644
--- a/dashboard/src/services/api.ts
+++ b/dashboard/src/services/api.ts
@@ -1,5 +1,6 @@
 import axios from "axios";
 import { Device } from "../types";
+import { Auth } from "aws-amplify/auth";
 
 const apiClient = axios.create({
   baseURL: import.meta.env.VITE_APP_API_URL,
@@ -19,3 +20,15 @@
   const response = await apiClient.get<Device[]>("/devices");
   return response.data;
 };
+
+export const updateDeviceThreshold = async (
+  deviceId: string,
+  temperatureThreshold: number,
+): Promise<void> => {
+  const session = await Auth.currentSession();
+  const token = session.getIdToken().getJwtToken();
+  await apiClient.put(
+    `/devices/${deviceId}/config`,
+    { temperatureThreshold },
+    { headers: { Authorization: `Bearer ${token}` } },
+  );
+};

```

**4. Frontend: UI Components**

Finally, I'll add the UI for setting the threshold and the logic for displaying the alert.

```diff
diff --git a/dashboard/src/components/DeviceDetails.tsx b/dashboard/src/components/DeviceDetails.tsx
new file mode 100644
index 0000000..e4f5g6h
--- /dev/null
+++ b/dashboard/src/components/DeviceDetails.tsx
@@ -0,0 +1,50 @@
+import React, { useState } from "react";
+import { Device } from "../types";
+import { updateDeviceThreshold } from "../services/api";
+
+interface DeviceDetailsProps {
+  device: Device;
+  onConfigSave: (updatedDevice: Device) => void;
+}
+
+export const DeviceDetails: React.FC<DeviceDetailsProps> = ({
+  device,
+  onConfigSave,
+}) => {
+  const [threshold, setThreshold] = useState(
+    device.temperatureThreshold?.toString() || "",
+  );
+  const [isLoading, setIsLoading] = useState(false);
+
+  const handleSave = async () => {
+    const numericThreshold = parseFloat(threshold);
+    if (isNaN(numericThreshold)) {
+      alert("Please enter a valid number.");
+      return;
+    }
+    setIsLoading(true);
+    try {
+      await updateDeviceThreshold(device.deviceId, numericThreshold);
+      onConfigSave({ ...device, temperatureThreshold: numericThreshold });
+      alert("Threshold saved!");
+    } catch (error) {
+      console.error("Failed to save threshold", error);
+      alert("Failed to save. Please try again.");
+    } finally {
+      setIsLoading(false);
+    }
+  };
+
+  return (
+    <div className="p-4 border rounded-lg mt-4">
+      <h3 className="font-bold text-lg">Device Settings</h3>
+      <label htmlFor="temp-threshold" className="block mt-2">
+        Temperature Threshold (°C)
+      </label>
+      <input
+        id="temp-threshold"
+        type="number"
+        step="0.1"
+        value={threshold}
+        onChange={(e) => setThreshold(e.target.value)}
+        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
+        placeholder="e.g., 25.5"
+      />
+      <button
+        onClick={handleSave}
+        disabled={isLoading}
+        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
+      >
+        {isLoading ? "Saving..." : "Save"}
+      </button>
+    </div>
+  );
+};

```
```diff
diff --git a/dashboard/src/components/DeviceCard.tsx b/dashboard/src/components/DeviceCard.tsx
index hij7890..klm1234 100644
--- a/dashboard/src/components/DeviceCard.tsx
+++ b/dashboard/src/components/DeviceCard.tsx
@@ -1,15 +1,24 @@
 import React from "react";
 import { Device } from "../types";
 
 interface DeviceCardProps {
   device: Device;
 }
 
 export const DeviceCard: React.FC<DeviceCardProps> = ({ device }) => {
+  const isOverThreshold =
+    device.temperatureThreshold !== undefined &&
+    device.currentTemperature > device.temperatureThreshold;
+
+  const tempColor = isOverThreshold ? "text-red-500" : "text-gray-900";
+
   return (
     <div className="p-4 border rounded-lg shadow-sm">
       <h2 className="text-xl font-bold">{device.name}</h2>
       <p className="text-sm text-gray-500">{device.deviceId}</p>
-      <p className="text-3xl font-light mt-2">{device.lastTemperature}°C</p>
+      <p className={`text-3xl font-light mt-2 ${tempColor}`}>
+        {device.currentTemperature.toFixed(1)}°C
+      </p>
       <p className="text-xs text-gray-400 mt-2">
         Last seen: {new Date(device.lastSeen).toLocaleString()}
       </p>
     </div>
   );
 };

```

### Tests

1.  **Backend Automated Tests:**
    *   Deploy the CDK changes to a development environment.
    *   Create a new unit test for the `update-device-config` Lambda to mock the DynamoDB client and verify:
        *   It returns a `400` error if `deviceId` is missing.
        *   It returns a `400` error if the request body is missing or if `temperatureThreshold` is not a number.
        *   It correctly calls the `UpdateCommand` with the right parameters on a valid request.

2.  **Manual Frontend Tests:**
    *   **Configuration:**
        1.  Navigate to a device's detail page.
        2.  Verify the "Temperature Threshold" input field and "Save" button are visible.
        3.  Enter a non-numeric value (e.g., "abc") and click "Save". An alert or validation message should appear, and no API call should be made (check browser developer tools).
        4.  Enter a valid number (e.g., `25.5`) and click "Save".
        5.  Verify a `PUT` request is sent to `/devices/{deviceId}/config` with the correct payload.
        6.  Reload the page and confirm the saved value (`25.5`) is still in the input field.
    *   **Visual Alerting:**
        1.  Set a threshold (e.g., `30`).
        2.  Find a device with a temperature *below* the threshold (e.g., `28°C`). Verify its temperature is displayed in the standard color.
        3.  Find a device with a temperature *at* the threshold (`30°C`). Verify its temperature is displayed in the standard color.
        4.  Find a device with a temperature *above* the threshold (e.g., `31°C`). Verify its temperature is displayed in red.
        5.  Clear the threshold value for a device, save, and ensure its temperature reading returns to the standard color regardless of its value.