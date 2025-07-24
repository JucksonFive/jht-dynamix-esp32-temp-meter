#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { BackendStack } from "../lib/backend-stack";
import { AuthStack } from "../lib/auth-stack";
import { LambdaStack } from "../lib/lambda-stack";
import { InfrastructureStack } from "../lib/infrastructure-stack";

const app = new cdk.App();

// Create infrastructure stack with DynamoDB tables first
const infraStack = new InfrastructureStack(app, "InfrastructureStack");

// Create Lambda stack with table dependencies
const lambdaStack = new LambdaStack(app, "LambdaStack", {
  temperaturesTable: infraStack.temperaturesTable,
  deviceUserTable: infraStack.deviceUserTable,
});

// Create backend stack with Lambda dependencies
const backendStack = new BackendStack(app, "BackendStack", {
  saveToDynamoFn: lambdaStack.saveToDynamoFn,
  fetchFromDynamoFn: lambdaStack.fetchFromDynamoFn,
});

// Create auth stack with Lambda dependencies
const authStack = new AuthStack(app, "AuthStack", {
  authProtectedFn: lambdaStack.authProtectedFn,
});

// Add dependencies
lambdaStack.addDependency(infraStack);
backendStack.addDependency(lambdaStack);
authStack.addDependency(lambdaStack);
