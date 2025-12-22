#pragma once

#include <Arduino.h>

class OfflineSyncHelper;

class TempSensor
{
public:
    static void setup();
    static float readCelsius();

    static void publishTemperature(
        float temperature,
        OfflineSyncHelper &offlineSync,
        const String &mqttTopic,
        const String &userId,
        const String &deviceId);

    static void publishTemperature(
        float temperature,
        float humidity,
        OfflineSyncHelper &offlineSync,
        const String &mqttTopic,
        const String &userId,
        const String &deviceId);

    static void publishTemperatureIfDue(
        OfflineSyncHelper &offlineSync,
        const String &mqttTopic,
        const String &userId,
        const String &deviceId);
};
