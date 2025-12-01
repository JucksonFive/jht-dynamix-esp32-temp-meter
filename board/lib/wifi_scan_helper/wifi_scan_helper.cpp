#include "wifi_scan_helper.h"

bool WifiScanHelper::scanInProgress = false;
JsonDocument WifiScanHelper::scanResult;
bool WifiScanHelper::resultReady = false;
unsigned long WifiScanHelper::lastErrorLog = 0;
int WifiScanHelper::errorCount = 0;

void WifiScanHelper::beginScan()
{
    if (scanInProgress)
    {
        Serial.println("[WifiScanHelper] Scan already in progress");
        return;
    }

    Serial.println("[WifiScanHelper] Starting WiFi scan...");
    WiFi.scanNetworks(true); // Async scan
    scanInProgress = true;
    resultReady = false;
    errorCount = 0;
}

void WifiScanHelper::processScanResult()
{
    if (!scanInProgress)
    {
        return;
    }

    static const unsigned long ERROR_LOG_INTERVAL = 5000;
    static const int MAX_RETRIES = 3;

    int16_t status = WiFi.scanComplete();

    if (status == WIFI_SCAN_RUNNING)
    {
        return; // Skannaus kesken
    }

    if (status == WIFI_SCAN_FAILED)
    {
        errorCount++;

        if (millis() - lastErrorLog > ERROR_LOG_INTERVAL)
        {
            Serial.printf("[WifiScanHelper] Scan failed (count: %d)\n", errorCount);
            lastErrorLog = millis();
        }

        if (errorCount >= MAX_RETRIES)
        {
            Serial.println("[WifiScanHelper] Too many failures, giving up");
            WiFi.scanDelete();
            scanInProgress = false;
            errorCount = 0;
            return;
        }

        delay(500);
        WiFi.scanDelete();
        scanInProgress = false;
        return;
    }

    if (status >= 0)
    {
        Serial.printf("[WifiScanHelper] Scan complete, found %d networks\n", status);
        errorCount = 0;

        scanResult.clear();
        JsonArray networks = scanResult["networks"].to<JsonArray>();

        for (int i = 0; i < status; i++)
        {
            JsonObject net = networks.add<JsonObject>();
            net["ssid"] = WiFi.SSID(i);
            net["rssi"] = WiFi.RSSI(i);
            net["channel"] = WiFi.channel(i);
            net["encryption"] = (WiFi.encryptionType(i) == WIFI_AUTH_OPEN) ? "open" : "secured";
        }

        WiFi.scanDelete();
        scanInProgress = false;
        resultReady = true;

        Serial.println("[WifiScanHelper] Results ready");
    }
}

bool WifiScanHelper::hasResult()
{
    return resultReady;
}

String WifiScanHelper::getResultAndClear()
{
    if (!resultReady)
    {
        return "{}";
    }

    String result;
    serializeJson(scanResult, result);

    scanResult.clear();
    resultReady = false;

    return result;
}
