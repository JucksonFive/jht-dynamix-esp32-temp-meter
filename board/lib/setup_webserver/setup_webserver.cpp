#include "setup_webserver.h"
#include <WiFi.h>
#include <ESPAsyncWebServer.h>
#include <LittleFS.h>
#include "wifi_config.h"
#include <wifi_config_manager.h>

namespace {
  AsyncWebServer server(80);
  bool setupComplete = false;

  void handleFormSubmission(AsyncWebServerRequest *request) {
    if (!request->hasParam("ssid", true) || !request->hasParam("password", true)) {
      request->send(400, "text/plain", "Missing parameters");
      return;
    }

    String ssid = request->getParam("ssid", true)->value();
    String password = request->getParam("password", true)->value();

    saveWifiCredentials(ssid, password);

    request->send(200, "text/plain", "Credentials saved. Restarting...");
    setupComplete = true;

    delay(1000);
    ESP.restart();
  }
}

void startSetupWebServer() {
  WiFi.mode(WIFI_AP);
  WiFi.softAP("TempSensor-Setup");

  if (!LittleFS.begin()) {
    Serial.println("LittleFS mount failed");
    return;
  }

  server.on("/", HTTP_GET, [](AsyncWebServerRequest *request) {
    request->send(LittleFS, "/html/index.html", "text/html");
  });

  // Serve style.css
  server.on("/style.css", HTTP_GET, [](AsyncWebServerRequest *request) {
    request->send(LittleFS, "/html/style.css", "text/css");
  });

  // Serve router.svg
  server.on("/router.svg", HTTP_GET, [](AsyncWebServerRequest *request) {
    request->send(LittleFS, "/html/router.svg", "image/svg+xml");
  });

  // Serve globe.svg
  server.on("/globe.svg", HTTP_GET, [](AsyncWebServerRequest *request) {
    request->send(LittleFS, "/html/globe.svg", "image/svg+xml");
  });


  server.on("/submit", HTTP_POST, handleFormSubmission);

  server.begin();
}

bool isSetupComplete() {
  return setupComplete;
}
