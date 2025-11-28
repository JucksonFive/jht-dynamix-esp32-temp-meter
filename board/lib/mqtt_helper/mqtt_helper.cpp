#include "mqtt_helper.h"
#include <PubSubClient.h>
#include <WiFiClient.h>
#include <Arduino.h>
#include <cert_helper.h>

namespace
{
    WiFiClientSecure secureClient;
    PubSubClient client(secureClient);
}

void MQTT::setup(const char *server, int port)
{
    CertHelper::loadCerts(secureClient);
    client.setServer(server, port);
}

void MQTT::ensureConnection(const char *clientId)
{
    while (!client.connected())
    {
        Serial.print("Connecting to MQTT...");

        if (client.connect(clientId))
        {
            Serial.println(" ✅ connected");
        }
        else
        {
            Serial.print(" ❌ failed, rc=");
            Serial.print(client.state());
            Serial.println(" try again in 5 seconds");
            delay(5000);
        }
    }
}

void MQTT::publish(const char *topic, const char *payload)
{
    client.publish(topic, payload);
}

void MQTT::publishStatus(const char *deviceId, const char *status, const char *payload)
{
    char topic[128];
    snprintf(topic, sizeof(topic), "devices/%s/status", deviceId);
    client.publish(topic, payload);
    Serial.printf("[MQTT] Status published to %s: %s\n", topic, status);
}

void MQTT::loop()
{
    client.loop();
}

bool MQTT::isConnected()
{
    return client.connected();
}
