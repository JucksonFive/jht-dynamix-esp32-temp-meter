## Ticket 1: Implement Pre-commit Hooks for Automated Code Quality Assurance
Automate code formatting and linting by running them automatically before each `git commit` command. The goal is to speed up the feedback loop, standardize code quality, and reduce errors already during development.

### Background
Currently, code quality assurance (formatting, static analysis) mainly happens in the CI/CD pipeline or when manually run by developers. This leads to situations where incorrectly formatted or poor-quality code ends up in version control, and feedback about errors is only received after the pipeline runs. This slows down development and causes unnecessary correction commits.

### Benefits
- **Faster feedback:** Developers get immediate feedback about errors on their local machine before sharing code.
- **Consistent codebase:** All committed code is automatically following the same formatting and quality rules.
- **More efficient CI/CD:** Reduces CI pipeline load when basic errors are filtered out locally.
- **Better developer experience (DX):** Removes the need to remember to run quality assurance tools manually.

### Implementation
Adopt the `pre-commit` tool that manages Git hooks centrally. Create a `.pre-commit-config.yaml` configuration file in the monorepo root, defining tools to run for different file types:
- **Python (Backend, CDK):** `black` (formatting), `ruff` (linting)
- **TypeScript/JavaScript (Frontend):** `prettier` (formatting), `eslint` (linting)
- **Firmware (C/C++):** `clang-format` (formatting)
- **General:** `trailing-whitespace`, `end-of-file-fixer`

### Tasks
- [ ] Add `pre-commit` to project development dependencies.
- [ ] Create `.pre-commit-config.yaml` configuration file in root directory.
- [ ] Define general hooks in configuration (e.g. `trailing-whitespace`).
- [ ] Add and configure Python-specific hooks (`black`, `ruff`).
- [ ] Add and configure TypeScript/JavaScript-specific hooks (`prettier`, `eslint`).
- [ ] Run `pre-commit run --all-files` and commit its automatic corrections to existing codebase.
- [ ] Update `README.md` or developer documentation to include instructions for running `pre-commit install` command during project setup.

### Acceptance Criteria
- Running `git commit` command with an unformatted file fails and shows an error.
- `pre-commit` hook automatically fixes formatting errors (e.g. `black`, `prettier`), after which `git commit` succeeds.
- Linting error (that cannot be automatically fixed) prevents commit and prints clear error message.
- Developer documentation has clear instructions for installing hooks in local environment.
## Ticket 1: Implement Dead-Letter Queue (DLQ) for Ingestion Lambda

A ticket to enhance the data ingestion pipeline's reliability by implementing a Dead-Letter Queue (DLQ) for the primary ingestion Lambda. This will prevent data loss when message processing fails.

### Background
Currently, the `ingestion-lambda` processes messages directly from the AWS IoT Core topic rule. If this Lambda encounters an unhandled exception during execution (e.g., due to a malformed payload, a temporary downstream service failure, or a bug), the invocation fails and the message is permanently lost. This creates a critical reliability gap, as we have no mechanism to recover or even analyze the failed data.

### Benefits
- **Prevents Data Loss:** Guarantees that messages are not silently dropped on processing failure, ensuring data durability.
- **Improved Debugging:** Failed messages are captured and stored, allowing developers to inspect the exact payload that caused the error.
- **Enables Reprocessing:** Provides a mechanism to manually or automatically re-drive failed messages through the system once the underlying issue is resolved.
- **Enhanced Observability:** A CloudWatch alarm on the DLQ will immediately notify the team of processing failures.

### Implementation
We will use the AWS CDK to provision a new Amazon SQS queue within the `BackendStack`. This queue will be configured as the `deadLetterQueue` for the `ingestion-lambda`. The AWS Lambda service will automatically send the event payload to this SQS queue after its retry policy (if any) is exhausted. We will also add a CloudWatch Alarm to monitor the queue for messages.

### Tasks
- [ ] In `backend-stack.ts`, define a new `aws-sqs.Queue` resource to serve as the DLQ.
- [ ] Configure the `ingestion-lambda` function definition in the CDK, setting its `deadLetterQueue` property to the newly created SQS queue.
- [ ] Create a new `aws-cloudwatch.Alarm` that monitors the `ApproximateNumberOfMessagesVisible` metric of the DLQ, triggering an alarm if the count is greater than 0.
- [ ] Deploy the stack to a development environment.
- [ ] Manually test the integration by sending a malformed MQTT message that is known to cause an exception in the Lambda.

### Acceptance Criteria
- **GIVEN** the infrastructure is deployed
- **WHEN** a message is sent via MQTT that causes an unhandled exception in the `ingestion-lambda`
- **THEN** the raw message payload is visible in the designated SQS DLQ.
- **AND** the CloudWatch Alarm for the DLQ transitions to the `ALARM` state.
- **AND** the Lambda's execution logs show the processing failure before the message is sent to the DLQ.
- **AND** the Lambda's IAM role has been automatically updated with the `sqs:SendMessage` permission scoped specifically to the new DLQ resource.

## Ticket 2: Implement Structured Logging and Alarms for Backend Lambdas

Implement structured JSON logging for a critical Lambda function and create a corresponding CloudWatch alarm to enable proactive error monitoring and faster troubleshooting.

### Background

Currently, our backend Lambda functions use `console.log` for output. This results in unstructured, plain-text logs in CloudWatch. While useful for basic debugging, this format is difficult to query efficiently, making it slow to diagnose issues across multiple invocations or correlate events. We also lack proactive alerting, meaning we only discover problems when a user reports them or during manual checks.

This ticket introduces a foundational observability pattern, starting with our most critical function, the telemetry ingestion Lambda.

### Benefits

