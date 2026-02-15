#pragma once
#include "WiFiClient.h"

class PubSubClient
{
  WiFiClient* _client = nullptr;

 public:
  PubSubClient() = default;
  PubSubClient(WiFiClient& client) : _client(&client) {}
  void setServer(const char*, uint16_t) {}
  bool connect(const char*) { return false; }
  bool connected() { return false; }
  bool publish(const char*, const char*) { return false; }
  void loop() {}
  int state() { return -1; }
};
