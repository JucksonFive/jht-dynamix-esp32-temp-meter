#include <Arduino.h>
#include "wifi_helper.h"
#include "mqtt_helper.h"
#include "temperature_sensor.h"
#include <WiFi.h>
#include <time_helper.h>

const char *ssid = "Villa Papanizzio";
const char *password = "Gonzales";

const char *mqtt_server = "a2ig9dwsqscl2t-ats.iot.eu-north-1.amazonaws.com";
const int mqtt_port = 8883;
const char *mqtt_topic = "sensors/temperature";
String clientId = "esp32-" + String(WiFi.macAddress());

void setup()
{
  Serial.begin(115200);
  delay(1000);
  WifiHelper::connect(ssid, password);
  TimeHelper::setup();
  TempSensor::setup();
  MQTT::setup(mqtt_server, mqtt_port);
  MQTT::ensureConnection(clientId.c_str());
}

void loop()
{
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

    MQTT::publish(mqtt_topic, payload);

    Serial.printf("Published: %s \n", payload);
  }

  delay(5000);
}
