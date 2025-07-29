#include <ArduinoJson.h>
#include <LittleFS.h>
#include "storage_helper.h"

String StorageHelper::getConfigValue(const String &path, const String &key)
{
    if (!LittleFS.begin())
    {
        Serial.println("[Config] LittleFS mount failed");
        return "";
    }
    File file = LittleFS.open(path, "r");
    if (!file)
    {
        Serial.println("[Config] config.json not found");
        return "";
    }
    DynamicJsonDocument doc(512);
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