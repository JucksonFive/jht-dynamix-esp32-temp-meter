#pragma once
#include <Arduino.h>

namespace MQTT
{
    void setup(const char *server, int port);
    void ensureConnection(const char *clientId);
    void publish(const char *topic, const char *payload);
    void loop();
    bool sendMqttMessage(const char *topic, const char *payload);
    void maintainMqttConnection(const String &clientId);
    bool isConnected();
}
