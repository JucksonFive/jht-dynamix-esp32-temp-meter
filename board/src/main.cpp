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

OfflineSyncHelper offlineSync;
unsigned long lastSyncAttempt = 0;
const unsigned long SYNC_INTERVAL = 60000; // sync every 60 seconds

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
    return false;
  }
  WiFi.mode(WIFI_STA);
  Serial.println("[Setup] Setup complete, switched to STA mode");
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

  constexpr int RESET_PIN = 0;
  // Reset button helper initialization (long press 3s on GPIO0 -> factory reset)
  ResetHelper::setup(/*pin=*/RESET_PIN, /*longPressMs=*/3000, /*shortPressRestart=*/false);

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

// LISÄYS: Globaali tilatieto
bool isOnline = false;
unsigned long lastConnectionCheck = 0;
const unsigned long CONNECTION_CHECK_INTERVAL = 5000; // Tarkista tila 5s välein

// LISÄYS: Uusi funktio, joka päivittää 'isOnline' muuttujaa nopeasti
void checkConnectionStatus()
{
  unsigned long now = millis();
  if (now - lastConnectionCheck >= CONNECTION_CHECK_INTERVAL)
  {
    lastConnectionCheck = now;

    bool wifiOk = (WiFi.status() == WL_CONNECTED);
    bool mqttOk = MQTT::isConnected();

    if (wifiOk && mqttOk)
    {
      if (!isOnline)
      {
        Serial.println("[Status] System is ONLINE");
        isOnline = true;
      }
    }
    else
    {
      if (isOnline)
      {
        Serial.printf("[Status] System went OFFLINE (WiFi: %s, MQTT: %s)\n",
                      wifiOk ? "OK" : "FAIL",
                      mqttOk ? "OK" : "FAIL");
        isOnline = false;
      }
    }
  }
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

  // 1. Tarkista tila nopeasti
  checkConnectionStatus();

  // Varmistetaan että MQTT yrittää yhdistää vain jos WiFi on pystyssä
  if (WiFi.status() == WL_CONNECTED)
  {
    MQTT::maintainMqttConnection(clientId);
  }

  // 3. Sensorin luku toimii riippumatta yhteydestä
  // TempSensorille voi välittää isOnline-tiedon tai antaa sen päättää itse MQTT::isConnected():n perusteella
  TempSensor::publishTemperatureIfDue(offlineSync, mqtt_topic_str, userId, deviceId);

  // 4. Synkronointi vain jos ollaan online
  if (isOnline)
  {
    OfflineSyncHelper::attemptOfflineSync(offlineSync, lastSyncAttempt, SYNC_INTERVAL);
  }

  delay(100);
}