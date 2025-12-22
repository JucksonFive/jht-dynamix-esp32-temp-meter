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
                             float humidity,
                             const char *ts,
                             const String &userId);
};