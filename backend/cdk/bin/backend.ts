#!/usr/bin/env node
import * as path from "path";
import * as cdk from "aws-cdk-lib";
import * as dotenv from "dotenv";
import { AuthStack } from "../lib/auth-stack";
import { BackendStack } from "../lib/backend-stack";
import { DashboardHostingStack } from "../lib/dashboard-hosting-stack";

import { EspAuthStack } from "../lib/esp-auth-stack";
import { InfrastructureStack } from "../lib/infrastructure-stack";
import { LambdaStack } from "../lib/lambda-stack";
import { CertStack } from "../lib/cert-stack";
import { HomepageHostingStack } from "../lib/homepage-hosting-stack";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });
const app = new cdk.App();

const domainName = process.env.DOMAIN_NAME;
const subdomain = process.env.SUBDOMAIN;
const siteDomain =
  domainName && subdomain ? `${subdomain}.${domainName}` : undefined;
const region = process.env.AWS_REGION!;
const account = process.env.CDK_DEFAULT_ACCOUNT;
const skipCertCreation =
  (process.env.SKIP_CERTIFICATE_CREATION || "false").toLowerCase() === "true";

// Stack for the certificate in us-east-1 (optional)
let certStack: CertStack | undefined;
if (!skipCertCreation && domainName && siteDomain) {
  // Single certificate (in us-east-1) that covers:
  // - Dashboard subdomain (siteDomain)
  // - Apex domain (domainName) for homepage
  // - Wildcard for future additional sub-subdomains
  const additionalDomains = [domainName, `*.${domainName}`];
  certStack = new CertStack(app, "CertStack", {
    env: { account, region: "us-east-1" },
    domainName,
    siteDomain,
    additionalDomains,
    crossRegionReferences: true,
  });
}

// Create infrastructure stack with DynamoDB tables first
const infraStack = new InfrastructureStack(app, "InfrastructureStack", {
  env: { account, region },
});

// Create Lambda stack with table dependencies
const lambdaStack = new LambdaStack(app, "LambdaStack", {
  env: { account, region },
  temperaturesTable: infraStack.temperaturesTable,
  deviceUserTable: infraStack.deviceUserTable,
  dashboardEnvSecret: infraStack.dashboardEnvSecret,
});
// Create auth stack with Lambda dependencies
const authStack = new AuthStack(app, "AuthStack", {
  env: { account, region },
  authProtectedFn: lambdaStack.authProtectedFn,
});
// Create backend stack with Lambda dependencies
const backendStack = new BackendStack(app, "BackendStack", {
  env: { account, region },
  saveToDynamoFn: lambdaStack.saveToDynamoFn,
  fetchFromDynamoFn: lambdaStack.fetchFromDynamoFn,
  fetchUserTemperaturesFn: lambdaStack.fetchUserTemperaturesFn,
  fetchUserTemperatureBoundsFn: lambdaStack.fetchUserTemperatureBoundsFn,
  getAllDevicesFn: lambdaStack.getAllDevicesFn,
  registerDeviceFn: lambdaStack.registerDeviceFn,
  deleteUserDeviceFn: lambdaStack.deleteUserDeviceFn,
  updateDeviceStatusFn: lambdaStack.updateDeviceStatusFn,
  getDashboardConfigFn: lambdaStack.getDashboardConfigFn,
  userPool: authStack.userPool,
});

new EspAuthStack(app, "EspAuthStack", {
  env: { account, region },
  userPoolId: authStack.userPool.userPoolId,
  clientId: authStack.userPoolClient.userPoolClientId,
});

if (domainName && siteDomain && certStack?.certificateArn) {
  new DashboardHostingStack(
    app,
    "DashboardHostingStack",
    {
      env: { account, region },
      domainName,
      siteDomain,
      certificateArn: certStack.certificateArn,
      crossRegionReferences: true,
    },
  );
}

// Deploy homepage at the apex (root) domain using same certificate
if (domainName && certStack?.certificateArn) {
  new HomepageHostingStack(
    app,
    "HomepageHostingStack",
    {
      env: { account, region },
      domainName,
      siteDomain: domainName, // apex domain
      certificateArn: certStack.certificateArn,
      crossRegionReferences: true,
    },
  );
}
// Add dependencies
lambdaStack.addDependency(infraStack);
backendStack.addDependency(lambdaStack);
authStack.addDependency(lambdaStack);
