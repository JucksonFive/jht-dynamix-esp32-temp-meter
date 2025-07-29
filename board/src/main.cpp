#include <Arduino.h>
#include "wifi_config.h"
#include "setup_webserver.h"
#include "mqtt_helper.h"
#include "storage_helper.h"
#include "temperature_sensor.h"
#include "time_helper.h"
#include <LittleFS.h>
#include <WiFi.h>

String mqttServerStr = StorageHelper::getConfigValue("mqtt_server");
String mqttPortStr = StorageHelper::getConfigValue("mqtt_port");
String mqttTopicStr = StorageHelper::getConfigValue("mqtt_topic");

const char *mqtt_server = mqttServerStr.c_str();
int mqtt_port = mqttPortStr.toInt();
const char *mqtt_topic = mqttTopicStr.c_str();

String clientId;

void setup()
{
  Serial.begin(115200);
  delay(1000);
  Serial.println("[DEBUG] mqtt_server: " + String(mqtt_server));
  Serial.println("[DEBUG] mqtt_port: " + String(mqtt_port));
  Serial.println("[DEBUG] mqtt_topic: " + String(mqtt_topic));

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

  if (wifiCredentialsExist() && connectToWifi())
  {
    Serial.println("[WiFi] Connected");
  }
  else
  {
    Serial.println("[WiFi] Starting setup wizard");
    startSetupWebServer();
    return;
  }

  if (WiFi.status() != WL_CONNECTED)
  {
    Serial.println("[WiFi] Still not connected, aborting init.");
    return;
  }
  Serial.println("MQTT::SETUP");

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
