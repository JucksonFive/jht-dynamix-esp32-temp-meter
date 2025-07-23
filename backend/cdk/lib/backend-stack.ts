import * as cdk from "aws-cdk-lib";
import * as dynamoDb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import * as iot from "aws-cdk-lib/aws-iot";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as path from "path";
import { Construct } from "constructs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";

export class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new iot.CfnThing(this, "Esp32Thing", {
      thingName: "esp32-sensor",
    });

    new iot.CfnPolicy(this, "Esp32Policy", {
      policyName: "Esp32SensorPolicy",
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "iot:Connect",
              "iot:Publish",
              "iot:Receive",
              "iot:Subscribe",
            ],
            Resource: "*",
          },
        ],
      },
    });
    const temperaturesTable = new dynamoDb.Table(this, "TemperaturesTable", {
      tableName: "Temperatures",
      partitionKey: { name: "deviceId", type: dynamoDb.AttributeType.STRING },
      sortKey: { name: "timestamp", type: dynamoDb.AttributeType.STRING },
      billingMode: dynamoDb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Dev environment only. Removes all the data!
    });

    const deviceUserTable = new dynamoDb.Table(this, "DeviceUserMapping", {
      tableName: "Devices",
      partitionKey: { name: "deviceId", type: dynamoDb.AttributeType.STRING },
      billingMode: dynamoDb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const saveToDynamoFn = new NodejsFunction(this, "SaveToDynamoFunction", {
      functionName: "SaveToDynamoFunction",
      entry: path.join(
        __dirname,
        "../../lambdas/postToDynamoDb/postToDynamo.ts"
      ),
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_22_X,
      environment: {
        TABLE_NAME: temperaturesTable.tableName,
      },
    });

    temperaturesTable.grantWriteData(saveToDynamoFn);
    deviceUserTable.grantReadData(saveToDynamoFn);
    // Lambda that fetches the data from DynamoDB
    const fetchfromDynamoFn = new NodejsFunction(
      this,
      "FetchFromDynamoFunction",
      {
        functionName: "FetchFromDynamoFunction",
        entry: path.join(
          __dirname,
          "../../lambdas/getFromDynamoDb/getAllTemperatures.ts"
        ),
        handler: "handler",
        runtime: lambda.Runtime.NODEJS_22_X,
        environment: {
          TABLE_NAME: temperaturesTable.tableName,
        },
      }
    );

    // Grant the Lambda function read access to the DynamoDB table
    // This is necessary for the Lambda function to be able to read from the DynamoDB table
    temperaturesTable.grantReadData(fetchfromDynamoFn);

    // API Gateway REST API
    const api = new apigateway.RestApi(this, "TemperatureApi", {
      restApiName: "Temperature Service",
      description: "This service serves temperature data.",
    });

    api.root
      .addResource("readings")
      .addMethod("GET", new apigateway.LambdaIntegration(fetchfromDynamoFn), {
        apiKeyRequired: true,
      });

    const apikey = api.addApiKey("Esp32ApiKey", {
      apiKeyName: "Esp32ApiKey",
      description: "API key for ESP32",
    });

    const usagePlan = api.addUsagePlan("UsagePlan", {
      name: "UsagePlan",
      description: "Usage plan for ESP32",
      throttle: {
        rateLimit: 10,
        burstLimit: 2,
      },
    });

    usagePlan.addApiStage({
      stage: api.deploymentStage,
    });
    usagePlan.addApiKey(apikey);

    const iotRuleRole = new iam.Role(this, "IoTRuleInvokeLambdaRole", {
      assumedBy: new iam.ServicePrincipal("iot.amazonaws.com"),
    });
    saveToDynamoFn.grantInvoke(iotRuleRole);

    // 🔹 Create IoT Topic Rule
    new iot.CfnTopicRule(this, "TemperatureRule", {
      ruleName: "temperature_rule",
      topicRulePayload: {
        sql: "SELECT * FROM 'sensors/temperature'",
        actions: [
          {
            lambda: {
              functionArn: saveToDynamoFn.functionArn,
            },
          },
        ],
        awsIotSqlVersion: "2016-03-23",
        ruleDisabled: false,
      },
      // @ts-expect-error: roleArn is not documented but required for Lambda actions
      roleArn: iotRuleRole.roleArn,
    });
    // 🔹 Explicit permission for IoT to invoke the Lambda function
    new lambda.CfnPermission(this, "AllowIoTInvokeLambda", {
      action: "lambda:InvokeFunction",
      functionName: saveToDynamoFn.functionName,
      principal: "iot.amazonaws.com",
      sourceArn: `arn:aws:iot:${this.region}:${this.account}:rule/temperature_rule`,
    });
  }
}
