#include "temperature_sensor.h"

#include <Wire.h>

#include <time_helper.h>
#include <storage_helper.h>
#include "offline_sync_helper.h"
#include <mqtt_helper.h>
#include <Adafruit_SHT31.h>

namespace
{
    Adafruit_SHT31 sht31 = Adafruit_SHT31();
    constexpr uint8_t I2C_SDA = 8;
    constexpr uint8_t I2C_SCL = 9;
    constexpr uint8_t SHT3X_I2C_ADDR = 0x44;               // GY-SHT31-D default address
    constexpr unsigned long PUBLISH_INTERVAL_MS = 3600000; // 1 hour
}

void TempSensor::setup()
{
    Wire.begin(I2C_SDA, I2C_SCL);

    if (!sht31.begin(SHT3X_I2C_ADDR))
    {
        Serial.println("[ERR] SHT30 not found. Check wiring / I2C pins / address (0x44/0x45).");
        return;
    }

    sht31.heater(false);
    Serial.println("[OK] SHT31 initialized");
}

float TempSensor::readCelsius()
{
    const float temp = sht31.readTemperature();
    if (isnan(temp))
    {
        return NAN;
    }
    return temp;
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
        if (MQTT::publish(mqttTopic.c_str(), payload))
        {
            Serial.printf("[MQTT] publish topic=%s len=%d | %s\n", mqttTopic.c_str(), strlen(payload), payload);
        }
        else
        {
            Serial.println("[MQTT] Publish failed (SSL error?), queuing offline");
            offlineSync.queueEvent(mqttTopic.c_str(), payload, millis());
        }
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

    const float temp = sht31.readTemperature();
    const float humidity = sht31.readHumidity();

    if (isnan(temp) || isnan(humidity))
    {
        Serial.println("[Sensor] SHT30 read failed");
        lastPublish = millis();
        return;
    }

    Serial.printf("[Sensor] Read temp=%.2f C, humidity=%.2f %%\n", temp, humidity);
    TempSensor::publishTemperature(temp, humidity, offlineSync, mqttTopic, userId, deviceId);

    lastPublish = millis();
}
