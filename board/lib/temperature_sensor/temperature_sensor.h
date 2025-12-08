#pragma once
#include <DallasTemperature.h>
#include "offline_sync_helper.h"
#include <Arduino.h>

class TempSensor
{
public:
    static void setup();
    static float readCelsius();
    static void publishTemperature(float temperature, OfflineSyncHelper offlineSync, String mqtt_topic_str, String userId, String deviceId);
    static void publishTemperatureIfDue(OfflineSyncHelper offlineSync, String mqtt_topic_str, String userId, String deviceId);
};
