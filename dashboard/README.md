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
    The `dashboard/.env.local` file is generated for you when you deploy the
    backend. From the `backend` directory, run:

    ```bash
    npm run deploy
    ```

    This writes the required values (region, Cognito IDs, and API URL) into
    `dashboard/.env.local`.

3.  **Run the Development Server**:
    ```bash
    npm run dev
    ```

    This will start the development server, and you can view the dashboard at `http://localhost:5173`.

## Available Scripts

-   `npm run dev`: Starts the development server.
-   `npm run build`: Builds the app for production.
-   `npm run preview`: Serves the production build locally.
-   `npm run test`: Runs the test suite.

## Technologies Used

-   **Framework**: React
-   **Build Tool**: Vite
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS
-   **Authentication**: AWS Amplify
-   **API**: Fetch API for making requests to the backend.
