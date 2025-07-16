#pragma once
#include <PubSubClient.h>
#include <WiFiClient.h>
namespace MQTT
{
    WiFiClient espClient;
    PubSubClient client(espClient);

    void setup(const char *server, int port)
    {
        client.setServer(server, port);
    }

    void ensureConnection(const char *clientId)
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

    void publish(const char *topic, const char *payload)
    {
        client.publish(topic, payload);
    }

    void loop()
    {
        client.loop();
    }
}
