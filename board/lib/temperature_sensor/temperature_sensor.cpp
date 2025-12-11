#include "temperature_sensor.h"
#include <OneWire.h>
#include <DallasTemperature.h>
#include <time_helper.h>
#include <storage_helper.h>
#include "offline_sync_helper.h"
#include <mqtt_helper.h>

constexpr uint8_t DATA_PIN = 4;
OneWire oneWire(DATA_PIN);
DallasTemperature sensor(&oneWire);

void TempSensor::setup()
{
    sensor.begin();
}

float TempSensor::readCelsius()
{
    sensor.requestTemperatures();
    return sensor.getTempCByIndex(0);
}

void TempSensor::publishTemperature(float temperature, OfflineSyncHelper offlineSync, String mqtt_topic_str, String userId, String deviceId)
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
        // Online - lähetä suoraan
        Serial.printf("[MQTT] About to publish on topic=%s\n", mqtt_topic_str.c_str());
        MQTT::publish(mqtt_topic_str.c_str(), payload);
        Serial.printf("[MQTT] publish topic=%s len=%d | %s\n",
                      mqtt_topic_str.c_str(), strlen(payload), payload);
    }
    else
    {
        // Offline - tallenna jonoon
        offlineSync.queueEvent(mqtt_topic_str.c_str(), payload, millis());
        Serial.printf("[Offline] Queued: %s\n", payload);
    }
}

// Report temperature every 10 seconds
void TempSensor::publishTemperatureIfDue(OfflineSyncHelper offlineSync, String mqtt_topic_str, String userId, String deviceId)
{
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
}