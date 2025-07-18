#include "setup_webserver.h"
#include "wifi_config.h"
#include <WiFi.h>
#include <ESPAsyncWebServer.h>
#include <LittleFS.h>

AsyncWebServer server(80);

void startSetupPortal() {
  WiFi.softAP("ESP32-Setup");

  IPAddress IP = WiFi.softAPIP();
  Serial.print("Setup portal: http://");
  Serial.println(IP);

  server.serveStatic("/", LittleFS, "/").setDefaultFile("index.html");

  server.on("/save", HTTP_POST, [](AsyncWebServerRequest *request) {
    if (request->hasParam("ssid", true) && request->hasParam("password", true) && request->hasParam("deviceId", true)) {
      WifiConfig config;
      config.ssid = request->getParam("ssid", true)->value();
      config.password = request->getParam("password", true)->value();
      config.deviceId = request->getParam("deviceId", true)->value();

      if (WifiConfigManager::save(config)) {
        request->send(200, "text/plain", "Config saved. Rebooting...");
        delay(1000);
        ESP.restart();
      } else {
        request->send(500, "text/plain", "Failed to save config");
      }
    } else {
      request->send(400, "text/plain", "Missing fields");
    }
  });

  server.begin();
}
