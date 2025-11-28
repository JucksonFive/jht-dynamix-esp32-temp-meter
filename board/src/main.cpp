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
unsigned long lastStatusUpdate = 0;
const unsigned long STATUS_INTERVAL = 30000; // 30 seconds for near real-time status

// Helper function to send device status
void sendDeviceStatus(const char *status)
{
  if (deviceId.length() == 0)
  {
    return; // Device not configured yet
  }

  char statusPayload[256];
  const char *ts = TimeHelper::getLocalTimestamp();

  if (StorageHelper::buildStatusPayload(statusPayload, sizeof(statusPayload), deviceId, status, ts, userId))
  {
    MQTT::publishStatus(deviceId.c_str(), status, statusPayload);
    lastStatusUpdate = millis();
  }
  else
  {
    Serial.println("[Status] Failed to build status payload");
  }
}

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

  // Load device and user information
  userId = StorageHelper::getConfigValue("/user.json", "userId");
  deviceId = StorageHelper::getConfigValue("/device.json", "deviceId");

  // Send initial online status
  sendDeviceStatus("online");
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

  if (!MQTT::isConnected())
  {
    MQTT::ensureConnection(clientId.c_str());
    // Send online status after reconnection
    sendDeviceStatus("online");
  }
  MQTT::loop();

  // Send heartbeat status update every 30 seconds
  if (millis() - lastStatusUpdate >= STATUS_INTERVAL)
  {
    sendDeviceStatus("online");
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

    MQTT::publish(mqtt_topic_str.c_str(), payload);
    Serial.printf("[MQTT] publish topic=%s len=%u | %s\n",
                  mqtt_topic_str.c_str(), (unsigned)strlen(payload), payload);
    delay(10000);
  }
}