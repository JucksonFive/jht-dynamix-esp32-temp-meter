# JHT-Dynamix ESP32 Temperature Meter

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/Hizaguru/jht-dynamix-esp32-temp-meter/badge)](https://scorecard.dev/viewer/?uri=github.com/Hizaguru/jht-dynamix-esp32-temp-meter)
[![CodeQL](https://github.com/Hizaguru/jht-dynamix-esp32-temp-meter/actions/workflows/codeql.yml/badge.svg)](https://github.com/Hizaguru/jht-dynamix-esp32-temp-meter/actions/workflows/codeql.yml)
[![SBOM & Vulnerability Scan](https://github.com/Hizaguru/jht-dynamix-esp32-temp-meter/actions/workflows/sbom-vuln-scan.yml/badge.svg)](https://github.com/Hizaguru/jht-dynamix-esp32-temp-meter/actions/workflows/sbom-vuln-scan.yml)
[![Lint](https://github.com/Hizaguru/jht-dynamix-esp32-temp-meter/actions/workflows/lint.yml/badge.svg)](https://github.com/Hizaguru/jht-dynamix-esp32-temp-meter/actions/workflows/lint.yml)

This repository contains the complete source code for the JHT-Dynamix ESP32 Temperature Meter, a comprehensive IoT solution for real-time temperature monitoring. The system is composed of three main components: an ESP32-based sensor device, a serverless AWS backend, and a React-based web dashboard (https://app.jt-dynamix.com/).

## Project Structure

The repository is organized into three main directories:

- `board/`: Contains the firmware for the ESP32 device, developed using PlatformIO and the Arduino framework.
- `backend/`: Includes the AWS CDK code for deploying the serverless backend infrastructure, along with the Lambda function source code.
- `dashboard/`: Contains the source code for the React-based web dashboard, built with Vite and TypeScript.

## Architecture Overview

The system follows a modern, event-driven architecture:

1.  **ESP32 Device**: The ESP32 device reads temperature data from a sensor and publishes it to a secure MQTT topic on AWS IoT Core.
2.  **AWS IoT Core**: An IoT Rule is configured to listen for incoming messages on the `sensors/temperature` topic.
3.  **Lambda Function**: The rule triggers a Lambda function that processes the incoming data and stores it in a DynamoDB table.
4.  **DynamoDB**: The temperature readings are stored in a DynamoDB table, partitioned by device ID and sorted by timestamp.
5.  **API Gateway**: An API Gateway provides a secure REST API for accessing the stored temperature data.
6.  **React Dashboard**: The web dashboard uses AWS Amplify to authenticate users and fetch data from the API Gateway, providing a visual representation of the temperature readings.

## Features

- **Real-time Monitoring**: View temperature data in real-time on a user-friendly dashboard.
- **Secure Communication**: All data is transmitted over MQTT with TLS encryption, ensuring data privacy and integrity.
- **Scalable Backend**: The serverless architecture on AWS ensures that the system can handle a large number of devices and readings.
- **User Authentication**: The dashboard uses Amazon Cognito for secure user authentication and authorization.
- **Device Management**: The system supports multiple devices, with the ability to view data from all or selected devices.

## Getting Started

To get started with this project, you will need to set up each component individually. Please refer to the `README.md` files in each directory for detailed instructions:

- [board/README.md](board/README.md)
- [backend/README.md](backend/README.md)
- [dashboard/README.md](dashboard/README.md)

## Technologies Used

- **Hardware**: ESP32
- **Firmware**: C++ (Arduino Framework), PlatformIO
- **Backend**: TypeScript, AWS CDK, AWS IoT Core, Lambda, DynamoDB, API Gateway
- **Frontend**: React, TypeScript, Vite, AWS Amplify, Tailwind CSS

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
