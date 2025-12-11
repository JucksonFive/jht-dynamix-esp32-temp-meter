#pragma once
#include <Arduino.h>

struct WifiCredentials
{
  String ssid;
  String password;
};

bool loadWifiCredentials(WifiCredentials &creds);
bool saveWifiCredentials(const String &ssid, const String &password);
bool wifiCredentialsExist();
void startWifiConnectTask(String ssid, String pass);
bool connectToWifi(uint32_t timeoutMs = 10000);
bool isWifiConnected();
bool connectWifiFromStorage();