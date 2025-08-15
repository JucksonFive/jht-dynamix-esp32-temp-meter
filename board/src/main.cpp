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

  if (!isSetupComplete())
  {
    Serial.println("[Setup] Setup not complete, starting wizard");

    startSetupWebServer();
    return;
  }

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
  if (!isSetupComplete())
  {
    Serial.println("[DEBUG] Setup not complete, skipping MQTT operations");
    delay(1000);
    return;
  }

  if (!MQTT::isConnected())
  {
    MQTT::ensureConnection(clientId.c_str());
  }
  MQTT::loop();

  float temp = TempSensor::readCelsius();
  if (temp == DEVICE_DISCONNECTED_C)
  {
    Serial.println("Sensor error");
  }
  else
  {
    char payload[128];
    const char *ts = TimeHelper::getLocalTimestamp();
    userId = StorageHelper::getConfigValue("/user.json", "userId");
    deviceId = StorageHelper::getConfigValue("/device.json", "deviceId");

    snprintf(payload, sizeof(payload),
             "{\"deviceId\":\"%s\",\"temperature\":%.2f,\"timestamp\":\"%s\",\"userId\":\"%s\"}",
             deviceId.c_str(), temp, ts, userId.c_str());

    delay(10000);

    MQTT::publish(mqtt_topic_str.c_str(), payload);

    Serial.printf("Published: %s \n", payload);
  }

  delay(5000);
}
