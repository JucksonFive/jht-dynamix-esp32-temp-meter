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
  public readonly fetchUserTemperatureBoundsFn: NodejsFunction;
  public readonly deleteUserDeviceFn: NodejsFunction;
  public readonly authProtectedFn: lambda.Function;
  public readonly registerDeviceFn: NodejsFunction;

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

    // Lambda function for fetching first and last temperature readings
    this.fetchUserTemperatureBoundsFn = new NodejsFunction(
      this,
      "FetchUserTemperatureBoundsFunction",
      {
        functionName: "FetchUserTemperatureBoundsFunction",
        entry: path.join(
          __dirname,
          "../../lambdas/getReadingBounds/getReadingBounds.ts"
        ),
        handler: "handler",
        runtime: lambda.Runtime.NODEJS_22_X,
        environment: {
          TABLE_NAME: temperaturesTable.tableName,
          GSI_NAME: "userId-timestamp-index",
        },
      }
    );
    temperaturesTable.grantReadData(this.fetchUserTemperatureBoundsFn);

    // Lambda function for registering a device
    this.registerDeviceFn = new NodejsFunction(this, "RegisterDeviceFn", {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: path.join(
        __dirname,
        "../../lambdas/registerDevice/registerDevice.ts"
      ),
      environment: {
        DEVICES_TABLE: deviceUserTable.tableName,
      },
    });
    deviceUserTable.grantWriteData(this.registerDeviceFn);

    // Lambda function for deleting a user's device
    this.deleteUserDeviceFn = new NodejsFunction(
      this,
      "DeleteUserDeviceFunction",
      {
        functionName: "DeleteUserDeviceFunction",
        entry: path.join(
          __dirname,
          "../../lambdas/deleteDevice/deleteDevice.ts"
        ),
        handler: "handler",
        runtime: lambda.Runtime.NODEJS_22_X,
        environment: {
          TABLE_NAME: temperaturesTable.tableName,
          GSI_NAME: "userId-timestamp-index",
        },
      }
    );
    temperaturesTable.grantWriteData(this.deleteUserDeviceFn);

    // Auth protected Lambda function
    this.authProtectedFn = new NodejsFunction(this, "AuthProtectedLambda", {
      entry: path.join(__dirname, "../../lambdas/protected/index.ts"),
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_22_X,
      functionName: "AuthProtectedLambda",
    });
  }
}
