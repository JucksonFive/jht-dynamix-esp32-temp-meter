#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include "cert_helper.h"
#include "auth_helper.h"
#include <LittleFS.h>

bool AuthHelper::authenticateUser(const String &username, const String &password)
{
    Serial.printf("[Auth] Authenticating user '%s'\n", username.c_str());
    Serial.printf("[Auth] Password: '%s'\n", password.c_str());

    // Check WiFi connection first
    if (WiFi.status() != WL_CONNECTED)
    {
        Serial.println("[Auth] ERROR: WiFi not connected");
        return false;
    }
    Serial.printf("[Auth] WiFi connected, IP: %s\n", WiFi.localIP().toString().c_str());

    WiFiClientSecure client;
    Serial.println("[Auth] Setting up secure client...");

    // Set timeouts
    client.setTimeout(10000); // 10 seconds timeout

    // Attach certificates
    Serial.println("[Auth] Attaching root CA...");
    CertHelper::attachRootCA(client);
    Serial.println("[Auth] Root CA attached");

    HTTPClient https;
    Serial.println("[Auth] Beginning HTTPS connection...");

    if (!https.begin(client, "https://kk7xec5sb9.execute-api.eu-north-1.amazonaws.com/prod/auth/login"))
    {
        Serial.println("[Auth] ERROR: Failed to begin HTTPS connection");
        return false;
    }
    Serial.println("[Auth] HTTPS connection established");

    https.addHeader("Content-Type", "application/json");
    https.setTimeout(15000); // 15 seconds timeout for HTTP request

    String payload = "{\"username\":\"" + username + "\",\"password\":\"" + password + "\"}";
    Serial.printf("[Auth] Sending POST request with payload: %s\n", payload.c_str());

    int httpCode = https.POST(payload);
    Serial.printf("[Auth] HTTP POST response code: %d\n", httpCode);

    if (httpCode == 200)
    {
        String response = https.getString();
        Serial.printf("[Auth] Response: %s\n", response.c_str());

        File file = LittleFS.open("/user.json", "w");
        if (file)
        {
            file.print(response);
            file.close();
            Serial.println("[Auth] User data saved successfully");
            https.end();
            return true;
        }
        else
        {
            Serial.println("[Auth] ERROR: Failed to open /user.json for writing");
        }
    }
    else if (httpCode > 0)
    {
        String response = https.getString();
        Serial.printf("[Auth] Error response: %s\n", response.c_str());
    }
    else
    {
        Serial.printf("[Auth] HTTP error: %s\n", https.errorToString(httpCode).c_str());
    }

    https.end(); // Clean up
    return false;
}
