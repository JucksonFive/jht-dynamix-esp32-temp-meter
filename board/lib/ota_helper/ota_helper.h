#ifndef OTA_HELPER_H
#define OTA_HELPER_H

#include <ArduinoOTA.h>

namespace OTAHelper
{
    void setup(const char *hostname, const char *password = nullptr);
    void handle();
}

#endif
