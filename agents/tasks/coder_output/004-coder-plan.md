### Summary

This change automates the creation of the `dashboard/.env.local` file by capturing the backend CDK deployment outputs and transforming them into the required format. This streamlines developer setup by replacing a manual copy-paste process with a single deployment command.

### Implementation Plan

1.  **Assumption:** The ticket's suggestion to use `--outputs-file` to directly create a `.env.local` file is not feasible, as the CDK outputs JSON. This plan introduces a minimal Node.js script to perform the necessary JSON-to-dotenv transformation, fulfilling the ticket's intent.
2.  **Add CDK Outputs:** Add `CfnOutput` declarations to the `AuthStack` and `BackendStack` to expose the Cognito User Pool ID, Web Client ID, API Gateway URL, and AWS Region. I will assume these resources are defined in `backend/cdk/lib/auth-stack.ts` and `backend/cdk/lib/backend-stack.ts`.
3.  **Create Transformation Script:** Create a new script at `backend/scripts/generate-env.mjs` to read the `cdk-outputs.json` file, extract the required values, and write them to `dashboard/.env.local` in the correct `KEY=VALUE` format.
4.  **Update Deployment Script:** Add a new `deploy` script to `backend/package.json`. This script will run `cdk deploy` with the `--outputs-file` flag and then execute the new transformation script.
5.  **Update .gitignore:** Add `dashboard/.env.local` and `backend/cdk-outputs.json` to the root `.gitignore` file to prevent committing generated files.
6.  **Update Documentation:** Modify `backend/README.md` and `dashboard/README.md` to reflect the new, automated setup process.

### Code Changes

**1. Add CfnOutputs to CDK Stacks**

I'll assume the Cognito resources are in `auth-stack.ts` and the API Gateway is in `backend-stack.ts`.

```diff
diff --git a/backend/cdk/lib/auth-stack.ts b/backend/cdk/lib/auth-stack.ts
index XXXXXXX..XXXXXXX 100644
--- a/backend/cdk/lib/auth-stack.ts
+++ b/backend/cdk/lib/auth-stack.ts
@@ -1,5 +1,6 @@
 import * as cdk from "aws-cdk-lib";
 import { Construct } from "constructs";
+// ... other imports for Cognito
 
 export class AuthStack extends cdk.Stack {
   public readonly userPool: cdk.aws_cognito.UserPool;
@@ -8,5 +9,16 @@
   constructor(scope: Construct, id: string, props?: cdk.StackProps) {
     super(scope, id, props);
 
     // ... existing implementation for UserPool and UserPoolClient
+
+    new cdk.CfnOutput(this, "CognitoUserPoolId", {
+      value: this.userPool.userPoolId,
+      description: "Cognito User Pool ID for the dashboard",
+    });
+
+    new cdk.CfnOutput(this, "CognitoUserPoolWebClientId", {
+      value: this.userPoolClient.userPoolClientId,
+      description: "Cognito User Pool Web Client ID for the dashboard",
+    });
   }
 }
```

```diff
diff --git a/backend/cdk/lib/backend-stack.ts b/backend/cdk/lib/backend-stack.ts
index XXXXXXX..XXXXXXX 100644
--- a/backend/cdk/lib/backend-stack.ts
+++ b/backend/cdk/lib/backend-stack.ts
@@ -1,5 +1,6 @@
 import * as cdk from "aws-cdk-lib";
 import { Construct } from "constructs";
+// ... other imports for ApiGateway
 
 export class BackendStack extends cdk.Stack {
   constructor(scope: Construct, id: string, props?: cdk.StackProps) {
@@ -7,5 +8,16 @@
 
     // ... existing implementation for API Gateway, etc.
     // const api = new cdk.aws_apigateway.RestApi(...)
+
+    new cdk.CfnOutput(this, "ApiUrl", {
+      value: api.url, // Assuming `api` is your RestApi construct
+      description: "API Gateway endpoint URL for the dashboard",
+    });
+
+    new cdk.CfnOutput(this, "AwsRegion", {
+      value: this.region,
+      description: "AWS Region for the deployment",
+    });
   }
 }

```

**2. Create Transformation Script**

This is a new file to transform the JSON output from CDK into a `.env` file.

```diff
diff --git a/backend/scripts/generate-env.mjs b/backend/scripts/generate-env.mjs
new file mode 100644
index 0000000..b123abc
--- /dev/null
+++ b/backend/scripts/generate-env.mjs
@@ -0,0 +1,32 @@
+import { readFileSync, writeFileSync } from "fs";
+import { resolve, dirname } from "path";
+import { fileURLToPath } from "url";
+
+const __filename = fileURLToPath(import.meta.url);
+const __dirname = dirname(__filename);
+
+const cdkOutputsFile = resolve(__dirname, "../cdk-outputs.json");
+const dashboardEnvFile = resolve(__dirname, "../../dashboard/.env.local");
+
+try {
+  console.log(`Reading CDK outputs from ${cdkOutputsFile}...`);
+  const outputs = JSON.parse(readFileSync(cdkOutputsFile, "utf-8"));
+
+  // Flatten the outputs from all stacks into a single object for easier access
+  const flatOutputs = Object.values(outputs).reduce(
+    (acc, stackOutputs) => ({ ...acc, ...stackOutputs }),
+    {}
+  );
+
+  const envContent = [
+    `VITE_APP_AWS_REGION=${flatOutputs.AwsRegion}`,
+    `VITE_APP_COGNITO_USER_POOL_ID=${flatOutputs.CognitoUserPoolId}`,
+    `VITE_APP_COGNITO_USER_POOL_WEB_CLIENT_ID=${flatOutputs.CognitoUserPoolWebClientId}`,
+    `VITE_APP_API_URL=${flatOutputs.ApiUrl}`,
+  ].join("\n");
+
+  writeFileSync(dashboardEnvFile, envContent);
+  console.log(`✅ Successfully created/updated ${dashboardEnvFile}`);
+} catch (error) {
+  console.error("❌ Failed to generate .env.local file from CDK outputs.", error);
+  process.exit(1);
+}

```

