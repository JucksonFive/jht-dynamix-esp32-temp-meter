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
    if (client.connected())
    {
        return;
    }

    Serial.print("Connecting to MQTT...");

    if (client.connect(clientId))
    {
        Serial.println(" ✅ connected");
    }
    else
    {
        Serial.printf(" ❌ failed, rc=%d try again in 5 seconds\n", client.state());
    }
}

void MQTT::publish(const char *topic, const char *payload)
{
    client.publish(topic, payload);
}

void MQTT::loop()
{
    client.loop();
}

bool MQTT::isConnected()
{
    return client.connected();
}
