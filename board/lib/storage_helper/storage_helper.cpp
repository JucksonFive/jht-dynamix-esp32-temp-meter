#include <ArduinoJson.h>
#include <LittleFS.h>
#include "storage_helper.h"

// Offline readings file path
const char *OFFLINE_READINGS_PATH = "/offline_readings.jsonl";
const char *OFFLINE_MODE_PATH = "/offline_mode.json";

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
                                 const char *ts,
                                 const String &userId)
{

    JsonDocument doc;
    doc["deviceId"] = deviceId;
    doc["temperature"] = temperature;
    doc["timestamp"] = ts;
    doc["userId"] = userId;

    size_t n = serializeJson(doc, out, outSize);
    return (n > 0 && n < outSize);
}

// Append a reading to offline storage (JSONL format: one JSON object per line)
bool StorageHelper::appendOfflineReading(const char *deviceId, float temperature, const char *timestamp, const char *userId)
{
    // Check file size limit (1 MB to leave space for program)
    if (getOfflineFileSize() > 1000000)
    {
        Serial.println("[Storage] Offline file too large, cannot append");
        return false;
    }

    File file = LittleFS.open(OFFLINE_READINGS_PATH, "a");
    if (!file)
    {
        Serial.println("[Storage] Failed to open offline file for append");
        return false;
    }

    JsonDocument doc;
    doc["deviceId"] = deviceId;
    doc["temperature"] = temperature;
    doc["timestamp"] = timestamp;
    doc["userId"] = userId;

    serializeJson(doc, file);
    file.println(); // New line for JSONL format
    file.close();

    Serial.printf("[Storage] Offline reading saved: %s, %.2f°C\n", timestamp, temperature);
    return true;
}

// Read all offline readings as a single string (JSONL format)
String StorageHelper::getOfflineReadings()
{
    File file = LittleFS.open(OFFLINE_READINGS_PATH, "r");
    if (!file)
    {
        return "";
    }

    String content = file.readString();
    file.close();
    return content;
}

// Clear all offline readings
bool StorageHelper::clearOfflineReadings()
{
    if (LittleFS.exists(OFFLINE_READINGS_PATH))
    {
        if (LittleFS.remove(OFFLINE_READINGS_PATH))
        {
            Serial.println("[Storage] Offline readings cleared");
            return true;
        }
    }
    return false;
}

// Count number of offline readings
int StorageHelper::getOfflineReadingCount()
{
    File file = LittleFS.open(OFFLINE_READINGS_PATH, "r");
    if (!file)
    {
        return 0;
    }

    int count = 0;
    while (file.available())
    {
        String line = file.readStringUntil('\n');
        if (line.length() > 0)
        {
            count++;
        }
    }
    file.close();
    return count;
}

// Get offline file size in bytes
size_t StorageHelper::getOfflineFileSize()
{
    File file = LittleFS.open(OFFLINE_READINGS_PATH, "r");
    if (!file)
    {
        return 0;
    }
    size_t size = file.size();
    file.close();
    return size;
}

// Enable offline mode (no WiFi/MQTT required)
bool StorageHelper::enableOfflineMode()
{
    File file = LittleFS.open(OFFLINE_MODE_PATH, "w");
    if (!file)
    {
        Serial.println("[Storage] Failed to enable offline mode");
        return false;
    }

    JsonDocument doc;
    doc["enabled"] = true;
    doc["timestamp"] = millis();

    serializeJson(doc, file);
    file.close();

    Serial.println("[Storage] Offline mode enabled");
    return true;
}

// Disable offline mode (return to normal WiFi/MQTT operation)
bool StorageHelper::disableOfflineMode()
{
    if (LittleFS.exists(OFFLINE_MODE_PATH))
    {
        if (LittleFS.remove(OFFLINE_MODE_PATH))
        {
            Serial.println("[Storage] Offline mode disabled");
            return true;
        }
    }
    return false;
}

// Check if offline mode is enabled
bool StorageHelper::isOfflineModeEnabled()
{
    File file = LittleFS.open(OFFLINE_MODE_PATH, "r");
    if (!file)
    {
        return false;
    }

    JsonDocument doc;
    DeserializationError err = deserializeJson(doc, file);
    file.close();

    if (err)
    {
        return false;
    }

    return doc["enabled"].as<bool>();
}
