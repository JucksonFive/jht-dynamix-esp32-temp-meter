#pragma once
#include <DallasTemperature.h>
namespace TempSensor
{
    void setup();
    float readCelsius();
    void publishTemperature(float temperature, OfflineSyncHelper offlineSync, String mqtt_topic_str, String userId, String deviceId);
}
