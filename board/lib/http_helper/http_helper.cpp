#include "http_helper.h"

namespace HttpHelper
{
    bool ensureWifiConnected(const __FlashStringHelper *tag)
    {
        if (WiFi.status() != WL_CONNECTED)
        {
            Serial.print(tag);
            Serial.println(F(" WiFi not connected"));
            return false;
        }
        Serial.print(tag);
        Serial.print(F(" WiFi OK IP="));
        Serial.println(WiFi.localIP());
        return true;
    }

    bool beginHttps(HTTPClient &https, WiFiClientSecure &client, const String &url, const __FlashStringHelper *tag)
    {
        Serial.print(tag);
        Serial.print(F(" Begin HTTPS: "));
        Serial.println(url);
        if (!https.begin(client, url))
        {
            Serial.print(tag);
            Serial.println(F(" ERROR begin() failed"));
            return false;
        }
        return true;
    }

    void logHttpError(HTTPClient &https, int code, const __FlashStringHelper *tag)
    {
        if (code > 0)
        {
            String body = https.getString();
            Serial.print(tag);
            Serial.print(F(" Error body: "));
            Serial.println(body);
        }
        else
        {
            Serial.print(tag);
            Serial.print(F(" Transport error: "));
            Serial.println(https.errorToString(code));
        }
    }
}