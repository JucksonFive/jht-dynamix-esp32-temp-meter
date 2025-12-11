#include <HardwareSerial.h>
#include <LittleFS.h>
#include "common_helper.h"

bool CommonHelper::initLittleFS()
{
    if (!LittleFS.begin(true))
    {
        Serial.println("LittleFS mount/format failed!");
        return false;
    }
    Serial.println("LittleFS mounted");
    return true;
}