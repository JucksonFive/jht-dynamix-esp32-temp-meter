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

const char *mqtt_server;
int mqtt_port;
const char *mqtt_topic;

String clientId;

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

    // 🔧 Säilytä sekä AP että STA käytössä setupin aikana
    WiFi.mode(WIFI_AP_STA);
    WiFi.softAP("TempSensor-Setup");

    startSetupWebServer();
    return;
  }

  if (wifiCredentialsExist())
  {
    WifiCredentials creds;
    if (!wifi_config_manager::readCredentials(creds))
    {
      Serial.println("[WiFi] Failed to read wifi.json, starting setup wizard");
      WiFi.softAP("TempSensor-Setup");
      startSetupWebServer();
      return;
    }

    WiFi.mode(WIFI_AP_STA);
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
      WiFi.softAP("TempSensor-Setup");
      startSetupWebServer();
      return;
    }

    Serial.println("[WiFi] Connected");
  }

  Serial.println("MQTT::SETUP");

  String mqttServerStr = StorageHelper::getConfigValue("/config/config.json", "mqtt_server");
  String mqttPortStr = StorageHelper::getConfigValue("/config/config.json", "mqtt_port");
  String mqttTopicStr = StorageHelper::getConfigValue("/config/config.json", "mqtt_topic");

  mqtt_server = mqttServerStr.c_str();
  mqtt_port = mqttPortStr.toInt();
  mqtt_topic = mqttTopicStr.c_str();

  clientId = "esp32-" + String(WiFi.macAddress());
  TimeHelper::setup();
  TempSensor::setup();
  MQTT::setup(mqtt_server, mqtt_port);
  MQTT::ensureConnection(clientId.c_str());
}

void loop()
{
  // If setup is not complete, don't run MQTT operations
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

    snprintf(payload, sizeof(payload),
             "{\"deviceId\":\"esp32-1\",\"temperature\":%.2f,\"timestamp\":\"%s\"}",
             temp, ts);

    delay(10000);

    MQTT::publish(mqtt_topic, payload);

    Serial.printf("Published: %s \n", payload);
  }

  delay(5000);
}
