### Summary

This change introduces a Dead-Letter Queue (DLQ) to capture failed messages from our primary data ingestion Lambda, `saveToDynamoFn`. An associated CloudWatch alarm is also created to notify the engineering team via a new SNS topic when messages accumulate in this queue, preventing silent data loss.

### Implementation Plan

1.  **Create DLQ and Alarm Resources:**
    *   In `backend/cdk/lib/infrastructure-stack.ts`, define a new SQS queue to serve as the DLQ with a 14-day retention period.
    *   Create a new SNS topic for alarm notifications.
    *   Add a CloudWatch alarm that monitors the DLQ's `ApproximateNumberOfMessagesVisible` metric and triggers the SNS topic if the count is greater than 0 for 5 minutes.
    *   Expose the new DLQ as a public property on the `InfrastructureStack`.

2.  **Connect DLQ to Lambda:**
    *   Update the `LambdaStackProps` interface in `backend/cdk/lib/lambda-stack.ts` to accept the DLQ.
    *   In the `LambdaStack` constructor, configure the `saveToDynamoFn` function with the `deadLetterQueue` property, pointing to the queue passed in via props.

3.  **Wire Stacks Together:**
    *   In `backend/cdk/bin/backend.ts`, pass the newly created `ingestionDeadLetterQueue` from the `infraStack` instance to the `lambdaStack` instance during its construction.

### Code Changes

```diff
diff --git a/backend/cdk/bin/backend.ts b/backend/cdk/bin/backend.ts
index e545dd0..f6f6991 100644
--- a/backend/cdk/bin/backend.ts
+++ b/backend/cdk/bin/backend.ts
@@ -48,6 +48,7 @@
 const lambdaStack = new LambdaStack(app, "LambdaStack", {
   env: { account, region },
   temperaturesTable: infraStack.temperaturesTable,
+  ingestionDeadLetterQueue: infraStack.ingestionDeadLetterQueue,
   deviceUserTable: infraStack.deviceUserTable,
   dashboardEnvSecret: infraStack.dashboardEnvSecret,
 });

```

```diff
--- a/backend/cdk/lib/infrastructure-stack.ts
+++ b/backend/cdk/lib/infrastructure-stack.ts
@@ -1,13 +1,25 @@
 import * as cdk from "aws-cdk-lib";
+import { Duration } from "aws-cdk-lib";
+import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
+import * as cw_actions from "aws-cdk-lib/aws-cloudwatch-actions";
 import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
 import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
+import * as sns from "aws-cdk-lib/aws-sns";
+import * as subscriptions from "aws-cdk-lib/aws-sns-subscriptions";
+import * as sqs from "aws-cdk-lib/aws-sqs";
 import { Construct } from "constructs";
 
 export class InfrastructureStack extends cdk.Stack {
   public readonly temperaturesTable: dynamodb.Table;
   public readonly deviceUserTable: dynamodb.Table;
   public readonly dashboardEnvSecret: secretsmanager.Secret;
+  public readonly ingestionDeadLetterQueue: sqs.Queue;
 
   constructor(scope: Construct, id: string, props?: cdk.StackProps) {
     super(scope, id, props);
@@ -53,5 +65,42 @@
       secretName: "dashboard-env-vars",
       generateSecretString: { secretStringTemplate: "{}", generateStringKey: "placeholder" },
     });
+
+    // Dead-letter queue for ingestion Lambda failures
+    this.ingestionDeadLetterQueue = new sqs.Queue(this, "IngestionDeadLetterQueue", {
+      retentionPeriod: Duration.days(14),
+      encryption: sqs.QueueEncryption.KMS_MANAGED,
+    });
+
+    // An SNS topic for CloudWatch alarms
+    const alarmsTopic = new sns.Topic(this, "AlarmsTopic", {
+      displayName: "JHT-Dynamix Alarms",
+    });
+
+    // Add an email subscription. The recipient must confirm the subscription.
+    alarmsTopic.addSubscription(
+      new subscriptions.EmailSubscription("your-team-email@example.com")
+    );
+
+    // Alarm for messages in the ingestion DLQ
+    const dlqAlarm = new cloudwatch.Alarm(this, "IngestionDlqAlarm", {
+      metric: this.ingestionDeadLetterQueue.metricApproximateNumberOfMessagesVisible({
+        period: Duration.minutes(1),
+        statistic: "Sum",
+      }),
+      threshold: 0,
+      evaluationPeriods: 5,
+      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
+      alarmDescription:
+        "Alarm if there are any messages in the data ingestion Dead-Letter Queue for 5 minutes.",
+      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
+    });
+
+    dlqAlarm.addAlarmAction(new cw_actions.SnsAction(alarmsTopic));
+
+    new cdk.CfnOutput(this, "AlarmsSnsTopicArn", {
+      value: alarmsTopic.topicArn,
+      description: "SNS Topic ARN for CloudWatch Alarms",
+    });
   }
 }

```