*   **Faster Troubleshooting:** Structured JSON logs can be queried with CloudWatch Logs Insights, allowing for rapid filtering and analysis (e.g., "show all errors for device X in the last hour").
*   **Proactive Monitoring:** CloudWatch alarms will automatically notify the team when error rates exceed a defined threshold, enabling us to address issues before they impact users.
*   **Improved System Health Visibility:** Provides a clear, metric-driven view of service stability.
*   **Standardization:** Establishes a logging best practice that can be rolled out to all other functions.

### Implementation

We will use the **AWS Lambda Powertools for TypeScript** library to implement structured logging. This library is the AWS-recommended standard for adding observability features with minimal boilerplate code.

1.  **Introduce Powertools Logger:** The `@aws-lambda-powertools/logger` package will be added to the `telemetry-ingestion-lambda`.
2.  **Refactor Logging:** All `console.log` statements will be replaced with the Powertools logger instance (e.g., `logger.info()`, `logger.error()`). Key contextual information from the event payload, such as `deviceId`, will be injected into the logs.
3.  **Define CloudWatch Alarm in CDK:** A new `Alarm` resource will be defined in the `BackendStack.ts` file using the AWS CDK.
4.  **Alarm Configuration:** The alarm will monitor the `Errors` metric for the `telemetry-ingestion-lambda`. It will be configured to trigger if the error count exceeds 5 within a 5-minute period.
5.  **SNS Topic for Notifications:** A new SNS topic will be created to receive alarm notifications. The alarm will be configured to publish messages to this topic. Initially, a developer email will be subscribed for testing.

### Tasks

-   [ ] Add the `@aws-lambda-powertools/logger` dependency to the `telemetry-ingestion-lambda`'s `package.json`.
-   [ ] Instantiate the `Logger` in the Lambda handler file.
-   [ ] Replace all `console.log`/`console.error` calls with the appropriate `logger` methods (`info`, `warn`, `error`).
-   [ ] Use `logger.appendKeys` or middleware to automatically include contextual data like `deviceId` in every log entry.
-   [ ] In the `BackendStack.ts` CDK stack, define a new `sns.Topic` for alerts.
-   [ ] In `BackendStack.ts`, define a new `cloudwatch.Alarm` targeting the `telemetry-ingestion-lambda`'s `Errors` metric.
-   [ ] Configure the alarm's threshold, evaluation period, and link it to the SNS topic.
-   [ ] Add an email subscription to the SNS topic for validation purposes.
-   [ ] Deploy the updated stack to the development environment.

### Acceptance Criteria

-   **Given** the `telemetry-ingestion-lambda` is invoked successfully,
    -   **Then** a log entry appears in CloudWatch Logs in a structured JSON format.
    -   **And** the JSON log contains the fields: `level`, `message`, `service`, `timestamp`, and the `deviceId` from the event payload.
-   **Given** the `telemetry-ingestion-lambda` throws an unhandled error,
    -   **Then** an `ERROR` level log entry is written in the correct JSON format.
-   **Given** the Lambda errors more than 5 times in 5 minutes,
    -   **Then** the CloudWatch Alarm transitions to the `ALARM` state.
    -   **And** a notification email is sent to the subscribed address via the SNS topic.

## Ticket 3: End-to-End Test: User Login and Temperature Data Display

Create an automated end-to-end (E2E) test that simulates a user logging into the dashboard and verifies that temperature data from a device is displayed correctly. This test will serve as a foundational piece for our quality assurance strategy.

### Background
The monorepo currently lacks automated E2E tests for the user-facing dashboard. This creates a risk where integration bugs between the front-end, back-end APIs, and the database are only caught during manual testing or, in the worst case, by users in production. A failure in the critical path of a user logging in and viewing their data can severely impact user trust and the perceived reliability of the service.

### Benefits
- **Increased Confidence:** Provides a high degree of confidence that the core user journey is functional before and after every deployment.
- **Early Regression Detection:** Automatically catches bugs introduced by changes in the front-end, back-end, or infrastructure that break the login and data display flow.
- **Reduced Manual Effort:** Automates a critical, repetitive testing scenario, freeing up developer time for more complex tasks.
- **Foundation for Future Tests:** Establishes the framework, test data strategy, and CI integration needed for adding more E2E tests in the future.

### Implementation
We will use a modern E2E testing framework like **Cypress** or **Playwright** to write and execute the test. The test will require a pre-configured test user and a corresponding device with known temperature data seeded into the database for the staging environment. This ensures the test runs against a consistent and predictable state. For stable element selection, we will add `data-testid` attributes to the relevant HTML elements. The test will be integrated into the CI/CD pipeline to act as a quality gate before deploying to production.

### Tasks
- [ ] Choose and install an E2E testing framework (e.g., Cypress) into the `dashboard` package.
- [ ] Create a script or process to seed the staging database with a test user, a virtual device, and a known temperature reading.
- [ ] Add `data-testid` attributes to the login form inputs, submit button, and the temperature data display component for reliable test selectors.
- [ ] Write the E2E test script that performs the following actions:
    - Navigates to the dashboard's login page.
    - Fills in the credentials for the pre-configured test user.
    - Clicks the login button.
    - Verifies successful redirection to the main dashboard view.
    - Asserts that the correct temperature data is visible on the page.
- [ ] Integrate the E2E test suite into the CI/CD pipeline to run automatically after every deployment to the staging environment.
- [ ] Configure the CI/CD pipeline to fail the build if the E2E test does not pass.
- [ ] Document how to run the E2E tests locally in the project's README.

### Acceptance Criteria
- A new E2E test successfully automates the user login and data verification flow.
- The test runs automatically as a required step in the CI/CD pipeline against the staging environment.
- A pull request that breaks this core functionality is blocked from being merged or deployed.
- A developer can execute the test suite locally against their development environment with a single command.
