# Device Status Update Lambda

This Lambda function is triggered by AWS IoT Core when ESP32 devices publish status messages.

## IoT Topic Rule

- **Topic Pattern**: `devices/+/status`
- **Rule Name**: `device_status_rule`

## Expected Message Format

ESP32 devices should publish to: `devices/{deviceId}/status`

**Payload Example:**
```json
{
  "deviceId": "esp32-12345",
  "status": "online",
  "userId": "user-uuid-here",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Required Fields
- `deviceId` (string): The unique device identifier
- `status` (string): Either "online" or "offline"

### Optional Fields
- `userId` (string): The user ID who owns the device. If not provided, the function will scan the Devices table to find it (less efficient).
- `timestamp` (string): ISO 8601 timestamp. If not provided, current server time is used.

## What it Does

1. Receives IoT message from the `devices/+/status` topic
2. Extracts device information from the payload
3. Looks up the userId if not provided (via table scan)
4. Updates the Devices DynamoDB table with:
   - `status`: "online" or "offline"
   - `lastSeen`: timestamp of the status update
   - `updatedAt`: current timestamp

## Dashboard Integration

The dashboard displays device status based on the `lastSeen` field:
- **Online**: if `lastSeen` is within the last 5 minutes
- **Offline**: if `lastSeen` is older than 5 minutes or not set

## Performance Considerations

For best performance, ESP32 devices should include the `userId` in their status messages to avoid table scans. If you have many devices, consider adding a Global Secondary Index (GSI) on `deviceId` to the Devices table.

## ESP32 Implementation Example

```cpp
// When connecting to WiFi/MQTT
publishStatus("online");

// Before going to sleep or disconnecting
publishStatus("offline");

// Function to publish status
void publishStatus(const char* status) {
  StaticJsonDocument<128> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["status"] = status;
  doc["userId"] = USER_ID;  // Store this during device registration
  doc["timestamp"] = getISOTimestamp();
  
  char buffer[128];
  serializeJson(doc, buffer);
  
  char topic[64];
  snprintf(topic, sizeof(topic), "devices/%s/status", DEVICE_ID);
  
  mqttClient.publish(topic, buffer);
}
```

## Heartbeat Pattern (Recommended)

For production use, implement a heartbeat pattern:
```cpp
// Send "online" status every 2-3 minutes
void loop() {
  static unsigned long lastHeartbeat = 0;
  if (millis() - lastHeartbeat > 120000) {  // 2 minutes
    publishStatus("online");
    lastHeartbeat = millis();
  }
  // ... other loop code
}
```

This ensures the dashboard accurately reflects device connectivity status.
