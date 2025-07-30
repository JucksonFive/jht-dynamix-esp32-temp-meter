#include "wifi_scan_helper.h"
#include <WiFi.h>

namespace
{
    String scanResult;
    bool resultReady = false;
}

namespace WifiScanHelper
{

    void beginScan()
    {
        Serial.println("[WifiScanHelper] Starting WiFi scan...");
        WiFi.scanDelete();
        WiFi.scanNetworks(true); // async
        resultReady = false;
    }

    void processScanResult()
    {
        int scanStatus = WiFi.scanComplete();
        Serial.printf("[WifiScanHelper] Scan status: %d\n", scanStatus);
        if (scanStatus >= 0)
        {
            int n = WiFi.scanComplete();
            Serial.printf("[WifiScanHelper] Found %d networks\n", n);
            String json = "{\"networks\":[";
            for (int i = 0; i < n; ++i)
            {
                Serial.printf("[WifiScanHelper] SSID %d: %s\n", i, WiFi.SSID(i).c_str());
                json += "{\"ssid\":\"" + WiFi.SSID(i) + "\"}";
                if (i < n - 1)
                    json += ",";
            }
            json += "]}";
            scanResult = json;
            resultReady = true;
            WiFi.scanDelete();
            Serial.println("[WifiScanHelper] Scan result ready.");
        }
    }

    bool hasResult()
    {
        Serial.printf("[WifiScanHelper] hasResult: %d\n", resultReady);
        return resultReady;
    }

    String getResultAndClear()
    {
        Serial.println("[WifiScanHelper] Returning scan result and clearing flag.");
        resultReady = false;
        return scanResult;
    }
}
