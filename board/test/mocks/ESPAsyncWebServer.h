#pragma once
#include <functional>
#include "Arduino.h"
#include "FS.h"

#define HTTP_GET 0
#define HTTP_POST 1
#define HTTP_PUT 2
#define HTTP_DELETE 3

class AsyncWebParameter
{
  String _value;

 public:
  AsyncWebParameter() = default;
  String value() const { return _value; }
};

class AsyncWebServerRequest
{
 public:
  void send(int, const String& = "", const String& = "") {}
  void send(int, const char*, const String&) {}
  void send(MockFileSystem&, const String&, const String&) {}
  void redirect(const String&) {}
  bool hasParam(const String&, bool = false) { return false; }
  AsyncWebParameter* getParam(const String&, bool = false) { return nullptr; }
  String host() { return "localhost"; }
};

typedef std::function<void(AsyncWebServerRequest*)> ArRequestHandlerFunction;

class AsyncWebServer
{
 public:
  AsyncWebServer(uint16_t) {}
  void on(const char*, int, ArRequestHandlerFunction) {}
  void onNotFound(ArRequestHandlerFunction) {}
  void begin() {}
};
