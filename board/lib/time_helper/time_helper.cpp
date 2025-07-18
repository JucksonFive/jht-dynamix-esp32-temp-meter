#include "time_helper.h"
#include <Arduino.h>
#include <time.h>

namespace
{
    char timestampBuffer[40];
}

void TimeHelper::setup()
{

    configTime(0, 0, "pool.ntp.org", "time.nist.gov");

    struct tm timeinfo;
    int retries = 0;
    while (!getLocalTime(&timeinfo) && retries++ < 10)
    {
        Serial.println("⏳ Waiting for NTP time...");
        delay(1000);
    }

    if (!getLocalTime(&timeinfo))
    {
        Serial.println("❌ NTP sync failed");
        return;
    }

    setenv("TZ", "EET-2EEST,M3.5.0/3,M10.5.0/4", 1);
    tzset();

    getLocalTime(&timeinfo);
    Serial.println("✅ Time synchronized");
    Serial.printf("Current time: %02d:%02d:%02d\n", timeinfo.tm_hour, timeinfo.tm_min, timeinfo.tm_sec);
    Serial.printf("TZ=%s\n", getenv("TZ"));
}


const char* TimeHelper::getLocalTimestamp()
{
    time_t now = time(nullptr);
    struct tm timeinfo;
    localtime_r(&now, &timeinfo);

    // Format timestamp to ISO 8601: +HHMM (e.g. +0300)
    strftime(timestampBuffer, sizeof(timestampBuffer), "%Y-%m-%dT%H:%M:%S%z", &timeinfo);

    // Fix format to +HH:MM (e.g. +03:00)
    size_t len = strlen(timestampBuffer);
    if (len >= 5 && (timestampBuffer[len - 5] == '+' || timestampBuffer[len - 5] == '-')) {
        memmove(&timestampBuffer[len + 1], &timestampBuffer[len - 2], 3); // shift "00\0"
        timestampBuffer[len - 2] = ':'; // insert ':'
    }

    return timestampBuffer;
}
