// Auth helper implementation
// Breaks the monolithic authenticateUser flow into smaller focused helpers.
// Public API remains: bool AuthHelper::authenticateUser(const String&, const String&)

#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include "cert_helper.h"
#include "auth_helper.h"
#include <LittleFS.h>
#include <storage_helper.h>
#include <http_helper.h>

String authUrl;
constexpr uint32_t CLIENT_TIMEOUT_MS = 10000;
constexpr uint32_t HTTP_TIMEOUT_MS = 15000;
constexpr char USER_FILE_PATH[] = "/user.json";
constexpr char CONFIG_PATH[] = "/config/config.json";
constexpr char CONFIG_KEY_AUTH_URL[] = "auth_url";

String buildPayload(const String &username, const String &password)
{
    String payload;
    payload.reserve(username.length() + password.length() + 32);
    payload = F("{\"username\":\"");
    payload += username;
    payload += F("\",\"password\":\"");
    payload += password;
    payload += F("\"}");
    return payload;
}

bool AuthHelper::authenticateUser(const String &username, const String &password)
{
    Serial.printf("[Auth] Authenticating user '%s'\n", username.c_str());
    Serial.printf("[Auth] Password: '%s'\n", password.c_str());

    if (!HttpHelper::ensureWifiConnected())
        return false;

    WiFiClientSecure client;
    Serial.println(F("[Auth] Setting up secure client..."));
    client.setTimeout(CLIENT_TIMEOUT_MS);

    CertHelper::attachRootCA(client);

    authUrl = StorageHelper::getConfigValue(CONFIG_PATH, CONFIG_KEY_AUTH_URL);
    HTTPClient https;
    if (!HttpHelper::beginHttps(https, client, authUrl))
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
        HttpHelper::logHttpError(https, httpCode);
    }

    https.end();
    return success;
}
