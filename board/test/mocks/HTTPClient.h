#pragma once
#include "Arduino.h"

class WiFiClient;
class WiFiClientSecure;

class HTTPClient
{
 public:
  bool begin(WiFiClient&, const String&) { return true; }
  bool begin(WiFiClientSecure&, const String&) { return true; }
  int POST(const String&) { return -1; }
  int GET() { return -1; }
  String getString() { return ""; }
  void addHeader(const String&, const String&, bool = false, bool = true) {}
  void setTimeout(uint32_t) {}
  void end() {}
  String errorToString(int code) { return String("error:") + String(code); }
};
