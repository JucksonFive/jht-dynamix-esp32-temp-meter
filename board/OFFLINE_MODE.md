# Offline Mode Documentation

## Overview

The ESP32 Temperature Meter supports **Offline Mode**, which allows the device to operate without WiFi or internet connection. In this mode, temperature readings are stored locally on the device's flash memory and can be synchronized to the cloud when a connection becomes available.

## Use Cases

- **Remote locations** without reliable internet connectivity
- **Temporary deployments** where immediate cloud access isn't needed
- **Testing and development** without network infrastructure
- **Data backup** during network outages (automatic fallback)

## Storage Capacity

### Hardware Specifications
- **Flash Memory:** 4 MB total
- **LittleFS Available:** ~1-2 MB (after firmware)
- **Reading Size:** ~100-150 bytes per measurement (JSON format)

### Capacity Estimates
| Measurement Interval | Storage Duration |
|---------------------|-----------------|
| 10 seconds | ~1 day (8,000-10,000 readings) |
| 1 minute | ~6 days |
| 5 minutes | ~30 days |
| 15 minutes | ~90 days |

The system enforces a **1 MB file size limit** to ensure stable operation.

## How It Works

### Enabling Offline Mode

**During Setup Wizard:**
1. Connect to `TempSensor-Setup` WiFi
2. Open captive portal (http://192.168.4.1)
3. Select "📴 Offline Mode"
4. Device restarts in offline mode

**Via API:**
```bash
POST /enable-offline-mode
```

### Disabling Offline Mode

**Factory Reset:**
- Hold BOOT button (GPIO0) for 3 seconds
- Device clears all settings and restarts in setup mode

**Via API:**
```bash
POST /disable-offline-mode
```
⚠️ This will delete WiFi credentials and force reconfiguration.

### Data Storage Format

Readings are stored in **JSONL format** (JSON Lines) at `/offline_readings.jsonl`:
```jsonl
{"deviceId":"offline-AA:BB:CC:DD:EE:FF","temperature":22.5,"timestamp":"123456","userId":"offline-user"}
{"deviceId":"offline-AA:BB:CC:DD:EE:FF","temperature":22.7,"timestamp":"133456","userId":"offline-user"}
```

Each line is a complete JSON object representing one reading.

### Timestamp Behavior

- **Online Mode:** Uses NTP-synchronized ISO 8601 timestamps
- **Offline Mode:** Uses `millis()` (milliseconds since boot)

> **Note:** Offline timestamps are relative, not absolute. They can be converted to actual timestamps during sync if the boot time is known.

## API Endpoints

### Enable Offline Mode
```
POST /enable-offline-mode
```
**Response:**
- `200 OK` - Offline mode enabled, device restarting
- `500 Internal Server Error` - Failed to enable

**Behavior:**
- Creates `/offline_mode.json` with `{"enabled": true}`
- Marks setup as complete
- Stops captive portal
- Restarts device in 5 seconds

---

### Disable Offline Mode
```
POST /disable-offline-mode
```
**Response:**
- `200 OK` - Offline mode disabled, please reconfigure
- `500 Internal Server Error` - Failed to disable

**Behavior:**
- Deletes `/offline_mode.json`
- Removes `/wifi.json` and `/device.json`
- Forces setup wizard on restart
- Restarts device in 3 seconds

---

### Check Offline Status
```
GET /offline-mode-status
```
**Response:**
```json
{
  "enabled": true,
  "readingCount": 1234,
  "fileSize": 123456
}
```

**Fields:**
- `enabled` (boolean) - Is offline mode active
- `readingCount` (integer) - Number of stored readings
- `fileSize` (integer) - Size of offline file in bytes

---

## Automatic Synchronization

When the device transitions from offline to online (or temporarily loses connection):

1. **Connection Restored:** Device detects WiFi and MQTT are available
2. **Check for Offline Data:** Reads `/offline_readings.jsonl`
3. **Upload Readings:** Sends each reading to MQTT topic sequentially
4. **Clear Storage:** Deletes offline file after successful upload
5. **Resume Normal Operation:** Continues with real-time publishing

### Sync Process
```cpp
// Pseudocode from main.cpp loop()
if (offlineCount > 0 && mqttConnected) {
  for each line in offline_readings.jsonl {
    MQTT::publish(topic, line);
    delay(100ms); // Rate limiting
  }
  StorageHelper::clearOfflineReadings();
}
```

## File System Functions

### StorageHelper API

```cpp
// Enable/disable offline mode
bool StorageHelper::enableOfflineMode();
bool StorageHelper::disableOfflineMode();
bool StorageHelper::isOfflineModeEnabled();

// Store and retrieve readings
bool StorageHelper::appendOfflineReading(
  const char* deviceId,
  float temperature,
  const char* timestamp,
  const char* userId
);
String StorageHelper::getOfflineReadings();
bool StorageHelper::clearOfflineReadings();

// Status information
int StorageHelper::getOfflineReadingCount();
size_t StorageHelper::getOfflineFileSize();
```

## Monitoring and Debugging

### Serial Output Examples

**Offline Mode Active:**
```
[Setup] Offline mode enabled, setup is complete
[Offline] Offline mode enabled, skipping WiFi/MQTT setup
[Offline] Device will store readings locally
[Offline] Using device ID: offline-AA:BB:CC:DD:EE:FF
[Offline] Temp: 22.50°C | Stored: 1 readings, 145 bytes
[Offline] Temp: 22.52°C | Stored: 2 readings, 290 bytes
```

**Synchronization:**
```
[Offline] Found 1234 offline readings, sending to cloud...
[Offline] Sent reading 1/1234
[Offline] Sent reading 2/1234
...
[Offline] Successfully sent 1234 offline readings
```

**Storage Limit Reached:**
```
[Storage] Offline file too large, cannot append
```

## Best Practices

1. **Monitor Storage:** Check file size regularly in production deployments
2. **Adjust Intervals:** Use longer measurement intervals for extended offline periods
3. **Scheduled Sync:** For hybrid deployments, schedule periodic online windows for sync
4. **Device Identification:** Offline devices use MAC-based IDs; link to cloud when online
5. **Data Validation:** Verify sync completed before clearing offline storage

## Limitations

- **No Real-Time Alerts:** Offline mode doesn't support immediate notifications
- **Relative Timestamps:** `millis()` timestamps need conversion for absolute time
- **Storage Limit:** 1 MB hard limit (~7,000-10,000 readings)
- **No Remote Control:** Device must be physically accessed to exit offline mode
- **Power Loss:** Incomplete writes may corrupt last reading (JSONL format limits damage)

## Troubleshooting

### Device Won't Store Readings
- Check serial output for file system errors
- Verify LittleFS is mounted (`LittleFS.begin()`)
- Ensure storage limit hasn't been reached

### Sync Not Triggering
- Confirm WiFi and MQTT connections are established
- Check that `getOfflineReadingCount() > 0`
- Verify MQTT topic and credentials are correct

### Out of Memory
- Reduce measurement frequency
- Perform manual sync more frequently
- Consider upgrading to ESP32 with more flash

## Future Enhancements

Potential improvements for offline mode:
- [ ] Configurable file size limits
- [ ] Compression of stored readings
- [ ] Batch MQTT publish (array format)
- [ ] External SD card support for larger storage
- [ ] RTC module for absolute timestamps
- [ ] Selective sync (date ranges)
- [ ] Web interface for offline data download
