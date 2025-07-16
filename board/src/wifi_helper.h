#pragma once
#include <WiFi.h>

namespace WifiHelper {
    void connect(const char* ssid, const char* password) {
        Serial.printf("Connecting to %s", ssid);
        WiFi.begin(ssid, password);
        while (WiFi.status() != WL_CONNECTED) {
            delay(1000);
            Serial.print(".");
        }
        Serial.printf("\nConnected to WIFI IP: %s\n", WiFi.localIP().toString().c_str());
    }
}