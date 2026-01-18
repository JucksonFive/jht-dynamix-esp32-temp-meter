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
};

#endif
