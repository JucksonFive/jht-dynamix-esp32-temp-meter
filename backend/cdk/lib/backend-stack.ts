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
  registerDeviceFn: NodejsFunction;
  getAllDevicesFn: NodejsFunction;
  fetchUserTemperatureBoundsFn: NodejsFunction;
  deleteUserDeviceFn: NodejsFunction;
  updateDeviceStatusFn: NodejsFunction;
  getDashboardConfigFn: NodejsFunction;
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
      getAllDevicesFn,
      registerDeviceFn,
      deleteUserDeviceFn,
      updateDeviceStatusFn,
      getDashboardConfigFn,
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

    const api = new apigateway.RestApi(this, "TemperatureApi", {
      restApiName: "Temperature Service",
      description: "This service serves temperature data.",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: apigateway.Cors.DEFAULT_HEADERS.concat([
          "X-Amz-Date",
          "X-Api-Key",
          "X-Amz-Security-Token",
          "Authorization",
        ]),
      },
    });

    api.addGatewayResponse("Default4xxWithCors", {
      type: apigateway.ResponseType.DEFAULT_4XX,
      responseHeaders: {
        "method.response.header.Access-Control-Allow-Origin": "'*'",
        "method.response.header.Access-Control-Allow-Headers":
          "'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'",
        "method.response.header.Access-Control-Allow-Methods":
          "'GET,OPTIONS,DELETE,POST,PUT'",
      },
    });

    api.addGatewayResponse("Default5xxWithCors", {
      type: apigateway.ResponseType.DEFAULT_5XX,
      responseHeaders: {
        "method.response.header.Access-Control-Allow-Origin": "'*'",
        "method.response.header.Access-Control-Allow-Headers":
          "'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'",
        "method.response.header.Access-Control-Allow-Methods":
          "'GET,OPTIONS,DELETE,POST,PUT'",
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

    const devicesResource = api.root.addResource("devices");

    devicesResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(registerDeviceFn),
      {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        apiKeyRequired: false,
      }
    );

    devicesResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getAllDevicesFn),
      {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        apiKeyRequired: false,
      }
    );

    // Public endpoint to provide dashboard configuration
    api.root
      .addResource("config")
      .addMethod(
        "GET",
        new apigateway.LambdaIntegration(getDashboardConfigFn),
        {
          apiKeyRequired: false,
        }
      );

    api.root
      .addResource("delete-user-device")
      .addMethod(
        "DELETE",
        new apigateway.LambdaIntegration(deleteUserDeviceFn),
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

    // 🔹 IoT Rule Role for device status updates
    const iotStatusRuleRole = new iam.Role(this, "IoTStatusRuleRole", {
      assumedBy: new iam.ServicePrincipal("iot.amazonaws.com"),
    });
    updateDeviceStatusFn.grantInvoke(iotStatusRuleRole);

    // 🔹 Create IoT Topic Rule for device status
    new iot.CfnTopicRule(this, "DeviceStatusRule", {
      ruleName: "device_status_rule",
      topicRulePayload: {
        sql: "SELECT * FROM 'devices/+/status'",
        actions: [
          {
            lambda: {
              functionArn: updateDeviceStatusFn.functionArn,
            },
          },
        ],
        awsIotSqlVersion: "2016-03-23",
        ruleDisabled: false,
      },
      // @ts-expect-error: roleArn is not documented but required for Lambda actions
      roleArn: iotStatusRuleRole.roleArn,
    });

    // 🔹 Explicit permission for IoT to invoke the device status Lambda
    new lambda.CfnPermission(this, "AllowIoTInvokeStatusLambda", {
      action: "lambda:InvokeFunction",
      functionName: updateDeviceStatusFn.functionName,
      principal: "iot.amazonaws.com",
      sourceArn: `arn:aws:iot:${this.region}:${this.account}:rule/device_status_rule`,
    });

    new cdk.CfnOutput(this, "TemperatureApiUrl", {
      value: api.url,
      description: "API Gateway endpoint URL for the dashboard",
    });
    new cdk.CfnOutput(this, "AwsRegion", {
      value: this.region,
      description: "AWS region for the deployment",
    });
  }
}
