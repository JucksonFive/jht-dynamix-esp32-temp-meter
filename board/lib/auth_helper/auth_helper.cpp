#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include "cert_helper.h"
#include "auth_helper.h"
#include <LittleFS.h>

bool AuthHelper::authenticateUser(const String &username, const String &password)
{
    WiFiClientSecure client;
    CertHelper::attachRootCA(client);

    HTTPClient https;
    https.begin(client, "https://kk7xec5sb9.execute-api.eu-north-1.amazonaws.com/prod/auth/login");
    https.addHeader("Content-Type", "application/json");

    String payload = "{\"username\":\"" + username + "\",\"password\":\"" + password + "\"}";
    int httpCode = https.POST(payload);

    if (httpCode == 200)
    {
        String response = https.getString();
        File file = LittleFS.open("/user.json", "w");
        if (file)
        {
            file.print(response);
            file.close();
            return true;
        }
    }

    return false;
}
