#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { BackendStack } from '../lib/backend-stack';
import { AuthStack } from '../lib/auth-stack';

const app = new cdk.App();
new BackendStack(app, 'BackendStack')

new AuthStack(app, 'AuthStack',)