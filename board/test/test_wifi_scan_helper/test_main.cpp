#include <Arduino.h>
#include <unity.h>
#include <ArduinoJson.h>
#include <wifi_scan_helper.h>

namespace
{
    int16_t g_scan_status = WIFI_SCAN_RUNNING;
    int g_scan_delete_calls = 0;

    int stub_scan_networks(bool)
    {
        return 0;
    }

    int16_t stub_scan_complete()
    {
        return g_scan_status;
    }

    String stub_ssid(uint8_t index)
    {
        return index == 0 ? "Net-1" : "Net-2";
    }

    int32_t stub_rssi(uint8_t index)
    {
        return index == 0 ? -40 : -80;
    }

    int32_t stub_channel(uint8_t index)
    {
        return index == 0 ? 1 : 6;
    }

    wifi_auth_mode_t stub_encryption(uint8_t index)
    {
        return index == 0 ? WIFI_AUTH_OPEN : WIFI_AUTH_WPA2_PSK;
    }

    void stub_scan_delete()
    {
        g_scan_delete_calls++;
    }

    void install_stub_api()
    {
        WifiScanHelper::WifiScanApi api{};
        api.scanNetworks = stub_scan_networks;
        api.scanComplete = stub_scan_complete;
        api.ssid = stub_ssid;
        api.rssi = stub_rssi;
        api.channel = stub_channel;
        api.encryptionType = stub_encryption;
        api.scanDelete = stub_scan_delete;
        WifiScanHelper::setTestApi(api);
    }

    void test_scan_result_empty_when_not_ready()
    {
        WifiScanHelper::cancelScan();
        TEST_ASSERT_FALSE(WifiScanHelper::hasResult());
        const String result = WifiScanHelper::getResultAndClear();
        TEST_ASSERT_EQUAL_STRING("{}", result.c_str());
    }

    void test_cancel_scan_clears_state()
    {
        WifiScanHelper::beginScan();
        WifiScanHelper::cancelScan();
        TEST_ASSERT_FALSE(WifiScanHelper::hasResult());
    }

    void test_process_scan_result_populates_networks()
    {
        install_stub_api();
        g_scan_status = 2;
        g_scan_delete_calls = 0;

        WifiScanHelper::beginScan();
        WifiScanHelper::processScanResult();

        TEST_ASSERT_TRUE(WifiScanHelper::hasResult());
        const String result = WifiScanHelper::getResultAndClear();
        TEST_ASSERT_FALSE(WifiScanHelper::hasResult());
        TEST_ASSERT_EQUAL_INT(1, g_scan_delete_calls);

        JsonDocument doc;
        DeserializationError err = deserializeJson(doc, result);
        TEST_ASSERT_FALSE(err);

        JsonArray networks = doc["networks"].as<JsonArray>();
        TEST_ASSERT_EQUAL_UINT32(2, networks.size());
        TEST_ASSERT_EQUAL_STRING("Net-1", networks[0]["ssid"]);
        TEST_ASSERT_EQUAL_INT(-40, networks[0]["rssi"]);
        TEST_ASSERT_EQUAL_INT(1, networks[0]["channel"]);
        TEST_ASSERT_EQUAL_STRING("open", networks[0]["encryption"]);
        TEST_ASSERT_EQUAL_STRING("Net-2", networks[1]["ssid"]);
        TEST_ASSERT_EQUAL_INT(-80, networks[1]["rssi"]);
        TEST_ASSERT_EQUAL_INT(6, networks[1]["channel"]);
        TEST_ASSERT_EQUAL_STRING("secured", networks[1]["encryption"]);

        WifiScanHelper::resetTestApi();
    }

    void test_process_scan_result_failed_scan_no_result()
    {
        install_stub_api();
        g_scan_status = WIFI_SCAN_FAILED;
        g_scan_delete_calls = 0;

        WifiScanHelper::beginScan();
        WifiScanHelper::processScanResult();

        TEST_ASSERT_FALSE(WifiScanHelper::hasResult());
        TEST_ASSERT_EQUAL_INT(1, g_scan_delete_calls);

        WifiScanHelper::resetTestApi();
    }
}

int main(int, char **)
{
    UNITY_BEGIN();
    RUN_TEST(test_scan_result_empty_when_not_ready);
    RUN_TEST(test_cancel_scan_clears_state);
    RUN_TEST(test_process_scan_result_populates_networks);
    RUN_TEST(test_process_scan_result_failed_scan_no_result);
    return UNITY_END();
}
