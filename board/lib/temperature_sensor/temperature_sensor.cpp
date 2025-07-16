#include "temperature_sensor.h"
#include <OneWire.h>
#include <DallasTemperature.h>


constexpr uint8_t DATA_PIN = 4;
OneWire oneWire(DATA_PIN);
DallasTemperature sensor(&oneWire);

void TempSensor::setup()
{
    sensor.begin();
}

float TempSensor::readCelsius()
{
    sensor.requestTemperatures();
    return sensor.getTempCByIndex(0);
}
