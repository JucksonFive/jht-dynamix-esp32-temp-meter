#include <Arduino.h>
#include <unity.h>
#include <WiFi.h>
#include <device_helper.h>

namespace
{
    void force_wifi_off()
    {
        WiFi.disconnect(true);
        WiFi.mode(WIFI_OFF);
        delay(50);
    }

    void test_register_device_rejects_empty_id()
    {
        TEST_ASSERT_FALSE(DeviceHelper::registerDevice(""));
    }

    void test_register_device_fails_without_wifi()
    {
        force_wifi_off();
        const bool ok = DeviceHelper::registerDevice("device-1");
        TEST_ASSERT_FALSE(ok);
    }
}

int main(int, char **)
{
    UNITY_BEGIN();
    RUN_TEST(test_register_device_rejects_empty_id);
    RUN_TEST(test_register_device_fails_without_wifi);
    return UNITY_END();
}
