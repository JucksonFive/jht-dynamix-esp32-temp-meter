#include <ArduinoJson.h>
#include <LittleFS.h>
#include "storage_helper.h"

String StorageHelper::getConfigValue(const String &path, const String &key)
{
    File file = LittleFS.open(path, "r");
    if (!file)
    {
        Serial.println("[Config] config.json not found");
        return "";
    }
    JsonDocument doc;
    DeserializationError err = deserializeJson(doc, file);
    file.close();
    if (err)
    {
        Serial.println("[Config] Failed to parse config.json");
        return "";
    }
    if (!doc.containsKey(key))
    {
        Serial.println("[Config] " + key + " missing in config.json");
        return "";
    }
    return String(doc[key].as<String>());
}

bool StorageHelper::saveJsonValue(const char *path, const char *key, const String &value)
{
    File f = LittleFS.open(path, "w");
    if (!f)
    {
        Serial.printf("[StorageHelper] Failed to open %s for writing\n", path);
        return false;
    }

    JsonDocument doc;
    doc[key] = value;

    if (serializeJson(doc, f) == 0)
    {
        Serial.printf("[StorageHelper] Failed to write JSON to %s\n", path);
        f.close();
        return false;
    }

    f.close();
    Serial.printf("[StorageHelper] Saved %s=%s to %s\n", key, value.c_str(), path);
    return true;
}

bool StorageHelper::saveUserResponse(const char *path, const String &response)
{
    File file = LittleFS.open(path, "w");
    if (!file)
    {
        Serial.printf("[Auth] ERROR: Failed to open %s for writing\n", path);
        return false;
    }
    Serial.printf("[Auth] Saving user data to %s\n", path);
    file.print(response);
    file.close();
    Serial.println(F("[Auth] User data saved successfully"));
    return true;
}

bool StorageHelper::buildPayload(char *out, size_t outSize,
                                 const String &deviceId,
                                 float temperature,
                                 float humidity,
                                 const char *ts,
                                 const String &userId)
{
    JsonDocument doc;
    doc["deviceId"] = deviceId;
    doc["temperature"] = temperature;
    doc["humidity"] = humidity;
    doc["timestamp"] = ts;
    doc["userId"] = userId;

    size_t n = serializeJson(doc, out, outSize);
    return (n > 0 && n < outSize);
}
