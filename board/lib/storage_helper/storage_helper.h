#pragma once
#include <Arduino.h>

class StorageHelper
{
public:
    static String getConfigValue(const String &path, const String &key);
    static bool saveJsonValue(const char *path, const char *key, const String &value);
    static bool saveUserResponse(const char *path, const String &response);
    static bool buildPayload(char *out, size_t outSize,
                             const String &deviceId,
                             float temperature,
                             const char *ts,
                             const String &userId);

    // Offline data storage functions
    static bool appendOfflineReading(const char *deviceId, float temperature, const char *timestamp, const char *userId);
    static String getOfflineReadings();
    static bool clearOfflineReadings();
    static int getOfflineReadingCount();
    static size_t getOfflineFileSize();

    // Offline mode configuration
    static bool enableOfflineMode();
    static bool disableOfflineMode();
    static bool isOfflineModeEnabled();
};