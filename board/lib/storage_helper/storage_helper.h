#pragma once
#include <Arduino.h>

namespace StorageHelper
{
    String getAuthUrlFromConfig(const String &key);
}