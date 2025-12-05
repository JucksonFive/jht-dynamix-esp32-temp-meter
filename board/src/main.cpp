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
#include "offline_sync_helper.h"
#include <ArduinoJson.h>

// Global variables
OfflineSyncHelper offlineSync;

unsigned long lastSyncAttempt = 0;
const unsigned long SYNC_INTERVAL = 60000;

unsigned long lastStatusPublish = 0;
const unsigned long MEASUREMENT_INTERVAL_MS = 10000;
const unsigned long STATUS_INTERVAL_MS = 30000;

String mqtt_server_str;
String mqtt_topic_str;
String userId;
int mqtt_port;
String clientId;
String deviceId;
String statusTopic;

void publishStatus(bool retained)
{
  if (!MQTT::isConnected())
  {
    return;
  }

  JsonDocument doc;
  doc["userId"] = userId;
  doc["deviceId"] = deviceId;
  doc["status"] = "ONLINE";
  doc["ts"] = TimeHelper::getLocalTimestamp();

  char payload[192];
  size_t n = serializeJson(doc, payload, sizeof(payload));
  if (n == 0)
  {
    Serial.println("[Status] Failed to serialize status JSON");
    return;
  }

  Serial.printf("[Status] Publishing %s to %s (retained=%s)\n",
                doc["status"].as<const char *>(),
                statusTopic.c_str(),
                retained ? "true" : "false");

  MQTT::publish(statusTopic.c_str(), payload, retained);
}

void setup()
{
  Serial.begin(115200);
  delay(1000);

  // Initialize LittleFS, format if corrupted
  if (!LittleFS.begin(true))
  { // true = format if failed
    Serial.println("LittleFS mount/format failed!");
    while (true)
      ;
  }
  Serial.println("LittleFS mounted");

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

  userId = StorageHelper::getConfigValue("/user.json", "userId");
  deviceId = StorageHelper::getConfigValue("/device.json", "deviceId");
  statusTopic = "devices/" + deviceId + "/status";
  clientId = "esp32-" + String(WiFi.macAddress());

  MQTT::setup(mqtt_server_str.c_str(), mqtt_port);
  MQTT::ensureConnection(clientId.c_str());

  TimeHelper::setup();
  TempSensor::setup();

  // Load device and user information
  userId = StorageHelper::getConfigValue("/user.json", "userId");
  deviceId = StorageHelper::getConfigValue("/device.json", "deviceId");

  // Alusta offline sync
  if (!offlineSync.begin())
  {
    Serial.println("Failed to initialize offline sync");
  }
  else
  {
    Serial.printf("Offline sync ready, %d pending events\n", offlineSync.getPendingCount());
  }
  publishStatus(true);
}

// Callback-funktio MQTT-lähetykselle
bool sendMqttMessage(const char *topic, const char *payload)
{
  if (!MQTT::isConnected())
  {
    return false;
  }
  MQTT::publish(topic, payload);
  return true;
}

void publishTemperature(float temperature)
{
  Serial.printf("[publishTemperature] MQTT connected: %s\n",
                MQTT::isConnected() ? "YES" : "NO");
  char payload[256];
  const char *ts = TimeHelper::getLocalTimestamp();
  userId = StorageHelper::getConfigValue("/user.json", "userId");
  deviceId = StorageHelper::getConfigValue("/device.json", "deviceId");

  if (!StorageHelper::buildPayload(payload, sizeof(payload), deviceId, temperature, ts, userId))
  {
    Serial.println("[ERR] JSON serialize failed (buffer too small?)");
    delay(2000);
    return;
  }

  if (MQTT::isConnected())
  {
    // Online - send directly
    Serial.printf("[MQTT] About to publish on topic=%s\n", mqtt_topic_str.c_str());
    MQTT::publish(mqtt_topic_str.c_str(), payload);
    Serial.printf("[MQTT] publish topic=%s len=%d | %s\n",
                  mqtt_topic_str.c_str(), strlen(payload), payload);
  }
  else
  {
    // Offline - save to queue
    offlineSync.queueEvent(mqtt_topic_str.c_str(), payload, millis());
    Serial.printf("[Offline] Queued: %s\n", payload);
  }
}

void loop()
{
  WifiScanHelper::processScanResult();
  ResetHelper::loop();

  if (!isSetupComplete())
  {
    processCaptivePortalDNS();
    delay(10);
    return;
  }
  const unsigned long now = millis();

  // try to maintain MQTT connection
  if (!MQTT::isConnected())
  {
    static unsigned long lastConnectAttempt = 0;
    if (now - lastConnectAttempt > 5000) // Try every 5 seconds
    {
      MQTT::ensureConnection(clientId.c_str());
      lastConnectAttempt = now;
    }
  }

  if (MQTT::isConnected())
  {
    MQTT::loop();
  }

  if (MQTT::isConnected() && now - lastStatusPublish > STATUS_INTERVAL_MS)
  {
    publishStatus(/*retained=*/false);
    lastStatusPublish = now;
  }

  // Read and publish every 10s (regardless of MQTT connection)
  static unsigned long lastPublish = 0;
  if (now - lastPublish > MEASUREMENT_INTERVAL_MS)
  {
    float temp = TempSensor::readCelsius();
    Serial.printf("[Sensor] Read temp=%.2f C\n", temp);
    if (temp != DEVICE_DISCONNECTED_C)
    {
      publishTemperature(temp);
    }
    else
    {
      Serial.println("[Sensor] Temperature sensor disconnected or read failed");
    }
    lastPublish = now;
  }

  // Sync offline events periodically
  if (MQTT::isConnected() && offlineSync.hasPendingEvents() &&
      now - lastSyncAttempt > SYNC_INTERVAL)
  {
    Serial.println("Attempting to sync offline events...");
    offlineSync.syncPendingEvents(sendMqttMessage);
    lastSyncAttempt = now;
  }

  delay(100); // Short delay to prevent watchdog reset
}