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

// Globaalit muuttujat
OfflineSyncHelper offlineSync;
unsigned long lastSyncAttempt = 0;
const unsigned long SYNC_INTERVAL = 60000; // Yritä synciä minuutin välein

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

  if (!LittleFS.begin(true))
  {
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
  clientId = "esp32-" + String(WiFi.macAddress());
  MQTT::setup(mqtt_server_str.c_str(), mqtt_port);
  MQTT::ensureConnection(clientId.c_str());

  TimeHelper::setup();
  TempSensor::setup();

  // Load device and user information
  userId = StorageHelper::getConfigValue("/user.json", "userId");
  deviceId = StorageHelper::getConfigValue("/device.json", "deviceId");

  if (!offlineSync.begin())
  {
    Serial.println("Failed to initialize offline sync");
  }
  else
  {
    Serial.printf("Offline sync ready, %d pending events\n", offlineSync.getPendingCount());
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

  // Connect to MQTT if not connected
  if (!MQTT::isConnected())
  {
    static unsigned long lastConnectAttempt = 0;
    if (millis() - lastConnectAttempt > 5000) // Yritä 5s välein
    {
      MQTT::ensureConnection(clientId.c_str());
      lastConnectAttempt = millis();
    }
  }

  if (MQTT::isConnected())
  {
    MQTT::loop();
  }

  // Report temperature every 10 seconds
  static unsigned long lastPublish = 0;
  if (millis() - lastPublish > 10000)
  {
    float temp = TempSensor::readCelsius();
    Serial.printf("[Sensor] Read temp=%.2f C\n", temp);
    if (temp != DEVICE_DISCONNECTED_C)
    {
      TempSensor::publishTemperature(temp, offlineSync, mqtt_topic_str, userId, deviceId);
    }
    else
    {
      Serial.println("[Sensor] Temperature sensor disconnected or read failed");
    }
    lastPublish = millis();
  }

  OfflineSyncHelper::attemptOfflineSync(MQTT::isConnected(), offlineSync, lastSyncAttempt, SYNC_INTERVAL);

  delay(100); // Short delay to prevent watchdog reset
}