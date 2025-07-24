import * as cdk from "aws-cdk-lib";
import * as dynamoDb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import * as iot from "aws-cdk-lib/aws-iot";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";

export interface BackendStackProps extends cdk.StackProps {
  saveToDynamoFn: NodejsFunction;
  fetchFromDynamoFn: NodejsFunction;
}

export class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id, props);

    const { saveToDynamoFn, fetchFromDynamoFn } = props;

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

    // API Gateway REST API
    const api = new apigateway.RestApi(this, "TemperatureApi", {
      restApiName: "Temperature Service",
      description: "This service serves temperature data.",
    });

    api.root
      .addResource("readings")
      .addMethod("GET", new apigateway.LambdaIntegration(fetchFromDynamoFn), {
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
