#include "wifi_config_manager.h"
#include <LittleFS.h>
#include <ArduinoJson.h>

const char* CONFIG_FILE = "/wifi_config.json";

bool WifiConfigManager::load(WifiConfig& config) {
  if (!LittleFS.exists(CONFIG_FILE)) return false;

  File file = LittleFS.open(CONFIG_FILE, "r");
  if (!file) return false;

  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, file);
  file.close();
  if (error) return false;

  config.ssid = doc["ssid"].as<String>();
  config.password = doc["password"].as<String>();
  config.deviceId = doc["deviceId"].as<String>();
  return true;
}

bool WifiConfigManager::save(const WifiConfig& config) {
  File file = LittleFS.open(CONFIG_FILE, "w");
  if (!file) return false;

  StaticJsonDocument<256> doc;
  doc["ssid"] = config.ssid;
  doc["password"] = config.password;
  doc["deviceId"] = config.deviceId;
  bool ok = serializeJson(doc, file) > 0;
  file.close();
  return ok;
}

void WifiConfigManager::clear() {
  LittleFS.remove(CONFIG_FILE);
}
