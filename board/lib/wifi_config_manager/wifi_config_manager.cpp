#include "wifi_config_manager.h"
#include <LittleFS.h>
#include <ArduinoJson.h>

namespace wifi_config_manager {

bool credentialsExist() {
  return LittleFS.exists(CONFIG_PATH);
}

bool readCredentials(WifiCredentials &creds) {
  if (!wifi_config_manager::credentialsExist()) return false;

  File file = LittleFS.open(CONFIG_PATH, "r");
  if (!file) return false;

  StaticJsonDocument<256> doc;
  DeserializationError err = deserializeJson(doc, file);
  file.close();
  if (err) return false;

  creds.ssid = doc["ssid"].as<String>();
  creds.password = doc["password"].as<String>();
  return true;
}

bool writeCredentials(const WifiCredentials &creds) {
  File file = LittleFS.open(CONFIG_PATH, "w");
  if (!file) return false;

  StaticJsonDocument<256> doc;
  doc["ssid"] = creds.ssid;
  doc["password"] = creds.password;

  bool ok = serializeJson(doc, file) > 0;
  file.close();
  return ok;
}
}