#pragma once
#include <Arduino.h>

namespace StorageHelper
{
    String getConfigValue(const String &path, const String &key);
}