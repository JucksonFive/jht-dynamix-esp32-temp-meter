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

    function addDynamicCors(resource: apigateway.IResource) {
      resource.addMethod(
        "OPTIONS",
        new apigateway.MockIntegration({
          requestTemplates: { "application/json": '{"statusCode": 204}' },
          // Vastauksen headereihin peilataan Origin + Vary
          integrationResponses: [
            {
              statusCode: "204",
              responseParameters: {
                "method.response.header.Access-Control-Allow-Origin":
                  "method.request.header.Origin",
                "method.response.header.Access-Control-Allow-Methods":
                  "'GET,POST,PUT,DELETE,OPTIONS'",
                "method.response.header.Access-Control-Allow-Headers":
                  "'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'",
                "method.response.header.Access-Control-Allow-Credentials":
                  "'false'",
                "method.response.header.Vary":
                  "'Origin,Access-Control-Request-Method,Access-Control-Request-Headers'",
              },
            },
          ],
          passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
        }),
        {
          methodResponses: [
            {
              statusCode: "204",
              responseModels: {
                "application/json": apigateway.Model.EMPTY_MODEL,
              },
              responseParameters: {
                "method.response.header.Access-Control-Allow-Origin": true,
                "method.response.header.Access-Control-Allow-Methods": true,
                "method.response.header.Access-Control-Allow-Headers": true,
                "method.response.header.Access-Control-Allow-Credentials": true,
                "method.response.header.Vary": true,
              },
            },
          ],
          requestParameters: {
            "method.request.header.Origin": true,
            "method.request.header.Access-Control-Request-Method": false,
            "method.request.header.Access-Control-Request-Headers": false,
          },
        }
      );
    }

    const api = new apigateway.RestApi(this, "TemperatureApi", {
      restApiName: "Temperature Service",
      description: "This service serves temperature data.",
      defaultCorsPreflightOptions: {
        allowOrigins: [
          "http://localhost:5173",
          "http://127.0.0.1:5173",
          "https://app.jt-dynamix.com",
        ],
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
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
        "Access-Control-Allow-Methods": "GET,OPTIONS,DELETE,POST,PUT",
      },
    });

    api.addGatewayResponse("Default5xxWithCors", {
      type: apigateway.ResponseType.DEFAULT_5XX,
      responseHeaders: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
        "Access-Control-Allow-Methods": "GET,OPTIONS,DELETE,POST,PUT",
      },
    });

    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(
      this,
      "CognitoAuthorizer",
      {
        cognitoUserPools: [userPool],
      }
    );

    addDynamicCors(api.root);

    // /readings
    const readingsRes = api.root.addResource("readings");
    addDynamicCors(readingsRes);
    readingsRes.addMethod(
      "GET",
      new apigateway.LambdaIntegration(fetchFromDynamoFn),
      {
        apiKeyRequired: true,
      }
    );

    // /user-readings
    const userReadingsRes = api.root.addResource("user-readings");
    addDynamicCors(userReadingsRes);
    userReadingsRes.addMethod(
      "GET",
      new apigateway.LambdaIntegration(fetchUserTemperaturesFn),
      {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );
    const boundsRes = api.root.addResource("bounds");
    addDynamicCors(boundsRes);
    boundsRes.addMethod(
      "GET",
      new apigateway.LambdaIntegration(fetchUserTemperatureBoundsFn),
      {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );

    // /devices
    const devicesResource = api.root.addResource("devices");
    addDynamicCors(devicesResource);
    devicesResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(registerDeviceFn),
      {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );
    devicesResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getAllDevicesFn),
      {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );

    const delRes = api.root.addResource("delete-user-device");
    addDynamicCors(delRes);
    delRes.addMethod(
      "DELETE",
      new apigateway.LambdaIntegration(deleteUserDeviceFn),
      {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
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
