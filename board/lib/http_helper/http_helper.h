#pragma once
#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>

namespace HttpHelper
{
    bool ensureWifiConnected(const __FlashStringHelper *tag = F("[Net]"));
    bool beginHttps(HTTPClient &https, WiFiClientSecure &client, const String &url, const __FlashStringHelper *tag = F("[HTTP]"));
    void logHttpError(HTTPClient &https, int code, const __FlashStringHelper *tag = F("[HTTP]"));
}