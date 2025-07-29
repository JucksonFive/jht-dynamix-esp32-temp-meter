#include "time_helper.h"
#include <Arduino.h>
#include <time.h>

namespace
{
    // Buffer for storing formatted timestamp strings
    char timestampBuffer[40];
}

/**
 * @brief Initialize time synchronization with NTP servers and set timezone
 *
 * This function configures NTP time synchronization and sets the timezone to
 * Eastern European Time (EET/EEST) which is used in Finland and Estonia.
 * The function waits up to 10 seconds for NTP synchronization to complete.
 *
 * Timezone configuration:
 * - Winter time (EET): UTC+2
 * - Summer time (EEST): UTC+3
 * - DST starts: Last Sunday of March at 3:00 AM
 * - DST ends: Last Sunday of October at 4:00 AM
 */
void TimeHelper::setup()
{
    // Configure NTP servers without timezone offset (UTC)
    configTime(0, 0, "pool.ntp.org", "time.nist.gov");

    struct tm timeinfo;
    int retries = 0;

    // Wait for NTP synchronization with retry limit
    while (!getLocalTime(&timeinfo) && retries++ < 10)
    {
        Serial.println("⏳ Waiting for NTP time...");
        delay(1000);
    }

    // Check if NTP synchronization was successful
    if (!getLocalTime(&timeinfo))
    {
        Serial.println("❌ NTP sync failed");
        return;
    }

    // Set timezone to Eastern European Time (Finland)
    setenv("TZ", "EET-2EEST,M3.5.0/3,M10.5.0/4", 1);
    tzset();

    getLocalTime(&timeinfo);
    Serial.println("✅ Time synchronized");
    Serial.printf("Current time: %02d:%02d:%02d\n", timeinfo.tm_hour, timeinfo.tm_min, timeinfo.tm_sec);
    Serial.printf("TZ=%s\n", getenv("TZ"));
}

/**
 * @brief Get current local timestamp in ISO 8601 format
 *
 * Returns the current local time as a formatted string in ISO 8601 format
 * with timezone offset. The format is: YYYY-MM-DDTHH:MM:SS+HH:MM
 *
 * @return const char* Pointer to static buffer containing formatted timestamp
 *                     Example: "2025-07-18T15:30:45+03:00"
 *
 * @note The returned pointer points to a static buffer that gets overwritten
 *       on subsequent calls to this function. Copy the string if you need
 *       to preserve it across multiple calls.
 */
const char *TimeHelper::getLocalTimestamp()
{
    time_t now = time(nullptr);
    struct tm timeinfo;

    localtime_r(&now, &timeinfo);

    strftime(timestampBuffer, sizeof(timestampBuffer), "%Y-%m-%dT%H:%M:%S%z", &timeinfo);

    size_t len = strlen(timestampBuffer);
    if (len >= 5 && (timestampBuffer[len - 5] == '+' || timestampBuffer[len - 5] == '-'))
    {
        memmove(&timestampBuffer[len + 1], &timestampBuffer[len - 2], 3); // Shift "00\0"
        timestampBuffer[len - 2] = ':';
    }

    return timestampBuffer;
}

void TimeHelper::scheduleRestart(unsigned long delayMs)
{
    if (delayMs == 0)
    {
        ESP.restart();
    }
    else
    {
        TaskHandle_t restartTask;
        xTaskCreate(
            [](void *param)
            {
                vTaskDelay(pdMS_TO_TICKS((unsigned long)param));
                ESP.restart();
            },
            "RestartTask", 2048, (void *)delayMs, 1, &restartTask);
    }
}