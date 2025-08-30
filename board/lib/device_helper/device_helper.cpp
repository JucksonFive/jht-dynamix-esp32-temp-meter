#include <Arduino.h>
#include "device_helper.h"
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <http_helper.h>
#include <storage_helper.h>

namespace
{
    constexpr uint32_t CLIENT_TIMEOUT_MS = 10000;
    constexpr uint32_t HTTP_TIMEOUT_MS = 15000;
    constexpr char USER_FILE_PATH[] = "/user.json";
    constexpr char DEVICE_FILE_PATH[] = "/device.json";
    constexpr char CONFIG_PATH[] = "/config/config.json";
    constexpr char CONFIG_KEY_AUTH_URL[] = "auth_url";
    constexpr char CONFIG_KEY_DEVICES_URL[] = "devices_url";

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

    String buildDevicePayload(const String &deviceId)
    {
        String payload;
        payload.reserve(deviceId.length() + 32);
        payload = F("{\"deviceId\":\"");
        payload += deviceId;
        payload += F("\"}");
        return payload;
    }

    void setCommonHeaders(HTTPClient &https, const String &idToken)
    {
        https.addHeader(F("Content-Type"), F("application/json"));
        https.addHeader(F("Authorization"), String(F("Bearer ")) + idToken);
        https.setTimeout(HTTP_TIMEOUT_MS);
    }
}

bool DeviceHelper::registerDevice(const String &deviceId)
{
    if (deviceId.isEmpty())
    {
        Serial.println(F("[Device] ERROR: deviceId empty"));
        return false;
    }
    if (!HttpHelper::ensureWifiConnected(F("[Device]")))
        return false;

    String devicesUrl = StorageHelper::getConfigValue(CONFIG_PATH, CONFIG_KEY_DEVICES_URL);
    if (devicesUrl.isEmpty())
    {
        Serial.println(F("[Device] ERROR: devices_url missing in config"));
        return false;
    }

    String idToken = StorageHelper::getConfigValue(USER_FILE_PATH, "idToken");
    if (idToken.isEmpty())
    {
        Serial.println(F("[Device] ERROR: idToken missing (authenticate first)"));
        return false;
    }

    WiFiClientSecure client;
    client.setTimeout(CLIENT_TIMEOUT_MS);

    HTTPClient https;
    if (!HttpHelper::beginHttps(https, client, devicesUrl, F("[Device]")))
        return false;

    setCommonHeaders(https, idToken);

    const String payload = buildDevicePayload(deviceId);
    Serial.printf("[Device] POST %s\n", devicesUrl.c_str());
    Serial.printf("[Device] Payload: %s\n", payload.c_str());

    int code = https.POST(payload);
    Serial.printf("[Device] HTTP code: %d\n", code);

    bool success = false;
    if (code == 201)
    {
        String resp = https.getString();
        Serial.printf("[Device] Response: %s\n", resp.c_str());
        success = StorageHelper::saveUserResponse(DEVICE_FILE_PATH, resp);
    }
    else
    {
        HttpHelper::logHttpError(https, code, F("[Device]"));
    }
    https.end();
    return success;
}