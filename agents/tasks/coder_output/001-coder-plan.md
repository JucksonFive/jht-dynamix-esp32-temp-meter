### Summary

This change introduces a C4 container diagram documenting the core IoT data ingestion flow. A new Markdown file containing the Mermaid diagram is added to `backend/docs/architecture`, and the main backend `README.md` is updated to link to this new documentation.

### Implementation Plan

1.  Create a new directory structure `backend/docs/architecture/`.
2.  Add a new file `c4-iot-data-ingestion.md` inside this directory. This file will contain a title, a brief explanation, and the Mermaid syntax for the C4 diagram.
3.  Update `backend/README.md` to add a new "Architecture Documentation" section with a link to the new diagram file and a note about viewing Mermaid diagrams.

### Code Changes

```diff
--- /dev/null
+++ b/backend/docs/architecture/c4-iot-data-ingestion.md
@@ -0,0 +1,19 @@
+# IoT Data Ingestion Flow
+
+This document provides a C4 (Level 2) container diagram illustrating the primary data ingestion path for a sensor reading from an ESP32 device to the database. This "happy path" view is intended to help developers understand the core components and their interactions within the AWS serverless backend.
+
+```mermaid
+C4Container
+    title C4 Container Diagram for IoT Data Ingestion
+
+    System_Ext(esp32, "ESP32 Firmware", "Reads sensor and publishes data")
+
+    System_Boundary(aws, "AWS Cloud") {
+        Container(iotCore, "AWS IoT Core", "MQTT Broker", "Receives and routes device data")
+        Container(dataLambda, "Data Processing Lambda", "TypeScript", "Parses and stores incoming data")
+        ContainerDb(dynamoDb, "Temperatures Table", "DynamoDB", "Stores time-series sensor readings")
+    }
+
+    Rel(esp32, iotCore, "Publishes sensor data", "MQTT")
+    Rel(iotCore, dataLambda, "Invokes via IoT Rule", "JSON")
+    Rel(dataLambda, dynamoDb, "Writes temperature reading", "AWS SDK")
+```

```
```diff
--- a/backend/README.md
+++ b/backend/README.md
@@ -13,6 +13,15 @@
 -   `cdk/`: Contains the CDK stacks that define the AWS resources.
     -   `lib/`: The CDK construct library where the stacks are defined.
     -   `bin/`: The entry point for the CDK application.
 -   `lambdas/`: Contains the source code for the Lambda functions.
 
+## Architecture Documentation
+
+A high-level diagram of the core data ingestion flow is available to help with developer onboarding and system understanding.
+
+-   [C4 Diagram: IoT Data Ingestion Flow](./docs/architecture/c4-iot-data-ingestion.md)
+
+> **Note:** To view the diagram, you may need a browser extension or an IDE plugin that supports rendering Mermaid syntax, such as the one built into GitHub, GitLab, or VS Code's "Markdown Preview Mermaid Support".
+
 ## Deployment
 
 To deploy the backend infrastructure, you need to have the AWS CDK installed and configured with your AWS account.

```

### Tests

1.  **Render Check:** Open the `backend/docs/architecture/c4-iot-data-ingestion.md` file in a Mermaid-compatible viewer (like the GitHub web UI or a local VS Code preview) and confirm the diagram renders correctly.
2.  **Link Check:** Open the modified `backend/README.md` in a previewer and click the new link to ensure it navigates to the diagram file.
3.  **Accuracy Review:** Have a team member familiar with the architecture review the diagram to confirm it accurately represents the data flow from the ESP32 device through AWS IoT Core, a processing Lambda, and into the DynamoDB table.