```diff
--- a/backend/cdk/lib/lambda-stack.ts
+++ b/backend/cdk/lib/lambda-stack.ts
@@ -1,13 +1,15 @@
 import * as cdk from "aws-cdk-lib";
 import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
 import * as iam from "aws-cdk-lib/aws-iam";
 import * as lambda from "aws-cdk-lib/aws-lambda";
 import * as lambdaNode from "aws-cdk-lib/aws-lambda-nodejs";
 import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
+import * as sqs from "aws-cdk-lib/aws-sqs";
 import { Construct } from "constructs";
 
 export interface LambdaStackProps extends cdk.StackProps {
   readonly temperaturesTable: dynamodb.Table;
+  readonly ingestionDeadLetterQueue: sqs.Queue;
   readonly deviceUserTable: dynamodb.Table;
   readonly dashboardEnvSecret: secretsmanager.Secret;
 }
@@ -37,6 +39,7 @@
       runtime: lambda.Runtime.NODEJS_20_X,
       handler: "handler",
       entry: "src/handlers/save-to-dynamo.ts",
+      deadLetterQueue: props.ingestionDeadLetterQueue,
       environment: {
         TABLE_NAME: props.temperaturesTable.tableName,
       },

```

### Tests

#### Automated Tests

1.  Run `cdk synth` on the `BackendStack` and review the synthesized CloudFormation template.
2.  **Assert** that a new `AWS::SQS::Queue` resource is created.
3.  **Assert** that a new `AWS::SNS::Topic` and `AWS::SNS::Subscription` are created.
4.  **Assert** that a new `AWS::CloudWatch::Alarm` is created, monitoring the `ApproximateNumberOfMessagesVisible` metric of the new SQS queue.
5.  **Assert** that the `AWS::Lambda::Function` resource for `saveToDynamoFn` now includes a `DeadLetterConfig` property pointing to the ARN of the new SQS queue.
6.  **Assert** that the Lambda's IAM Role (`AWS::IAM::Role`) includes a policy with the `sqs:SendMessage` action for the new SQS queue's ARN.

#### Manual Tests

1.  Deploy the updated CDK stacks to a development environment.
2.  Confirm the new email subscription for the SNS topic by clicking the link in the confirmation email sent to `your-team-email@example.com`.
3.  Manually invoke the `saveToDynamoFn` Lambda function with a test event designed to cause an unhandled exception (e.g., a malformed JSON payload).
4.  Navigate to the SQS console in the AWS Management Console.
5.  Verify that the failed message appears in the `IngestionDeadLetterQueue`.
6.  Wait approximately 5-6 minutes.
7.  Navigate to the CloudWatch Alarms console and verify that the `IngestionDlqAlarm` has transitioned to the `ALARM` state.
8.  Check your email inbox to confirm that a notification email from the alarm was received via the SNS topic.