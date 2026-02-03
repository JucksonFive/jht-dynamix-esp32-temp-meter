#include "wifi_scan_helper.h"

bool WifiScanHelper::scanInProgress = false;
JsonDocument WifiScanHelper::scanResult;
bool WifiScanHelper::resultReady = false;
unsigned long WifiScanHelper::lastErrorLog = 0;
int WifiScanHelper::errorCount = 0;

namespace
{
    int defaultScanNetworks(bool async) { return WiFi.scanNetworks(async); }
    int16_t defaultScanComplete() { return WiFi.scanComplete(); }
    String defaultSsid(uint8_t index) { return WiFi.SSID(index); }
    int32_t defaultRssi(uint8_t index) { return WiFi.RSSI(index); }
    int32_t defaultChannel(uint8_t index) { return WiFi.channel(index); }
    wifi_auth_mode_t defaultEncryptionType(uint8_t index) { return WiFi.encryptionType(index); }
    void defaultScanDelete() { WiFi.scanDelete(); }

    int (*scanNetworksFn)(bool async) = defaultScanNetworks;
    int16_t (*scanCompleteFn)() = defaultScanComplete;
    String (*ssidFn)(uint8_t index) = defaultSsid;
    int32_t (*rssiFn)(uint8_t index) = defaultRssi;
    int32_t (*channelFn)(uint8_t index) = defaultChannel;
    wifi_auth_mode_t (*encryptionTypeFn)(uint8_t index) = defaultEncryptionType;
    void (*scanDeleteFn)() = defaultScanDelete;
}

void WifiScanHelper::beginScan()
{
    if (scanInProgress)
    {
        Serial.println("[WifiScanHelper] Scan already in progress");
        return;
    }

    Serial.println("[WifiScanHelper] Starting WiFi scan...");
    scanNetworksFn(true); // Async scan
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

    int16_t status = scanCompleteFn();

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
            scanDeleteFn();
            scanInProgress = false;
            errorCount = 0;
            return;
        }

        delay(500);
        scanDeleteFn();
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
            net["ssid"] = ssidFn(i);
            net["rssi"] = rssiFn(i);
            net["channel"] = channelFn(i);
            net["encryption"] = (encryptionTypeFn(i) == WIFI_AUTH_OPEN) ? "open" : "secured";
        }

        scanDeleteFn();
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

void WifiScanHelper::cancelScan()
{
    if (!scanInProgress)
    {
        scanDeleteFn();
        resultReady = false;
        scanResult.clear();
        errorCount = 0;
        Serial.println("[WifiScanHelper] Scan cancelled");
        return;
    }
    scanDeleteFn();
    scanInProgress = false;
    resultReady = false;
    scanResult.clear();
    errorCount = 0;
    Serial.println("[WifiScanHelper] Scan cancelled");
}

#if defined(UNIT_TEST) || defined(PIO_UNIT_TESTING)
void WifiScanHelper::setTestApi(const WifiScanApi &api)
{
    scanNetworksFn = api.scanNetworks ? api.scanNetworks : defaultScanNetworks;
    scanCompleteFn = api.scanComplete ? api.scanComplete : defaultScanComplete;
    ssidFn = api.ssid ? api.ssid : defaultSsid;
    rssiFn = api.rssi ? api.rssi : defaultRssi;
    channelFn = api.channel ? api.channel : defaultChannel;
    encryptionTypeFn = api.encryptionType ? api.encryptionType : defaultEncryptionType;
    scanDeleteFn = api.scanDelete ? api.scanDelete : defaultScanDelete;
}

void WifiScanHelper::resetTestApi()
{
    scanNetworksFn = defaultScanNetworks;
    scanCompleteFn = defaultScanComplete;
    ssidFn = defaultSsid;
    rssiFn = defaultRssi;
    channelFn = defaultChannel;
    encryptionTypeFn = defaultEncryptionType;
    scanDeleteFn = defaultScanDelete;
}
#endif
