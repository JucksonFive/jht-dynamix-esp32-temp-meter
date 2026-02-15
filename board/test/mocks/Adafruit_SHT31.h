#pragma once
#include "Arduino.h"

class Adafruit_SHT31
{
 public:
  bool begin(uint8_t = 0x44) { return true; }
  float readTemperature() { return 25.0f; }
  float readHumidity() { return 50.0f; }
  void heater(bool) {}
};
