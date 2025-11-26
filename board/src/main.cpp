#include <Arduino.h>
#include "wifi_config.h"
#include "setup_webserver.h"
#include "mqtt_helper.h"
#include "storage_helper.h"
#include "temperature_sensor.h"
#include "time_helper.h"
#include <LittleFS.h>
#include <WiFi.h>
#include <wifi_config_manager.h>
#include <wifi_scan_helper.h>
#include "reset_helper.h"

String mqtt_server_str;
String mqtt_topic_str;
String userId;
int mqtt_port;
String clientId;
String deviceId;

void setup()
{
  Serial.begin(115200);
  delay(1000);

  if (!LittleFS.begin())
  {
    Serial.println("LittleFS mount failed");
    while (true)
      ;
  }

  // Reset button helper initialization (long press 3s on GPIO0 -> factory reset)
  ResetHelper::setup(/*pin=*/0, /*longPressMs=*/3000, /*shortPressRestart=*/false);

  if (!isSetupComplete())
  {
    Serial.println("[Setup] Setup not complete, starting wizard");

    startSetupWebServer();
    return;
  }

  // Check if offline mode is enabled
  if (StorageHelper::isOfflineModeEnabled())
  {
    Serial.println("[Offline] Offline mode enabled, skipping WiFi/MQTT setup");
    Serial.println("[Offline] Device will store readings locally");

    // Initialize temperature sensor only
    TempSensor::setup();

    // Get device info or use default
    deviceId = StorageHelper::getConfigValue("/device.json", "deviceId");
    if (deviceId.isEmpty())
    {
      deviceId = "offline-" + String(WiFi.macAddress());
      Serial.printf("[Offline] Using device ID: %s\n", deviceId.c_str());
    }

    userId = StorageHelper::getConfigValue("/user.json", "userId");
    if (userId.isEmpty())
    {
      userId = "offline-user";
    }

    return;
  }

  // Setup complete: ensure we're in STA mode only
  WiFi.mode(WIFI_STA);
  Serial.println("[Setup] Setup complete, switched to STA mode");

  if (wifiCredentialsExist())
  {
    WifiCredentials creds;
    if (!wifi_config_manager::readCredentials(creds))
    {
      Serial.println("[WiFi] Failed to read wifi.json, starting setup wizard");
      startSetupWebServer();
      return;
    }

    WiFi.begin(creds.ssid.c_str(),
               creds.password.c_str());

    unsigned long start = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - start < 10000)
    {
      delay(100);
    }

    if (WiFi.status() != WL_CONNECTED)
    {
      Serial.println("[WiFi] Connection failed, starting wizard fallback");
      startSetupWebServer();
      return;
    }

    Serial.println("[WiFi] Connected");
  }

  Serial.println("MQTT::SETUP");

  mqtt_server_str = StorageHelper::getConfigValue("/config/config.json", "mqtt_server");
  mqtt_topic_str = StorageHelper::getConfigValue("/config/config.json", "mqtt_topic");
  mqtt_port = StorageHelper::getConfigValue("/config/config.json", "mqtt_port").toInt();

  if (mqtt_server_str.length() == 0)
  {
    Serial.println("[ERROR] mqtt_server missing or invalid");
    while (true)
      ;
  }
  clientId = "esp32-" + String(WiFi.macAddress());
  MQTT::setup(mqtt_server_str.c_str(), mqtt_port);
  MQTT::ensureConnection(clientId.c_str());

  TimeHelper::setup();
  TempSensor::setup();
}

void loop()
{
  WifiScanHelper::processScanResult();
  ResetHelper::loop();
  if (!isSetupComplete())
  {
    // Process DNS requests for captive portal
    processCaptivePortalDNS();
    delay(10);
    return;
  }

  // If offline mode is enabled, just collect and store readings
  if (StorageHelper::isOfflineModeEnabled())
  {
    float temp = TempSensor::readCelsius();
    if (temp == DEVICE_DISCONNECTED_C)
    {
      Serial.println("[Offline] Sensor error");
    }
    else
    {
      // Use simple timestamp (millis) since we don't have time sync
      char timestamp[32];
      snprintf(timestamp, sizeof(timestamp), "%lu", millis());

      StorageHelper::appendOfflineReading(deviceId.c_str(), temp, timestamp, userId.c_str());

      int count = StorageHelper::getOfflineReadingCount();
      size_t fileSize = StorageHelper::getOfflineFileSize();
      Serial.printf("[Offline] Temp: %.2f°C | Stored: %d readings, %u bytes\n",
                    temp, count, (unsigned)fileSize);
    }

    delay(10000);
    return;
  }

  // Normal online operation
  // Check if WiFi is connected
  bool wifiConnected = (WiFi.status() == WL_CONNECTED);
  bool mqttConnected = false;

  if (wifiConnected)
  {
    if (!MQTT::isConnected())
    {
      MQTT::ensureConnection(clientId.c_str());
    }
    mqttConnected = MQTT::isConnected();
    MQTT::loop();

    // Try to send offline readings if we have connection
    if (mqttConnected)
    {
      int offlineCount = StorageHelper::getOfflineReadingCount();
      if (offlineCount > 0)
      {
        Serial.printf("[Offline] Found %d offline readings, sending to cloud...\n", offlineCount);

        String offlineData = StorageHelper::getOfflineReadings();
        int startPos = 0;
        int sentCount = 0;

        // Send each line (JSONL format)
        while (startPos < offlineData.length())
        {
          int endPos = offlineData.indexOf('\n', startPos);
          if (endPos == -1)
          {
            endPos = offlineData.length();
          }

          String line = offlineData.substring(startPos, endPos);
          line.trim();

          if (line.length() > 0)
          {
            MQTT::publish(mqtt_topic_str.c_str(), line.c_str());
            Serial.printf("[Offline] Sent reading %d/%d\n", sentCount + 1, offlineCount);
            sentCount++;
            delay(100); // Small delay between sends
          }

          startPos = endPos + 1;
        }

        // Clear offline storage after successful send
        StorageHelper::clearOfflineReadings();
        Serial.printf("[Offline] Successfully sent %d offline readings\n", sentCount);
      }
    }
  }

  float temp = TempSensor::readCelsius();
  if (temp == DEVICE_DISCONNECTED_C)
  {
    Serial.println("Sensor error");
  }
  else
  {
    char payload[256];
    const char *ts = TimeHelper::getLocalTimestamp();
    userId = StorageHelper::getConfigValue("/user.json", "userId");
    deviceId = StorageHelper::getConfigValue("/device.json", "deviceId");

    if (!StorageHelper::buildPayload(payload, sizeof(payload), deviceId, temp, ts, userId))
    {
      Serial.println("[ERR] JSON serialize failed (buffer too small?)");
      delay(2000);
      return;
    }

    // If online, publish directly. If offline, store locally.
    if (wifiConnected && mqttConnected)
    {
      MQTT::publish(mqtt_topic_str.c_str(), payload);
      Serial.printf("[MQTT] publish topic=%s len=%u | %s\n",
                    mqtt_topic_str.c_str(), (unsigned)strlen(payload), payload);
    }
    else
    {
      // Store offline
      Serial.println("[Offline] No connection, storing reading locally");
      StorageHelper::appendOfflineReading(deviceId.c_str(), temp, ts, userId.c_str());

      // Report status
      int count = StorageHelper::getOfflineReadingCount();
      size_t fileSize = StorageHelper::getOfflineFileSize();
      Serial.printf("[Offline] Total stored: %d readings, %u bytes\n", count, (unsigned)fileSize);
    }

    delay(10000);
  }
}