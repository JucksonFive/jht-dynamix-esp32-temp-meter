#include "setup_webserver.h"
#include <WiFi.h>
#include <ESPAsyncWebServer.h>
#include <LittleFS.h>
#include "wifi_config.h"
#include <wifi_config_manager.h>
#include <auth_helper.h>
#include <time_helper.h>
#include <wifi_scan_helper.h>
#include <storage_helper.h>

namespace
{
  AsyncWebServer server(80);
  bool setupComplete = false;
}

void startSetupWebServer()
{
  WiFi.softAP("TempSensor-Setup");

  server.on("/", HTTP_GET, [](AsyncWebServerRequest *request)
            { request->send(LittleFS, "/html/index.html", "text/html"); });

  server.on("/wizard.js", HTTP_GET, [](AsyncWebServerRequest *request)
            { request->send(LittleFS, "/html/wizard.js", "application/javascript"); });
  // Serve style.css
  server.on("/style.css", HTTP_GET, [](AsyncWebServerRequest *request)
            { request->send(LittleFS, "/html/style.css", "text/css"); });

  // Serve globe.svg
  server.on("/globe.svg", HTTP_GET, [](AsyncWebServerRequest *request)
            { request->send(LittleFS, "/html/globe.svg", "image/svg+xml"); });

  server.on("/favicon.svg", HTTP_GET, [](AsyncWebServerRequest *request)
            { request->send(LittleFS, "/html/favicon.svg", "image/svg+xml"); });

  server.on("/scan-wifi", HTTP_GET, [](AsyncWebServerRequest *request)
            {
  if (!WifiScanHelper::hasResult()) {
    WifiScanHelper::beginScan();
    request->send(202, "text/plain", "Scan started");
    return;
  }

  String json = WifiScanHelper::getResultAndClear();

  if (json.length() == 0) {
    request->send(500, "application/json", "{\"networks\":[]}");
    return;
  }

  request->send(200, "application/json", json); });

  server.on("/connect-to-wifi", HTTP_POST, [](AsyncWebServerRequest *request)
            {
    if (!request->hasParam("ssid", true) || !request->hasParam("password", true))
    {
      request->send(400, "text/plain", "Missing parameters");
      return;
    }

    String ssid = request->getParam("ssid", true)->value();
    String password = request->getParam("password", true)->value();

    if (!saveWifiCredentials(ssid, password))
    {
      request->send(500, "text/plain", "Failed to save credentials");
      return;
    }

    startWifiConnectTask(ssid, password);
    request->send(200, "text/plain", "WiFi connected successfully"); });

  server.on("/link-device", HTTP_POST, [](AsyncWebServerRequest *request)
            {
  if (!request->hasParam("username", true) ||
      !request->hasParam("userPassword", true) || !request->hasParam("deviceId", true)) {
    request->send(400, "text/plain", "Missing parameters");
    return;
  }

  String username = request->getParam("username", true)->value();
  String password = request->getParam("userPassword", true)->value();
  String deviceId = request->getParam("deviceId", true)->value();

  Serial.printf("[Setup] Authenticating user '%s'\n", username.c_str());

  bool authSuccess = AuthHelper::authenticateUser(username, password);
  if (!authSuccess) {
    request->send(401, "text/plain", "Authentication failed");
    return;
  }

  if (!StorageHelper::saveJsonValue("/device.json", "deviceId", deviceId)) {
    request->send(500, "text/plain", "Failed to save device link");
    return;
  }
  request->send(200, "text/plain", "Device linked successfully"); });

  server.on("/complete-setup", HTTP_POST, [](AsyncWebServerRequest *request)
            {
  setupComplete = true;

  request->send(200, "text/plain", "Setup completed. Restarting...");
  Serial.println("[Setup] Completing setup and restarting...");


  TimeHelper::scheduleRestart(5000); });

  server.begin();
}

bool isSetupComplete()
{
  // Cache the result to avoid repeated file system calls
  static bool setupChecked = false;
  static bool setupResult = false;

  if (setupChecked)
  {
    return setupResult;
  }

  // Check if both WiFi credentials and device linking are complete
  bool wifiConfigExists = LittleFS.exists("/wifi.json");
  bool deviceLinked = LittleFS.exists("/device.json");

  Serial.printf("[Setup] WiFi config exists: %s, Device linked: %s\n",
                wifiConfigExists ? "YES" : "NO",
                deviceLinked ? "YES" : "NO");

  setupResult = wifiConfigExists && deviceLinked;
  setupChecked = true;

  return setupResult;
}
