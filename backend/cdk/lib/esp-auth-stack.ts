import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

export class EspAuthStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const loginLambda = new lambda.Function(this, "EspLoginLambda", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambdas/auth")),
      environment: {
        USER_POOL_ID: process.env.USER_POOL_ID!,
        CLIENT_ID: process.env.CLIENT_ID!
      }
    });

    const api = new apigateway.RestApi(this, "EspAuthApi", {
      restApiName: "EspAuthApi",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS
      }
    });

    const loginResource = api.root.addResource("auth").addResource("login");
    loginResource.addMethod("POST", new apigateway.LambdaIntegration(loginLambda));
  }
}
