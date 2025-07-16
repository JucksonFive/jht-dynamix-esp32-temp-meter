#include "wifi_helper.h"
#include <WiFi.h>

void WifiHelper::connect(const char *ssid, const char *password)
{
    WiFi.begin(ssid, password);
    Serial.print("Connecting to WiFi");

    int retries = 0;
    while (WiFi.status() != WL_CONNECTED)
    {
        delay(500);
        Serial.print(".");
        if (++retries > 30)
        {
            Serial.println("\n❌ Failed to connect to WiFi");
            return;
        }
    }

    Serial.println("\n✅ Connected to WiFi");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
}

bool WifiHelper::isConnected()
{
    return WiFi.status() == WL_CONNECTED;
}
