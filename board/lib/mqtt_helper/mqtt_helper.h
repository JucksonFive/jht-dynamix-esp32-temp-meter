#pragma once

namespace MQTT
{
    void setup(const char *server, int port);
    void ensureConnection(const char *clientId);
    void publish(const char *topic, const char *payload);
    void loop();
    void sendMqttMessage(const char *topic, const char *payload);
    bool isConnected();
}
