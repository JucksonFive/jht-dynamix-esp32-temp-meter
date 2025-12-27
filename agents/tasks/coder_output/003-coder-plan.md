### 1. Summary

This change transitions our DynamoDB tables from provisioned throughput to on-demand capacity mode. This update within our AWS CDK infrastructure code will optimize costs and improve scalability by removing the need for manual capacity management.

### 2. Implementation Plan

1.  Navigate to the CDK infrastructure definition file located at `backend/cdk/lib/infrastructure-stack.ts`.
2.  Locate the `aws_dynamodb.Table` construct for the `temperaturesTable`.
3.  Modify its properties to set `billingMode` to `dynamodb.BillingMode.ON_DEMAND` and remove the `readCapacity` and `writeCapacity` properties.
4.  Locate the `aws_dynamodb.Table` construct for the `deviceUserTable`.
5.  Apply the same change: set `billingMode` to `dynamodb.BillingMode.ON_DEMAND` and remove the `readCapacity` and `writeCapacity` properties.
6.  Generate a CDK snapshot test update to reflect the infrastructure changes.

### 3. Code Changes

```diff
diff --git a/backend/cdk/lib/infrastructure-stack.ts b/backend/cdk/lib/infrastructure-stack.ts
index f1a2b3c..d4e5f6g 100644
--- a/backend/cdk/lib/infrastructure-stack.ts
+++ b/backend/cdk/lib/infrastructure-stack.ts
@@ -13,9 +13,7 @@
     this.temperaturesTable = new dynamodb.Table(this, "TemperaturesTable", {
       partitionKey: { name: "deviceId", type: dynamodb.AttributeType.STRING },
       sortKey: { name: "timestamp", type: dynamodb.AttributeType.STRING },
-      billingMode: dynamodb.BillingMode.PROVISIONED,
-      readCapacity: 1,
-      writeCapacity: 1,
+      billingMode: dynamodb.BillingMode.ON_DEMAND,
       removalPolicy: cdk.RemovalPolicy.RETAIN,
       timeToLiveAttribute: "ttl",
     });
@@ -23,10 +21,8 @@
     this.deviceUserTable = new dynamodb.Table(this, "DeviceUserTable", {
       partitionKey: { name: "deviceId", type: dynamodb.AttributeType.STRING },
-      billingMode: dynamodb.BillingMode.PROVISIONED,
-      readCapacity: 1,
-      writeCapacity: 1,
+      billingMode: dynamodb.BillingMode.ON_DEMAND,
       removalPolicy: cdk.RemovalPolicy.RETAIN,
     });
 

```

### 4. Tests

#### Automated Tests

1.  Navigate to the `backend/cdk` directory.
2.  Run the test suite: `npm test`.
3.  If snapshot tests exist and fail due to this intended change, update the snapshots by running: `npm test -- -u`.
4.  Review the updated snapshot in `backend/cdk/test/infrastructure-stack.test.ts.snap` to ensure it correctly reflects the change to `BillingMode: 'ON_DEMAND'` and the removal of capacity properties.

#### Manual Tests

1.  From the `backend/cdk` directory, run `cdk diff InfrastructureStack` to preview the changes and confirm they are limited to the DynamoDB tables' billing mode.
2.  Deploy the stack to the `staging` environment: `cdk deploy InfrastructureStack --profile <staging-profile>`.
3.  Log in to the AWS Management Console for the staging account.
4.  Navigate to DynamoDB and select the `InfrastructureStack-TemperaturesTable...` and `InfrastructureStack-DeviceUserTable...` tables.
5.  On the "Overview" tab for each table, verify that the "Capacity mode" is set to "On-demand".
6.  Monitor the CloudWatch metrics for both tables, specifically `ThrottledWriteRequests` and `ThrottledReadRequests`, to ensure they remain at zero after the change.
7.  After successful validation in staging, repeat the deployment and verification steps for the production environment.