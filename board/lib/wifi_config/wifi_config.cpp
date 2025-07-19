#include "wifi_config.h"
#include <WiFi.h>
#include "wifi_config.h"
#include "../wifi_config_manager/wifi_config_manager.h"

bool connectToWifi(uint32_t timeoutMs) {
  WifiCredentials creds;
  if (!loadWifiCredentials(creds)) {
    Serial.println("[WiFi] Failed to load credentials");
    return false;
  }

  Serial.printf("[WiFi] Connecting to %s...\n", creds.ssid.c_str());

  WiFi.mode(WIFI_STA);
  WiFi.begin(creds.ssid.c_str(), creds.password.c_str());

  uint32_t start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < timeoutMs) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] Connected!");
    Serial.println(WiFi.localIP());
    return true;
  } else {
    Serial.println("\n[WiFi] Connection failed.");
    return false;
  }
}

bool isWifiConnected() {
  return WiFi.status() == WL_CONNECTED;
}

bool loadWifiCredentials(WifiCredentials &creds) {
  return wifi_config_manager::readCredentials(creds);
}

bool saveWifiCredentials(const String &ssid, const String &password) {
  WifiCredentials creds{ssid, password};
  return wifi_config_manager::writeCredentials(creds);
}

bool wifiCredentialsExist() {
  return wifi_config_manager::credentialsExist();
}