**3. Update `backend/package.json`**

I'll add a `deploy` script and a `postdeploy` hook to run the new script.

```diff
diff --git a/backend/package.json b/backend/package.json
index XXXXXXX..XXXXXXX 100644
--- a/backend/package.json
+++ b/backend/package.json
@@ -5,11 +5,14 @@
   "scripts": {
     "build": "tsc",
     "watch": "tsc -w",
-    "test": "jest",
-    "cdk": "cdk"
+    "test": "jest",
+    "cdk": "cdk",
+    "deploy": "npm run cdk -- deploy --all --require-approval never --outputs-file ./cdk-outputs.json",
+    "postdeploy": "node scripts/generate-env.mjs"
   },
   "devDependencies": {
     "@types/jest": "^29.5.12",
+    // ... other dev dependencies
   },
   "dependencies": {
     "aws-cdk-lib": "2.150.0",

```

**4. Update `.gitignore`**

```diff
diff --git a/.gitignore b/.gitignore
index XXXXXXX..XXXXXXX 100644
--- a/.gitignore
+++ b/.gitignore
@@ -20,3 +20,7 @@
 # local env files
 .env
 .env.local
+.env.*.local
+
+# Generated files
+/dashboard/.env.local
+/backend/cdk-outputs.json

```

**5. Update Documentation**

```diff
diff --git a/backend/README.md b/backend/README.md
index XXXXXXX..XXXXXXX 100644
--- a/backend/README.md
+++ b/backend/README.md
@@ -26,16 +26,18 @@
 
 3.  **Deploy the Stacks**:
     ```bash
-    npm run cdk deploy --all
+    npm run deploy
     ```
 
-This will deploy all the necessary resources to your AWS account.
+This will deploy all the necessary resources to your AWS account and automatically create the `dashboard/.env.local` file required to run the frontend.
 
 ## Useful Commands
 
 -   `npm run build`: Compile TypeScript to JavaScript.
 -   `npm run watch`: Watch for changes and compile.
 -   `npm run test`: Run unit tests.
--   `npm run cdk deploy`: Deploy the specified stack.
+-   `npm run deploy`: Deploy all backend stacks and generate the dashboard environment file.
 -   `npm run cdk diff`: Compare the deployed stack with the current state.
 -   `npm run cdk synth`: Synthesize the CloudFormation template.

```

```diff
diff --git a/dashboard/README.md b/dashboard/README.md
index XXXXXXX..XXXXXXX 100644
--- a/dashboard/README.md
+++ b/dashboard/README.md
@@ -19,16 +19,9 @@
     ```
 
 2.  **Configure Environment Variables**:
-    Create a `.env.local` file in this directory and add the necessary AWS configuration, such as the Cognito User Pool ID, App Client ID, and API Gateway endpoint. You can get these values from the output of the CDK deployment.
-
-    ```
-    VITE_APP_AWS_REGION=<Your-AWS-Region>
-    VITE_APP_COGNITO_USER_POOL_ID=<Your-Cognito-User-Pool-ID>
-    VITE_APP_COGNITO_USER_POOL_WEB_CLIENT_ID=<Your-Cognito-App-Client-ID>
-    VITE_APP_API_URL=<Your-API-Gateway-Endpoint>
-    ```
+    The `dashboard/.env.local` file is automatically generated for you when you deploy the backend infrastructure. Simply run `npm run deploy` from the `backend` directory. This file will be created or updated with the correct configuration from your AWS environment.
 
 3.  **Run the Development Server**:
     ```bash
     npm run dev
```

### Tests

**Manual Verification Plan:**

1.  **Clean Slate:** Ensure no `dashboard/.env.local` or `backend/cdk-outputs.json` file exists.
2.  **Deploy Backend:** Navigate to the `backend` directory and run the new deployment command:
    ```bash
    npm run deploy
    ```
3.  **Verify File Creation:** Check that the `backend/cdk-outputs.json` file was created and contains the expected JSON structure with outputs from the deployed stacks.
4.  **Verify `.env.local`:** Check that the `dashboard/.env.local` file was created and contains the correct `VITE_APP_*` keys and their corresponding values, extracted from the JSON outputs.
5.  **Run Dashboard:** Navigate to the `dashboard` directory, install dependencies (`npm install`), and start the development server (`npm run dev`).
6.  **Confirm Functionality:** Open the dashboard in a browser. The application should load without errors, and you should be able to sign up, log in, and interact with the backend API, confirming that the environment variables are correct.
7.  **Verify Git Status:** Run `git status` from the repository root and confirm that `dashboard/.env.local` and `backend/cdk-outputs.json` are both correctly ignored.