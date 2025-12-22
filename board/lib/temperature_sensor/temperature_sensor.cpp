#include "temperature_sensor.h"

#include <Wire.h>

#include <time_helper.h>
#include <storage_helper.h>
#include "offline_sync_helper.h"
#include <mqtt_helper.h>
#include <Adafruit_AHTX0.h>

namespace
{
    Adafruit_AHTX0 aht;
    constexpr uint8_t I2C_SDA = 8;
    constexpr uint8_t I2C_SCL = 9;
    constexpr unsigned long PUBLISH_INTERVAL_MS = 60UL * 60UL * 1000UL; // 1 hour
}

void TempSensor::setup()
{
    Wire.begin(I2C_SDA, I2C_SCL);

    if (!aht.begin())
    {
        Serial.println("[ERR] AHT10 not found. Check wiring / I2C pins.");
        return;
    }

    Serial.println("[OK] AHT10 initialized");
}

float TempSensor::readCelsius()
{
    sensors_event_t humidityEvent;
    sensors_event_t tempEvent;

    // aht.getEvent(&humidity, &temp) -> in this order
    const bool ok = aht.getEvent(&humidityEvent, &tempEvent);
    if (!ok)
    {
        return NAN;
    }

    return tempEvent.temperature;
}

void TempSensor::publishTemperature(
    float temperature,
    float humidity,
    OfflineSyncHelper &offlineSync,
    const String &mqttTopic,
    const String &userId,
    const String &deviceId)
{
    Serial.printf("[publishTemperature] MQTT connected: %s\n", MQTT::isConnected() ? "YES" : "NO");

    char payload[256];
    const char *ts = TimeHelper::getLocalTimestamp();

    const String resolvedUserId = StorageHelper::getConfigValue("/user.json", "userId");
    const String resolvedDeviceId = StorageHelper::getConfigValue("/device.json", "deviceId");

    if (!StorageHelper::buildPayload(
            payload,
            sizeof(payload),
            resolvedDeviceId,
            temperature,
            humidity,
            ts,
            resolvedUserId))
    {
        Serial.println("[ERR] JSON serialize failed (buffer too small?)");
        delay(2000);
        return;
    }

    if (MQTT::isConnected())
    {
        Serial.printf("[MQTT] About to publish on topic=%s\n", mqttTopic.c_str());
        MQTT::publish(mqttTopic.c_str(), payload);
        Serial.printf("[MQTT] publish topic=%s len=%d | %s\n", mqttTopic.c_str(), strlen(payload), payload);
    }
    else
    {
        offlineSync.queueEvent(mqttTopic.c_str(), payload, millis());
        Serial.printf("[Offline] Queued: %s\n", payload);
    }
}

void TempSensor::publishTemperatureIfDue(
    OfflineSyncHelper &offlineSync,
    const String &mqttTopic,
    const String &userId,
    const String &deviceId)
{

    static unsigned long lastPublish = 0;

    if (lastPublish && (millis() - lastPublish <= PUBLISH_INTERVAL_MS))
    {
        return;
    }

    sensors_event_t humidityEvent;
    sensors_event_t tempEvent;
    const bool ok = aht.getEvent(&humidityEvent, &tempEvent);
    if (!ok)
    {
        Serial.println("[Sensor] AHT10 read failed");
        lastPublish = millis();
        return;
    }

    const float temp = tempEvent.temperature;
    const float humidity = humidityEvent.relative_humidity;

    Serial.printf("[Sensor] Read temp=%.2f C, humidity=%.2f %%\n", temp, humidity);
    TempSensor::publishTemperature(temp, humidity, offlineSync, mqttTopic, userId, deviceId);

    lastPublish = millis();
}
