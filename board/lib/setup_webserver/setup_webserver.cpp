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
#include <device_helper.h>
#include <wifi_state.h>
#include <DNSServer.h>

namespace
{
  AsyncWebServer server(80);
  bool setupComplete = false;
  DNSServer dns;
}

void startSetupWebServer()
{
  // Configure AP with static IP for captive portal
  IPAddress local_IP(192, 168, 4, 1);
  IPAddress gateway(192, 168, 4, 1);
  IPAddress subnet(255, 255, 255, 0);
  WiFi.softAPConfig(local_IP, gateway, subnet);

  WiFi.softAP("TempSensor-Setup");

  // Start DNS server for captive portal (wildcard redirects all domains to AP IP)
  dns.start(53, "*", WiFi.softAPIP());
  Serial.printf("[DNS] Captive portal started on %s\n", WiFi.softAPIP().toString().c_str());

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

    // Jos jo yhdistetty, palauta heti onnistuminen
    if (wifiState == WifiState::Connected) {
      request->send(200, "text/plain", "Already connected");
      return;
    }

    if (!saveWifiCredentials(ssid, password))
    {
      request->send(500, "text/plain", "Failed to save credentials");
      return;
    }

    startWifiConnectTask(ssid, password);
    // Palauta 202 Accepted jotta front voi pollata tilaa
    request->send(202, "text/plain", "Connection attempt started"); });

  // WiFi-yhteyden tilan pollaus
  server.on("/wifi-status", HTTP_GET, [](AsyncWebServerRequest *request)
            {
    const char *statusStr = "idle";
    switch (wifiState) {
      case WifiState::Connecting: statusStr = "connecting"; break;
      case WifiState::Connected: statusStr = "connected"; break;
      case WifiState::Failed: statusStr = "failed"; break;
      default: statusStr = "idle"; break;
    }
    String body = String("{\"status\":\"") + statusStr + "\"}";
    request->send(200, "application/json", body); });

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
  String deviceId = StorageHelper::getConfigValue("/device.json", "deviceId");
  if (deviceId.isEmpty()) {
    request->send(400, "text/plain", "Missing deviceId");
    return;
  }
  if (!DeviceHelper::registerDevice(deviceId)) {
    request->send(500, "text/plain", "Device registration failed");
    return;
  }
  setupComplete = true;

  request->send(200, "text/plain", "Setup completed. Restarting...");
  Serial.println("[Setup] Completing setup and restarting...");

  // Stop captive portal DNS and AP before restart
  dns.stop();
  WiFi.softAPdisconnect(true);
  Serial.println("[Setup] Stopped AP and DNS");

  TimeHelper::scheduleRestart(5000); });

  // Captive portal: redirect all unknown requests to setup page
  server.onNotFound([](AsyncWebServerRequest *request)
                    {
    Serial.printf("[Captive] Redirect %s to /\n", request->host().c_str());
    request->redirect("/"); });

  server.begin();
  Serial.println("[Setup] Web server started with captive portal");
}

void processCaptivePortalDNS()
{
  dns.processNextRequest();
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
