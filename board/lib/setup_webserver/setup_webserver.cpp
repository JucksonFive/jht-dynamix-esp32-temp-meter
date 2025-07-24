#include "setup_webserver.h"
#include <WiFi.h>
#include <ESPAsyncWebServer.h>
#include <LittleFS.h>
#include "wifi_config.h"
#include <wifi_config_manager.h>

namespace
{
  AsyncWebServer server(80);
  bool setupComplete = false;

  void handleFormSubmission(AsyncWebServerRequest *request)
  {
    if (!request->hasParam("ssid", true) || !request->hasParam("password", true))
    {
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

void startSetupWebServer()
{
  WiFi.mode(WIFI_AP);
  WiFi.softAP("TempSensor-Setup");

  if (!LittleFS.begin())
  {
    Serial.println("LittleFS mount failed");
    return;
  }

  server.on("/", HTTP_GET, [](AsyncWebServerRequest *request)
            { request->send(LittleFS, "/html/index.html", "text/html"); });

  server.on("/wizard.js", HTTP_GET, [](AsyncWebServerRequest *request)
            { request->send(LittleFS, "/html/wizard.js", "application/javascript"); });
  // Serve style.css
  server.on("/style.css", HTTP_GET, [](AsyncWebServerRequest *request)
            { request->send(LittleFS, "/html/style.css", "text/css"); });

  // Serve router.svg
  server.on("/router.svg", HTTP_GET, [](AsyncWebServerRequest *request)
            { request->send(LittleFS, "/html/router.svg", "image/svg+xml"); });

  // Serve globe.svg
  server.on("/globe.svg", HTTP_GET, [](AsyncWebServerRequest *request)
            { request->send(LittleFS, "/html/globe.svg", "image/svg+xml"); });

  server.on("/favicon.ico", HTTP_GET, [](AsyncWebServerRequest *request)
            { request->send(204, "image/x-icon", ""); }); // Return 204 No Content

  server.on("/favicon.svg", HTTP_GET, [](AsyncWebServerRequest *request)
            { request->send(LittleFS, "/html/favicon.svg", "image/svg+xml"); });

  server.on("/submit", HTTP_POST, [](AsyncWebServerRequest *request)
            {
  if (!request->hasParam("ssid", true) || !request->hasParam("password", true)) {
    request->send(400, "text/plain", "Missing parameters");
    return;
  }

  String ssid = request->getParam("ssid", true)->value();
  String password = request->getParam("password", true)->value();

  if (!saveWifiCredentials(ssid, password)) {
    request->send(500, "text/plain", "Failed to save credentials");
    return;
  }

  // Test WiFi connection while keeping AP mode active
  WiFi.mode(WIFI_AP_STA); // Enable both AP and STA modes
  WiFi.begin(ssid.c_str(), password.c_str());
  
  // Wait for connection with timeout
  unsigned long startTime = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startTime < 10000) {
    delay(100);
  }

  if (WiFi.status() == WL_CONNECTED) {
    request->send(200, "text/plain", "WiFi connected successfully");
    Serial.println("[WiFi] Test connection successful");
  } else {
    request->send(500, "text/plain", "WiFi connection failed");
    Serial.println("[WiFi] Test connection failed");
    WiFi.mode(WIFI_AP); // Fall back to AP mode only
  } });

  // Add endpoint to complete setup
  server.on("/complete-setup", HTTP_POST, [](AsyncWebServerRequest *request)
            {
    setupComplete = true;
    request->send(200, "text/plain", "Setup completed. Restarting...");
    Serial.println("[Setup] Completing setup and restarting...");
    delay(1000);
    ESP.restart(); });

  server.begin();
}

bool isSetupComplete()
{
  return setupComplete;
}
