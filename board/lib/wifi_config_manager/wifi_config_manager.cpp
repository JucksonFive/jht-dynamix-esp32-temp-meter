#include "wifi_config_manager.h"
#include <LittleFS.h>
#include <ArduinoJson.h>

namespace wifi_config_manager {

bool credentialsExist() {
  return LittleFS.exists(CONFIG_PATH);
}

bool readCredentials(WifiCredentials &creds) {
  if (!LittleFS.exists(CONFIG_PATH)) {
    Serial.println("[CONFIG] wifi.json does not exist.");
    return false;
  }

  File file = LittleFS.open(CONFIG_PATH, "r");
  if (!file) {
    Serial.println("[CONFIG] Failed to open wifi.json");
    return false;
  }

  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, file);
  if (error) {
    Serial.printf("[CONFIG] Failed to parse wifi.json: %s\n", error.c_str());
    return false;
  }

  creds.ssid = doc["ssid"].as<String>();
  creds.password = doc["password"].as<String>();
  return true;
}


bool writeCredentials(const WifiCredentials &creds) {
  Serial.println("[wifi_config_manager] Trying to write wifi.json");

  File file = LittleFS.open(CONFIG_PATH, "w");
  if (!file) {
    Serial.println("[wifi_config_manager] Failed to open file for writing");
    return false;
  }

  StaticJsonDocument<256> doc;
  doc["ssid"] = creds.ssid;
  doc["password"] = creds.password;

  size_t written = serializeJson(doc, file);
  file.close();

  if (written == 0) {
    Serial.println("[wifi_config_manager] Failed to serialize JSON");
    return false;
  }

  Serial.println("[wifi_config_manager] wifi.json written OK");
  return true;
}

}