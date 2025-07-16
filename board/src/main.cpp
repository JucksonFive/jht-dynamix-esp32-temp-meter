#include <Arduino.h>
#include "wifi_helper.h"
#include "mqtt_helper.h"
#include "temperature_sensor.h"
#include <wifi_helper.h>

const char *ssid = "Villa Papanizzio";
const char *password = "Gonzales";

const char *mqtt_server = "broker.hivemq.com";
const int mqtt_port = 1883;
const char *mqtt_topic = "esp32/temperature";

void setup()
{
  Serial.begin(115200);
  delay(1000);

  WifiHelper::connect(ssid, password);

  TempSensor::setup();
  MQTT::setup(mqtt_server, mqtt_port);
  MQTT::ensureConnection("ESP32Client");
}

void loop()
{
  if (!MQTT::client.connected())
  {
    MQTT::ensureConnection("ESP32Client");
  }
  MQTT::loop();

  float temp = TempSensor::readCelsius();
  if (temp == DEVICE_DISCONNECTED_C)
  {
    Serial.println("Sensor error");
  }
  else
  {
    char payload[16];
    snprintf(payload, sizeof(payload), "%.2f", temp);
    MQTT::publish(mqtt_topic, payload);
    Serial.printf("Published: %s °C\n", payload);
  }

  delay(5000);
}
