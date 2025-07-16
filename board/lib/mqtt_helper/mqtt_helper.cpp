#include "mqtt_helper.h"
#include <PubSubClient.h>
#include <WiFiClient.h>
#include <Arduino.h>

namespace
{
    WiFiClient espClient;
    PubSubClient client(espClient); // käytetään WiFiClient:ia
}

void MQTT::setup(const char *server, int port)
{
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
            Serial.print(".");
            delay(1000);
        }
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
