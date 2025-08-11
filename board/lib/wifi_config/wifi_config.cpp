#include "wifi_config.h"
#include <WiFi.h>
#include "wifi_config.h"
#include "../wifi_config_manager/wifi_config_manager.h"
#include <wifi_state.h>

bool connectToWifi(uint32_t timeoutMs)
{
  WifiCredentials creds;
  if (!loadWifiCredentials(creds))
  {
    Serial.println("[WiFi] Failed to load credentials");
    return false;
  }

  Serial.printf("[WiFi] Connecting to %s...\n", creds.ssid.c_str());

  WiFi.mode(WIFI_STA);
  WiFi.begin(creds.ssid.c_str(), creds.password.c_str());

  uint32_t start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < timeoutMs)
  {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED)
  {
    Serial.println("\n[WiFi] Connected!");
    Serial.println(WiFi.localIP());
    return true;
  }
  else
  {
    Serial.println("\n[WiFi] Connection failed.");
    return false;
  }
}

void startWifiConnectTask(String ssid, String pass)
{
  if (wifiState == WifiState::Connecting)
    return;
  wifiState = WifiState::Connecting;

  xTaskCreatePinnedToCore([](void *p)
                          {
    auto creds = *static_cast<std::pair<String,String>*>(p);
    delete static_cast<std::pair<String,String>*>(p);

    // 1) Peru mahdollinen skannaus
    WiFi.scanDelete();

    // 2) Siisti STA init
    WiFi.persistent(false);
    WiFi.mode(WIFI_AP_STA);       // AP pysyy auki
    vTaskDelay(pdMS_TO_TICKS(150));
    WiFi.disconnect(true, true);
    vTaskDelay(pdMS_TO_TICKS(150));

    // 3) Yhdistä
    WiFi.begin(creds.first.c_str(), creds.second.c_str());

    // 4) Odotus watchdog-ystävällisesti
    const uint32_t deadline = millis() + 30000;
    while (millis() < deadline && WiFi.status() != WL_CONNECTED) {
      vTaskDelay(pdMS_TO_TICKS(100));
    }

    if (WiFi.status() == WL_CONNECTED) {
      Serial.printf("[WiFi] Connected to %s, IP=%s\n",
        creds.first.c_str(), WiFi.localIP().toString().c_str());
      wifiState = WifiState::Connected;
    } else {
      Serial.println("[WiFi] Connect timeout -> keep AP");
      wifiState = WifiState::Failed;
    }
    vTaskDelete(nullptr); }, "wifi_conn", 4096, new std::pair<String, String>(ssid, pass), 1, nullptr, 1);
}

bool isWifiConnected()
{
  return WiFi.status() == WL_CONNECTED;
}

bool loadWifiCredentials(WifiCredentials &creds)
{
  return wifi_config_manager::readCredentials(creds);
}

bool saveWifiCredentials(const String &ssid, const String &password)
{
  WifiCredentials creds{ssid, password};
  return wifi_config_manager::writeCredentials(creds);
}

bool wifiCredentialsExist()
{
  return wifi_config_manager::credentialsExist();
}
