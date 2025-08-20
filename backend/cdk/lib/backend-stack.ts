import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as iam from "aws-cdk-lib/aws-iam";
import * as iot from "aws-cdk-lib/aws-iot";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";

export interface BackendStackProps extends cdk.StackProps {
  saveToDynamoFn: NodejsFunction;
  fetchFromDynamoFn: NodejsFunction;
  fetchUserTemperaturesFn: NodejsFunction;
  fetchUserTemperatureBoundsFn: NodejsFunction;
  userPool: cognito.IUserPool;
}

export class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id, props);
    const {
      saveToDynamoFn,
      fetchFromDynamoFn,
      fetchUserTemperaturesFn,
      fetchUserTemperatureBoundsFn,
      userPool,
    } = props;

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
      defaultCorsPreflightOptions: {
        allowOrigins: ["http://localhost:5173", "http://127.0.0.1:5173"], // kehityksessä
        allowMethods: ["GET", "OPTIONS"],
        allowHeaders: [
          "Content-Type",
          "Authorization",
          "X-Amz-Date",
          "X-Api-Key",
          "X-Amz-Security-Token",
        ],
      },
    });

    api.addGatewayResponse("Default4xxWithCors", {
      type: apigateway.ResponseType.DEFAULT_4XX,
      responseHeaders: {
        "Access-Control-Allow-Origin": "method.request.header.Origin",
        "Access-Control-Allow-Headers":
          "'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'",
        "Access-Control-Allow-Methods": "'GET,OPTIONS'",
      },
    });
    api.addGatewayResponse("Default5xxWithCors", {
      type: apigateway.ResponseType.DEFAULT_5XX,
      responseHeaders: {
        "Access-Control-Allow-Origin": "method.request.header.Origin",
        "Access-Control-Allow-Headers":
          "'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'",
        "Access-Control-Allow-Methods": "'GET,OPTIONS'",
      },
    });

    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(
      this,
      "CognitoAuthorizer",
      {
        cognitoUserPools: [userPool],
      }
    );

    api.root
      .addResource("readings")
      .addMethod("GET", new apigateway.LambdaIntegration(fetchFromDynamoFn), {
        apiKeyRequired: true,
      });

    api.root
      .addResource("user-readings")
      .addMethod(
        "GET",
        new apigateway.LambdaIntegration(fetchUserTemperaturesFn),
        {
          authorizer,
          authorizationType: apigateway.AuthorizationType.COGNITO,
          apiKeyRequired: false,
        }
      );
    api.root
      .addResource("bounds")
      .addMethod(
        "GET",
        new apigateway.LambdaIntegration(fetchUserTemperatureBoundsFn),
        {
          authorizer,
          authorizationType: apigateway.AuthorizationType.COGNITO,
          apiKeyRequired: false,
        }
      );

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
