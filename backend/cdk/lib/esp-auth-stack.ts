import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as path from "path";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";

interface EspAuthStackProps extends StackProps {
  userPoolId: string;
  clientId: string;
}

export class EspAuthStack extends Stack {
  constructor(scope: Construct, id: string, props: EspAuthStackProps) {
    super(scope, id, props);

    const loginLambda = new NodejsFunction(this, "EspLoginLambda", {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: path.join(__dirname, "../../lambdas/auth/index.ts"),
      handler: "handler",
      environment: {
        USER_POOL_ID: props.userPoolId,
        CLIENT_ID: props.clientId,
      },
    });

    const api = new apigateway.RestApi(this, "EspAuthApi", {
      restApiName: "EspAuthApi",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    const loginResource = api.root.addResource("auth").addResource("login");
    loginResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(loginLambda)
    );
  }
}
