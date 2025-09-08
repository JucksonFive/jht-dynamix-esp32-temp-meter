# JHT-Dynamix ESP32 Temperature Meter - AI Agent Instructions

## Architecture Overview

This is a multi-component IoT temperature monitoring system with three main parts:

- **ESP32 firmware** (`board/`) - Arduino-based sensor device with WiFi setup and MQTT publishing
- **AWS backend** (`backend/`) - CDK infrastructure with IoT Core, Lambda functions, and API Gateway
- **React dashboard** (`dashboard/`) - TypeScript/React frontend with AWS Amplify authentication

**Data Flow**: ESP32 → MQTT (sensors/temperature) → IoT Rule → Lambda → DynamoDB → API Gateway → Dashboard

## Key Development Patterns

### ESP32 Firmware (`board/`)
- **PlatformIO project** - Use `pio run` to build, `pio run -t upload` to flash
- **Modular library structure** - Each feature is a separate lib (wifi_config, mqtt_helper, temperature_sensor, etc.)
- **LittleFS filesystem** - Stores WiFi credentials and AWS IoT certificates in `/data/`
- **Setup wizard flow** - If no WiFi credentials, starts AP mode webserver for configuration
- **MQTT with TLS** - Uses AWS IoT Core certificates loaded from LittleFS via `cert_helper`

### AWS Backend (`backend/cdk/`)
- **CDK deployment** - `npm run cdk deploy` deploys both BackendStack and AuthStack
- **IoT Topic Rule pattern** - `sensors/temperature` → `temperature_rule` → `SaveToDynamoFunction`
- **Dual API structure**: 
  - Public API (API key auth) for ESP32 data retrieval
  - Protected API (Cognito auth) for dashboard access
- **Lambda functions** are in `backend/lambdas/` with NodeJS 22.x runtime

### Dashboard (`dashboard/`)
- **Vite + React 19** - Use `npm run dev` for development
- **AWS Amplify integration** - Cognito for auth, API calls with automatic token handling
- **Environment variables** - All AWS config in `.env` files (VITE_* prefixed)
- **Multi-device support** - Filters temperature data by deviceId

## Critical Workflows

### ESP32 Development
```bash
cd board/
pio run              # Build firmware
pio run -t upload    # Flash to device
pio device monitor   # Serial debugging
```

### AWS Infrastructure
```bash
cd backend/
npm run build        # Compile TypeScript
npm run cdk deploy   # Deploy all stacks
npm run cdk diff     # Preview changes
```

### Certificate Management
- AWS IoT certificates go in `board/data/` directory
- Required files: `ca.pem`, `cert.pem`, `private.key`
- Upload via PlatformIO filesystem: `pio run -t uploadfs`

### Dashboard Development
```bash
cd dashboard/
npm run dev          # Start dev server
npm run build        # Production build
```

## Integration Points

### MQTT Topic Structure
- **Topic**: `sensors/temperature`
- **Payload**: `{"deviceId": "esp32-MAC", "temperature": 25.5, "timestamp": "ISO8601"}`
- **ESP32 client ID**: Generated from MAC address (`esp32-${WiFi.macAddress()}`)

### DynamoDB Schema
- **Table**: `Temperatures`
- **Partition Key**: `deviceId` (String)
- **Sort Key**: `timestamp` (String)
- **Attributes**: `temperature` (Number)

### API Endpoints
- **Base URL**: From CDK output (format: `https://{id}.execute-api.eu-north-1.amazonaws.com/prod`)
- **GET /readings** - Requires `x-api-key` header for public access
- **GET /protected** - Requires Cognito JWT token for dashboard

## Project-Specific Conventions

### Error Handling
- ESP32 uses Serial debugging with emoji prefixes (✅ ❌ 📄)
- Lambda functions log structured JSON for CloudWatch
- Frontend uses React error boundaries for auth failures

### Configuration Management
- ESP32: LittleFS files for persistent config
- Backend: CDK environment variables and IAM roles
- Dashboard: Vite environment variables with VITE_ prefix

### Security Patterns
- ESP32 uses AWS IoT device certificates (mutual TLS)
- API Gateway has both API key (ESP32) and Cognito (dashboard) auth
- All cross-component communication uses AWS managed services (no direct connections)

## Common Pitfalls

- **Certificate paths**: ESP32 expects specific filenames in `/data/` directory
- **CORS**: API Gateway automatically configured for dashboard domain
- **IoT Rule permissions**: Lambda needs explicit CfnPermission for IoT Core invocation
- **CDK deployment order**: Deploy BackendStack before AuthStack due to dependencies
- **MAC address format**: ESP32 uses colon-separated format for device ID generation
