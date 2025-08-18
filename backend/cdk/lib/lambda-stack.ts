import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamoDb from "aws-cdk-lib/aws-dynamodb";
import * as path from "path";
import { Construct } from "constructs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";

export interface LambdaStackProps extends cdk.StackProps {
  temperaturesTable: dynamoDb.Table;
  deviceUserTable: dynamoDb.Table;
}

export class LambdaStack extends cdk.Stack {
  public readonly saveToDynamoFn: NodejsFunction;
  public readonly fetchFromDynamoFn: NodejsFunction;
  public readonly fetchUserTemperaturesFn: NodejsFunction;
  public readonly authProtectedFn: lambda.Function;

  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    const { temperaturesTable, deviceUserTable } = props;

    // Lambda function for saving temperature data to DynamoDB
    this.saveToDynamoFn = new NodejsFunction(this, "SaveToDynamoFunction", {
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

    // Grant permissions for the save function
    temperaturesTable.grantWriteData(this.saveToDynamoFn);
    deviceUserTable.grantReadData(this.saveToDynamoFn);

    // Lambda function for fetching temperature data from DynamoDB
    this.fetchFromDynamoFn = new NodejsFunction(
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

    // Grant read permissions for the fetch function
    temperaturesTable.grantReadData(this.fetchFromDynamoFn);

    // Lambda function for fetching temperature data by userId via GSI (userId-timestamp-index)
    this.fetchUserTemperaturesFn = new NodejsFunction(
      this,
      "FetchUserTemperaturesFunction",
      {
        functionName: "FetchUserTemperaturesFunction",
        entry: path.join(
          __dirname,
          "../../lambdas/getFromDynamoDb/getUserTemperatures.ts"
        ),
        handler: "handler",
        runtime: lambda.Runtime.NODEJS_22_X,
        environment: {
          TABLE_NAME: temperaturesTable.tableName,
          GSI_NAME: "userId-timestamp-index",
        },
      }
    );
    temperaturesTable.grantReadData(this.fetchUserTemperaturesFn);

    // Auth protected Lambda function
    this.authProtectedFn = new NodejsFunction(this, "AuthProtectedLambda", {
      entry: path.join(__dirname, "../../lambdas/protected/index.ts"),
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_22_X,
      functionName: "AuthProtectedLambda",
    });
  }
}
