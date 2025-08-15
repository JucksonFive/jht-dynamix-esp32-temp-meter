import { Stack, StackProps, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";

export interface AuthStackProps extends StackProps {
  authProtectedFn: lambda.Function;
}

export class AuthStack extends Stack {
  public readonly userPool!: cognito.UserPool;
  public readonly userPoolClient!: cognito.UserPoolClient;
  constructor(scope: Construct, id: string, props: AuthStackProps) {
    super(scope, id, props);

    const { authProtectedFn } = props;

    const userPool = new cognito.UserPool(this, "UserPool", {
      selfSignUpEnabled: false,
      signInAliases: { email: true },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
    });

    const userPoolClient = new cognito.UserPoolClient(this, "UserPoolClient", {
      userPool,
      generateSecret: false,
      authFlows: {
        userSrp: true,
        userPassword: true,
      },
    });

    const api = new apigateway.RestApi(this, "AuthApi");

    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(
      this,
      "CognitoAuthorizer",
      {
        cognitoUserPools: [userPool],
      }
    );

    const protectedRoute = api.root.addResource("protected");
    protectedRoute.addMethod(
      "GET",
      new apigateway.LambdaIntegration(authProtectedFn),
      {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );

    new CfnOutput(this, "CognitoUserPoolId", { value: userPool.userPoolId });
    new CfnOutput(this, "CognitoUserPoolClientId", {
      value: userPoolClient.userPoolClientId,
    });
    new CfnOutput(this, "ApiUrl", { value: api.url });

    this.userPool = userPool;
    this.userPoolClient = userPoolClient;
  }
}
