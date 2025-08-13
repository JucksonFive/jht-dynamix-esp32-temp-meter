#pragma once
#include <Arduino.h>

namespace StorageHelper
{
    String getConfigValue(const String &path, const String &key);
    bool saveJsonValue(const char *path, const char *key, const String &value);
}