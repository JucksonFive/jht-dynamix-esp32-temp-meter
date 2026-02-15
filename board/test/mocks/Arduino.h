#pragma once

// ---- System includes ----
#include <time.h>
#include <cmath>
#include <cstdarg>
#include <cstddef>
#include <cstdint>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <string>
#include <utility>

// ---- Arduino types ----
using byte = uint8_t;

// ---- FlashStringHelper (F-macro) ----
class __FlashStringHelper;
#define F(string_literal) (reinterpret_cast<const __FlashStringHelper*>(string_literal))
#define FPSTR(pstr_pointer) (reinterpret_cast<const __FlashStringHelper*>(pstr_pointer))

// ---- PROGMEM stubs ----
#define PROGMEM
#define PSTR(s) (s)
#define pgm_read_byte(addr) (*(const unsigned char*)(addr))
#define pgm_read_word(addr) (*(const unsigned short*)(addr))
#define pgm_read_dword(addr) (*(const unsigned long*)(addr))
#define pgm_read_float(addr) (*(const float*)(addr))
#define pgm_read_ptr(addr) (*(const void* const*)(addr))

// ---- Arduino String ----
class String
{
  std::string _buf;

 public:
  String() = default;
  String(const char* s) : _buf(s ? s : "") {}
  String(const String& s) = default;
  String(String&& s) = default;
  String(const __FlashStringHelper* f) : _buf(reinterpret_cast<const char*>(f)) {}
  String(int v) : _buf(std::to_string(v)) {}
  String(unsigned int v) : _buf(std::to_string(v)) {}
  String(long v) : _buf(std::to_string(v)) {}
  String(unsigned long v) : _buf(std::to_string(v)) {}
  String(float v, unsigned int dp = 2)
  {
    char b[64];
    snprintf(b, sizeof(b), "%.*f", dp, static_cast<double>(v));
    _buf = b;
  }
  String(double v, unsigned int dp = 2)
  {
    char b[64];
    snprintf(b, sizeof(b), "%.*f", dp, v);
    _buf = b;
  }
  String(std::nullptr_t) : _buf() {}

  String& operator=(const String&) = default;
  String& operator=(String&&) = default;
  String& operator=(const char* s)
  {
    _buf = s ? s : "";
    return *this;
  }
  String& operator=(std::nullptr_t)
  {
    _buf.clear();
    return *this;
  }

  const char* c_str() const { return _buf.c_str(); }
  unsigned int length() const { return static_cast<unsigned int>(_buf.length()); }
  bool isEmpty() const { return _buf.empty(); }
  void reserve(unsigned int n) { _buf.reserve(n); }
  int toInt() const { return std::atoi(_buf.c_str()); }
  float toFloat() const { return static_cast<float>(std::atof(_buf.c_str())); }

  String& operator+=(const String& rhs)
  {
    _buf += rhs._buf;
    return *this;
  }
  String& operator+=(const char* rhs)
  {
    if (rhs)
      _buf += rhs;
    return *this;
  }
  String& operator+=(char c)
  {
    _buf += c;
    return *this;
  }
  String& operator+=(const __FlashStringHelper* f)
  {
    _buf += reinterpret_cast<const char*>(f);
    return *this;
  }

  char operator[](unsigned int i) const { return _buf[i]; }

  friend String operator+(const String& a, const String& b)
  {
    String r;
    r._buf = a._buf + b._buf;
    return r;
  }
  friend String operator+(const String& a, const char* b)
  {
    String r;
    r._buf = a._buf + (b ? b : "");
    return r;
  }
  friend String operator+(const char* a, const String& b)
  {
    String r;
    r._buf = (a ? a : "") + b._buf;
    return r;
  }

  bool operator==(const String& o) const { return _buf == o._buf; }
  bool operator==(const char* s) const { return _buf == (s ? s : ""); }
  bool operator!=(const String& o) const { return _buf != o._buf; }
  bool operator!=(const char* s) const { return _buf != (s ? s : ""); }

  // ArduinoJson Writer<String> needs concat()
  bool concat(const char* cstr)
  {
    if (cstr)
      _buf += cstr;
    return true;
  }
  bool concat(const String& str)
  {
    _buf += str._buf;
    return true;
  }
  bool concat(char c)
  {
    _buf += c;
    return true;
  }
};

// ---- IPAddress (declared before HardwareSerial so Serial can accept it) ----
class IPAddress
{
  uint8_t _addr[4] = {};

 public:
  IPAddress() = default;
  IPAddress(uint8_t a, uint8_t b, uint8_t c, uint8_t d)
  {
    _addr[0] = a;
    _addr[1] = b;
    _addr[2] = c;
    _addr[3] = d;
  }
  String toString() const { return "0.0.0.0"; }
  uint8_t operator[](int i) const { return _addr[i]; }
};

// ---- Print / Stream ----
#include "Print.h"
#include "Stream.h"

// ---- HardwareSerial (Serial) ----
class HardwareSerial
{
 public:
  void begin(unsigned long) {}
  size_t print(const char*) { return 0; }
  size_t print(const String&) { return 0; }
  size_t print(const __FlashStringHelper*) { return 0; }
  size_t print(int) { return 0; }
  size_t print(float) { return 0; }
  size_t println() { return 0; }
  size_t println(const char*) { return 0; }
  size_t println(const String&) { return 0; }
  size_t println(const __FlashStringHelper*) { return 0; }
  size_t println(const IPAddress&) { return 0; }
  size_t println(int) { return 0; }
  size_t printf(const char*, ...) { return 0; }
};
inline HardwareSerial Serial;

// ---- Timing ----
inline unsigned long _mock_millis_val = 0;
inline unsigned long millis()
{
  return _mock_millis_val;
}
inline void delay(unsigned long) {}
inline void yield() {}

// ---- GPIO stubs ----
#define INPUT 0x01
#define OUTPUT 0x03
#define INPUT_PULLUP 0x05
#define LOW 0
#define HIGH 1
#define CHANGE 3
inline void pinMode(uint8_t, uint8_t) {}
inline void digitalWrite(uint8_t, uint8_t) {}
inline int digitalRead(uint8_t)
{
  return HIGH;
}
inline void attachInterrupt(uint8_t, void (*)(), int) {}
inline uint8_t digitalPinToInterrupt(uint8_t pin)
{
  return pin;
}

// ---- IRAM ----
#define IRAM_ATTR

// ---- ESP ----
struct EspClass
{
  void restart() {}
};
inline EspClass ESP;

// ---- FreeRTOS stubs ----
typedef void* TaskHandle_t;
typedef void (*TaskFunction_t)(void*);
#define pdMS_TO_TICKS(ms) (ms)
inline void xTaskCreate(void (*)(void*), const char*, uint32_t, void*, uint32_t, TaskHandle_t*) {}
inline void xTaskCreatePinnedToCore(void (*)(void*), const char*, uint32_t, void*, uint32_t, TaskHandle_t*, int) {}
inline void vTaskDelay(uint32_t) {}
inline void vTaskDelete(TaskHandle_t) {}

// ---- NTP / time stubs ----
inline void configTime(long, int, const char*, const char* = nullptr) {}
inline bool getLocalTime(struct tm* info, uint32_t = 5000)
{
  time_t now = time(nullptr);
  localtime_r(&now, info);
  return true;
}
