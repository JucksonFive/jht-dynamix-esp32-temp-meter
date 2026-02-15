#pragma once
#include "Arduino.h"

class DNSServer
{
 public:
  void start(uint16_t, const char*, IPAddress) {}
  void processNextRequest() {}
  void stop() {}
};
