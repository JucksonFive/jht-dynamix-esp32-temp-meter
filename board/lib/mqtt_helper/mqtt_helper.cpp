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

bool MQTT::publish(const char *topic, const char *payload)
{
    return client.publish(topic, payload);
}

void MQTT::loop()
{
    client.loop();
}

bool MQTT::isConnected()
{
    return client.connected();
}

// Callback-funktio MQTT-lähetykselle
bool MQTT::sendMqttMessage(const char *topic, const char *payload)
{
    if (!MQTT::isConnected())
    {
        return false;
    }
    MQTT::publish(topic, payload);
    return true;
}

void MQTT::maintainMqttConnection(const String &clientId)
{
    if (!MQTT::isConnected())
    {
        static unsigned long lastConnectAttempt = 0;
        if (millis() - lastConnectAttempt > 5000)
        {
            MQTT::ensureConnection(clientId.c_str());
            lastConnectAttempt = millis();
        }
    }
    if (MQTT::isConnected())
    {
        MQTT::loop();
    }
}