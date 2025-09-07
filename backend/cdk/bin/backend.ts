#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import * as dotenv from "dotenv";
import { AuthStack } from "../lib/auth-stack";
import { BackendStack } from "../lib/backend-stack";
import { DashboardHostingStack } from "../lib/dashboard-hosting-stack";
import { EspAuthStack } from "../lib/esp-auth-stack";
import { InfrastructureStack } from "../lib/infrastructure-stack";
import { LambdaStack } from "../lib/lambda-stack";

dotenv.config({ path: "../.env" });
const app = new cdk.App();

const domainName = process.env.DOMAIN_NAME!;
const subdomain = process.env.SUBDOMAIN!;
const siteDomain = `${subdomain}.${domainName}`;
const region = process.env.AWS_REGION!;
const account = process.env.CDK_DEFAULT_ACCOUNT;

// Create infrastructure stack with DynamoDB tables first
const infraStack = new InfrastructureStack(app, "InfrastructureStack");

// Create Lambda stack with table dependencies
const lambdaStack = new LambdaStack(app, "LambdaStack", {
  temperaturesTable: infraStack.temperaturesTable,
  deviceUserTable: infraStack.deviceUserTable,
});
// Create auth stack with Lambda dependencies
const authStack = new AuthStack(app, "AuthStack", {
  authProtectedFn: lambdaStack.authProtectedFn,
});
// Create backend stack with Lambda dependencies
const backendStack = new BackendStack(app, "BackendStack", {
  saveToDynamoFn: lambdaStack.saveToDynamoFn,
  fetchFromDynamoFn: lambdaStack.fetchFromDynamoFn,
  fetchUserTemperaturesFn: lambdaStack.fetchUserTemperaturesFn,
  fetchUserTemperatureBoundsFn: lambdaStack.fetchUserTemperatureBoundsFn,
  getAllDevicesFn: lambdaStack.getAllDevicesFn,
  registerDeviceFn: lambdaStack.registerDeviceFn,
  deleteUserDeviceFn: lambdaStack.deleteUserDeviceFn,
  userPool: authStack.userPool,
});

new EspAuthStack(app, "EspAuthStack", {
  userPoolId: authStack.userPool.userPoolId,
  clientId: authStack.userPoolClient.userPoolClientId,
});

new DashboardHostingStack(app, "DashboardHostingStack", {
  env: { account, region },
  domainName,
  siteDomain,
});
// Add dependencies
lambdaStack.addDependency(infraStack);
backendStack.addDependency(lambdaStack);
authStack.addDependency(lambdaStack);
