# Backend Infrastructure

This directory contains the AWS CDK code for deploying the serverless backend infrastructure for the JHT-Dynamix ESP32 Temperature Meter.

## Infrastructure Overview

The backend is built using a serverless architecture on AWS and includes the following components:

-   **AWS IoT Core**: Provides secure communication with the ESP32 devices via MQTT.
-   **AWS Lambda**: A set of Lambda functions for processing data, handling API requests, and managing devices.
-   **Amazon DynamoDB**: A NoSQL database for storing temperature readings and device information.
-   **Amazon API Gateway**: A managed service that provides a RESTful API for the frontend dashboard.
-   **Amazon Cognito**: Used for user authentication and authorization on the dashboard.

## Project Structure

-   `cdk/`: Contains the CDK stacks that define the AWS resources.
    -   `lib/`: The CDK construct library where the stacks are defined.
    -   `bin/`: The entry point for the CDK application.
-   `lambdas/`: Contains the source code for the Lambda functions.

## Deployment

To deploy the backend infrastructure, you need to have the AWS CDK installed and configured with your AWS account.

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Build the Project**:
    ```bash
    npm run build
    ```

3.  **Deploy the Stacks**:
    ```bash
    npm run cdk deploy --all
    ```

This will deploy all the necessary resources to your AWS account.

## Useful Commands

-   `npm run build`: Compile TypeScript to JavaScript.
-   `npm run watch`: Watch for changes and compile.
-   `npm run test`: Run unit tests.
-   `npm run cdk deploy`: Deploy the specified stack.
-   `npm run cdk diff`: Compare the deployed stack with the current state.
-   `npm run cdk synth`: Synthesize the CloudFormation template.
