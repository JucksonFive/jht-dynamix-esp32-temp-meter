#include "http_helper.h"

namespace
{
#if defined(UNIT_TEST) || defined(PIO_UNIT_TESTING)
    HttpHelper::WifiStatusFn g_statusFn = nullptr;
    HttpHelper::LocalIpFn g_ipFn = nullptr;
    HttpHelper::BeginHttpsFn g_beginFn = nullptr;
#endif
}

namespace HttpHelper
{
    bool ensureWifiConnected(const __FlashStringHelper *tag)
    {
#if defined(UNIT_TEST) || defined(PIO_UNIT_TESTING)
        wl_status_t status = g_statusFn ? g_statusFn() : WiFi.status();
#else
        wl_status_t status = WiFi.status();
#endif
        if (status != WL_CONNECTED)
        {
            Serial.print(tag);
            Serial.println(F(" WiFi not connected"));
            return false;
        }
        Serial.print(tag);
        Serial.print(F(" WiFi OK IP="));
#if defined(UNIT_TEST) || defined(PIO_UNIT_TESTING)
        IPAddress ip = g_ipFn ? g_ipFn() : WiFi.localIP();
#else
        IPAddress ip = WiFi.localIP();
#endif
        Serial.println(ip);
        return true;
    }

    bool beginHttps(HTTPClient &https, WiFiClientSecure &client, const String &url, const __FlashStringHelper *tag)
    {
        Serial.print(tag);
        Serial.print(F(" Begin HTTPS: "));
        Serial.println(url);
#if defined(UNIT_TEST) || defined(PIO_UNIT_TESTING)
        const bool ok = g_beginFn ? g_beginFn(https, client, url) : https.begin(client, url);
#else
        const bool ok = https.begin(client, url);
#endif
        if (!ok)
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

#if defined(UNIT_TEST) || defined(PIO_UNIT_TESTING)
    void setTestHooks(WifiStatusFn statusFn, LocalIpFn ipFn, BeginHttpsFn beginFn)
    {
        g_statusFn = statusFn;
        g_ipFn = ipFn;
        g_beginFn = beginFn;
    }

    void resetTestHooks()
    {
        g_statusFn = nullptr;
        g_ipFn = nullptr;
        g_beginFn = nullptr;
    }
#endif
}
