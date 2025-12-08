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
#include "../lib/common_helper/common_helper.h"

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

static inline bool handleSetupStart()
{
  if (!isSetupComplete())
  {
    Serial.println("[Setup] Setup not complete, starting wizard");
    startSetupWebServer();
    return false; // lopeta setup tähän, loop hoitaa captive-portalin
  }
  WiFi.mode(WIFI_STA);
  Serial.println("[Setup] Setup complete, switched to STA mode");
  return true;
}

static inline bool connectWifiFromStorage()
{
  if (!wifiCredentialsExist())
    return true; // ei tunnuksia -> ei virhettä, wizard jo hoidettu
  WifiCredentials creds;
  if (!wifi_config_manager::readCredentials(creds))
  {
    Serial.println("[WiFi] Failed to read wifi.json, starting setup wizard");
    startSetupWebServer();
    return false;
  }

  WiFi.begin(creds.ssid.c_str(), creds.password.c_str());
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 10000)
  {
    delay(100);
  }
  if (WiFi.status() != WL_CONNECTED)
  {
    Serial.println("[WiFi] Connection failed, starting wizard fallback");
    startSetupWebServer();
    return false;
  }
  Serial.println("[WiFi] Connected");
  return true;
}

static inline bool initMqtt()
{
  Serial.println("MQTT::SETUP");
  mqtt_server_str = StorageHelper::getConfigValue("/config/config.json", "mqtt_server");
  mqtt_topic_str = StorageHelper::getConfigValue("/config/config.json", "mqtt_topic");
  mqtt_port = StorageHelper::getConfigValue("/config/config.json", "mqtt_port").toInt();

  if (mqtt_server_str.length() == 0)
  {
    Serial.println("[ERROR] mqtt_server missing or invalid");
    return false;
  }
  clientId = "esp32-" + String(WiFi.macAddress());
  MQTT::setup(mqtt_server_str.c_str(), mqtt_port);
  MQTT::ensureConnection(clientId.c_str());
  return true;
}

static inline void initTimeAndSensors()
{
  TimeHelper::setup();
  TempSensor::setup();
}

static inline void loadUserAndDeviceIds()
{
  userId = StorageHelper::getConfigValue("/user.json", "userId");
  deviceId = StorageHelper::getConfigValue("/device.json", "deviceId");
}

static inline void initOfflineSync()
{
  if (!offlineSync.begin())
  {
    Serial.println("Failed to initialize offline sync");
  }
  else
  {
    Serial.printf("Offline sync ready, %d pending events\n", offlineSync.getPendingCount());
  }
}

void setup()
{
  Serial.begin(115200);
  delay(1000);

  if (!CommonHelper::initLittleFS())
  {
    while (true)
      ;
  }

  // Reset button helper initialization (long press 3s on GPIO0 -> factory reset)
  ResetHelper::setup(/*pin=*/0, /*longPressMs=*/3000, /*shortPressRestart=*/false);

  if (!handleSetupStart())
    return;

  if (!connectWifiFromStorage())
    return;

  if (!initMqtt())
  {
    while (true)
      ;
  }

  initTimeAndSensors();

  loadUserAndDeviceIds();

  initOfflineSync();
}

static inline bool handleSetupFlow()
{
  if (!isSetupComplete())
  {
    processCaptivePortalDNS();
    delay(10);
    return false;
  }
  return true;
}

void loop()
{
  WifiScanHelper::processScanResult();
  ResetHelper::loop();

  if (!handleSetupFlow())
  {
    return;
  }
  MQTT::maintainMqttConnection(clientId);
  TempSensor::publishTemperatureIfDue(offlineSync, mqtt_topic_str, userId, deviceId);
  OfflineSyncHelper::attemptOfflineSync(offlineSync, lastSyncAttempt, SYNC_INTERVAL);

  delay(100); // Short delay to prevent watchdog reset
}