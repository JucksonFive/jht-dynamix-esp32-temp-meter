# ESP32 Temperature & Humidity Monitoring System

Scalable IoT solution for monitoring temperature and humidity using ESP32 devices. Data is transmitted securely to AWS IoT Core and stored in DynamoDB via Lambda functions. A TypeScript-based simulator is also included for development and testing purposes.

## 📦 Project Structure

```
jht-dynamix-esp32-temp-meter/
├── backend/
│   ├── cdk/                  # AWS CDK infrastructure definitions
│   ├── lambdas/              # Lambda function source code
│   └── package.json          # CDK project metadata
├── board/                    # Firmware for esp32
└── README.md
```

## 🚀 Features

- 🌡️ Collect temperature and humidity readings from ESP32 (or simulator)
- 🔐 Secure MQTT communication using TLS certificates
- ☁️ AWS IoT Core integration
- 🧠 AWS Lambda functions to process and store readings
- 🗃️ DynamoDB for scalable storage
- 🔎 REST API for fetching sensor data (via Lambda + API Gateway)

## 🛠️ Technologies Used

- ESP32
- TypeScript
- AWS CDK
- AWS IoT Core
- AWS Lambda
- Amazon DynamoDB
- API Gateway (for frontend access)

The simulator publishes random temperature/humidity values to the `sensors/temperature` MQTT topic using AWS IoT endpoint and certificates.

## 📡 Lambda Functions

- **SaveToDynamoFunction**: Stores MQTT payloads into DynamoDB
- **FetchFromDynamoFunction**: Retrieves all or filtered readings from DynamoDB

## API Usage

All API requests are made through the following base path: https://mrcc16s8zk.execute-api.eu-north-1.amazonaws.com/prod

### 🔹 Endpoints

- `GET /readings` — Fetch all readings

All requests require an API key in the headers:

```bash
curl -H "x-api-key: <YOUR_API_KEY>" https://mrcc16s8zk.execute-api.eu-north-1.amazonaws.com/prod/readings
```
