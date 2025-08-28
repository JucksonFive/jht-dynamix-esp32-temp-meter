import * as cdk from "aws-cdk-lib";
import * as dynamoDb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

export class InfrastructureStack extends cdk.Stack {
  public readonly temperaturesTable: dynamoDb.Table;
  public readonly deviceUserTable: dynamoDb.Table;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB table for storing temperature readings
    this.temperaturesTable = new dynamoDb.Table(this, "TemperaturesTable", {
      tableName: "Temperatures",
      partitionKey: { name: "deviceId", type: dynamoDb.AttributeType.STRING },
      sortKey: { name: "timestamp", type: dynamoDb.AttributeType.STRING },
      billingMode: dynamoDb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    // DynamoDB table for storing Devices
    this.deviceUserTable = new dynamoDb.Table(this, "DevicesTable", {
      tableName: "Devices",
      partitionKey: { name: "userId", type: dynamoDb.AttributeType.STRING },
      sortKey: { name: "deviceId", type: dynamoDb.AttributeType.STRING },
      billingMode: dynamoDb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    // Global secondary index for querying readings by userId and timestamp
    this.temperaturesTable.addGlobalSecondaryIndex({
      indexName: "userId-timestamp-index",
      partitionKey: { name: "userId", type: dynamoDb.AttributeType.STRING },
      sortKey: { name: "timestamp", type: dynamoDb.AttributeType.STRING },
      projectionType: dynamoDb.ProjectionType.ALL,
    });
  }
}
