# Dashboard

This directory contains the source code for the JHT-Dynamix ESP32 Temperature Meter dashboard. The dashboard is a React-based web application built with Vite and TypeScript, and it provides a user-friendly interface for visualizing temperature data.

## Features

-   **Real-time Data Visualization**: View temperature readings from your ESP32 devices in real-time.
-   **User Authentication**: Secure login and registration using Amazon Cognito.
-   **Device Filtering**: Filter data by device to view readings from specific sensors.
-   **Date Range Selection**: Select a date range to view historical temperature data.
-   **Responsive Design**: The dashboard is designed to work on both desktop and mobile devices.

## Getting Started

To run the dashboard locally, you need to have Node.js and npm installed.

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Configure Environment Variables**:
    Create a `.env.local` file in this directory and add the necessary AWS configuration, such as the Cognito User Pool ID, App Client ID, and API Gateway endpoint. You can get these values from the output of the CDK deployment.

    ```
    VITE_APP_AWS_REGION=<Your-AWS-Region>
    VITE_APP_COGNITO_USER_POOL_ID=<Your-Cognito-User-Pool-ID>
    VITE_APP_COGNITO_USER_POOL_WEB_CLIENT_ID=<Your-Cognito-App-Client-ID>
    VITE_APP_API_URL=<Your-API-Gateway-Endpoint>
    ```

3.  **Run the Development Server**:
    ```bash
    npm run dev
    ```

    This will start the development server, and you can view the dashboard at `http://localhost:5173`.

## Available Scripts

-   `npm run dev`: Starts the development server.
-   `npm run build`: Builds the app for production.
-   `npm run preview`: Serves the production build locally.
-   `npm run test`: Runs all component tests with coverage.
-   `npm run test:watch`: Runs tests in watch mode.
-   `npm run test:coverage`: Runs tests with a coverage report.

## Technologies Used

-   **Framework**: React
-   **Build Tool**: Vite
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS
-   **Authentication**: AWS Amplify
-   **API**: Fetch API for making requests to the backend.

## Testing

The dashboard uses Vitest and React Testing Library for component tests. CI
enforces a minimum 70% coverage threshold across lines, statements, functions,
and branches.

### Running tests

Run the full suite with coverage:

```bash
npm run test
```

Run tests in watch mode during development:

```bash
npm run test:watch
```

Generate a coverage report locally:

```bash
npm run test:coverage
```
