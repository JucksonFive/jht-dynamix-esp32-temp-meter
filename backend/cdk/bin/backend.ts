#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { BackendStack } from "../lib/backend-stack";
import { AuthStack } from "../lib/auth-stack";
import { LambdaStack } from "../lib/lambda-stack";
import { InfrastructureStack } from "../lib/infrastructure-stack";
import { EspAuthStack } from "../lib/esp-auth-stack";
import * as dotenv from "dotenv";
import { CertStack } from "../lib/cert-stack";
import { DashboardHostingStack } from "../lib/dashboard-hosting-stack";

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
const certStack = new CertStack(app, "DashboardCertStack", {
  env: { account, region: "us-east-1" }, // ACM for CloudFront must be in us-east-1
  domainName,
  siteDomain,
});

new DashboardHostingStack(app, "DashboardHostingStack", {
  env: { account, region },
  domainName,
  siteDomain,
  certificateArn: certStack.certificateArn, // cross-stack ref
});
// Add dependencies
lambdaStack.addDependency(infraStack);
backendStack.addDependency(lambdaStack);
authStack.addDependency(lambdaStack);
