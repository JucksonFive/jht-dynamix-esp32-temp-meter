#ifndef WIFI_SCAN_HELPER_H
#define WIFI_SCAN_HELPER_H

#include <Arduino.h>
#include <WiFi.h>
#include <ArduinoJson.h>

class WifiScanHelper
{
private:
    static bool scanInProgress;
    static JsonDocument scanResult;
    static bool resultReady;
    static unsigned long lastErrorLog;
    static int errorCount;

public:
    static void beginScan();
    static void processScanResult();
    static bool hasResult();
    static String getResultAndClear();
    static void cancelScan();

#if defined(UNIT_TEST) || defined(PIO_UNIT_TESTING)
    struct WifiScanApi
    {
        int (*scanNetworks)(bool async);
        int16_t (*scanComplete)();
        String (*ssid)(uint8_t index);
        int32_t (*rssi)(uint8_t index);
        int32_t (*channel)(uint8_t index);
        wifi_auth_mode_t (*encryptionType)(uint8_t index);
        void (*scanDelete)();
    };

    static void setTestApi(const WifiScanApi &api);
    static void resetTestApi();
#endif
};

#endif
