#include <Arduino.h>
#include <unity.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <http_helper.h>

namespace
{
    bool g_begin_called = false;

    wl_status_t status_connected()
    {
        return WL_CONNECTED;
    }

    IPAddress ip_stub()
    {
        return IPAddress(192, 168, 1, 50);
    }

    bool begin_stub(HTTPClient &, WiFiClientSecure &, const String &)
    {
        g_begin_called = true;
        return true;
    }

    void force_wifi_off()
    {
        WiFi.disconnect(true);
        WiFi.mode(WIFI_OFF);
        delay(50);
    }

    void test_ensure_wifi_connected_false_when_off()
    {
        force_wifi_off();
        const bool ok = HttpHelper::ensureWifiConnected(F("[Test]"));
        TEST_ASSERT_FALSE(ok);
    }

    void test_ensure_wifi_connected_true_when_stubbed()
    {
        HttpHelper::setTestHooks(status_connected, ip_stub, nullptr);
        const bool ok = HttpHelper::ensureWifiConnected(F("[Test]"));
        TEST_ASSERT_TRUE(ok);
        HttpHelper::resetTestHooks();
    }

    void test_begin_https_fails_for_empty_url()
    {
        WiFiClientSecure client;
        HTTPClient https;
        const bool ok = HttpHelper::beginHttps(https, client, "", F("[Test]"));
        TEST_ASSERT_FALSE(ok);
        https.end();
    }

    void test_begin_https_uses_stubbed_begin()
    {
        HttpHelper::setTestHooks(nullptr, nullptr, begin_stub);
        g_begin_called = false;
        WiFiClientSecure client;
        HTTPClient https;
        const bool ok = HttpHelper::beginHttps(https, client, "https://example.com", F("[Test]"));
        TEST_ASSERT_TRUE(ok);
        TEST_ASSERT_TRUE(g_begin_called);
        HttpHelper::resetTestHooks();
    }

    void test_log_http_error_no_crash()
    {
        HTTPClient https;
        HttpHelper::logHttpError(https, -1, F("[Test]"));
        TEST_PASS();
    }
}

int main(int, char **)
{
    UNITY_BEGIN();
    RUN_TEST(test_ensure_wifi_connected_false_when_off);
    RUN_TEST(test_ensure_wifi_connected_true_when_stubbed);
    RUN_TEST(test_begin_https_fails_for_empty_url);
    RUN_TEST(test_begin_https_uses_stubbed_begin);
    RUN_TEST(test_log_http_error_no_crash);
    return UNITY_END();
}
