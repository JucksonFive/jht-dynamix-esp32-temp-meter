// Auth helper implementation
// Breaks the monolithic authenticateUser flow into smaller focused helpers.
// Public API remains: bool AuthHelper::authenticateUser(const String&, const String&)

#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include "cert_helper.h"
#include "auth_helper.h"
#include <LittleFS.h>
#include <storage_helper.h>

String authUrl; // cached auth URL from config

namespace
{
    constexpr uint32_t CLIENT_TIMEOUT_MS = 10000; // TLS socket timeout
    constexpr uint32_t HTTP_TIMEOUT_MS = 15000;   // HTTP request timeout
    constexpr char USER_FILE_PATH[] = "/user.json";
    constexpr char CONFIG_PATH[] = "/config/config.json";
    constexpr char CONFIG_KEY_AUTH_URL[] = "auth_url";

    bool ensureWifiConnected()
    {
        if (WiFi.status() != WL_CONNECTED)
        {
            Serial.println(F("[Auth] ERROR: WiFi not connected"));
            return false;
        }
        Serial.printf("[Auth] WiFi connected, IP: %s\n", WiFi.localIP().toString().c_str());
        return true;
    }

    bool beginHttps(HTTPClient &https, WiFiClientSecure &client, String &outAuthUrl)
    {
        Serial.println(F("[Auth] Beginning HTTPS connection..."));
        outAuthUrl = StorageHelper::getConfigValue(CONFIG_PATH, CONFIG_KEY_AUTH_URL);
        if (outAuthUrl.isEmpty())
        {
            Serial.println(F("[Auth] ERROR: auth_url missing in config"));
            return false;
        }
        if (!https.begin(client, outAuthUrl))
        {
            Serial.println(F("[Auth] ERROR: Failed to begin HTTPS connection"));
            return false;
        }
        Serial.println(F("[Auth] HTTPS connection established"));
        return true;
    }

    String buildPayload(const String &username, const String &password)
    {
        // Avoid dynamic String concatenation in multiple steps to reduce fragmentation.
        String payload;
        payload.reserve(username.length() + password.length() + 32);
        payload = F("{\"username\":\"");
        payload += username;
        payload += F("\",\"password\":\"");
        payload += password;
        payload += F("\"}");
        return payload;
    }

    void logHttpError(HTTPClient &https, int code)
    {
        if (code > 0)
        {
            String response = https.getString();
            Serial.printf("[Auth] Error response: %s\n", response.c_str());
        }
        else
        {
            Serial.printf("[Auth] HTTP error: %s\n", https.errorToString(code).c_str());
        }
    }
}

bool AuthHelper::authenticateUser(const String &username, const String &password)
{
    Serial.printf("[Auth] Authenticating user '%s'\n", username.c_str());
    Serial.printf("[Auth] Password: '%s'\n", password.c_str());

    if (!ensureWifiConnected())
        return false;

    WiFiClientSecure client;
    Serial.println(F("[Auth] Setting up secure client..."));
    client.setTimeout(CLIENT_TIMEOUT_MS);

    CertHelper::attachRootCA(client);

    HTTPClient https;
    if (!beginHttps(https, client, authUrl))
        return false;

    https.addHeader(F("Content-Type"), F("application/json"));
    https.setTimeout(HTTP_TIMEOUT_MS);

    const String payload = buildPayload(username, password);
    Serial.printf("[Auth] Sending POST request with payload: %s\n", payload.c_str());

    const int httpCode = https.POST(payload);
    Serial.printf("[Auth] HTTP POST response code: %d\n", httpCode);

    bool success = false;
    if (httpCode == 200)
    {
        const String response = https.getString();
        Serial.printf("[Auth] Response: %s\n", response.c_str());
        success = StorageHelper::saveUserResponse(USER_FILE_PATH, response);
    }
    else
    {
        logHttpError(https, httpCode);
    }

    https.end();
    return success;
}
