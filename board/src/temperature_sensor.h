#pragma once
#include <OneWire.h>
#include <DallasTemperature.h>

namespace TempSensor
{
    constexpr uint8_t DATA_PIN = 4;
    OneWire oneWire(DATA_PIN);
    DallasTemperature sensor(&oneWire);

    void setup()
    {
        sensor.begin();
    }

    float readCelsius()
    {
        sensor.requestTemperatures();
        return sensor.getTempCByIndex(0);
    }
}
