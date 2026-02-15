#pragma once
#include "Arduino.h"

class WiFiClient
{
 public:
  WiFiClient() = default;
  virtual ~WiFiClient() = default;
  int connect(const char*, uint16_t) { return 0; }
  size_t write(const uint8_t*, size_t) { return 0; }
  int available() { return 0; }
  int read() { return -1; }
  void stop() {}
  bool connected() { return false; }
  operator bool() { return false; }
};
