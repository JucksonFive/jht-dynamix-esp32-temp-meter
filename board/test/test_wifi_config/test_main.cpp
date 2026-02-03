#include <Arduino.h>
#include <unity.h>
#include <LittleFS.h>
#include <wifi_config.h>
#include <wifi_config_manager.h>

namespace
{
    void ensure_fs()
    {
        TEST_ASSERT_TRUE(LittleFS.begin(true));
    }

    void test_wifi_credentials_wrappers()
    {
        ensure_fs();
        LittleFS.remove(wifi_config_manager::CONFIG_PATH);

        TEST_ASSERT_FALSE(wifiCredentialsExist());
        TEST_ASSERT_TRUE(saveWifiCredentials("WrapperSSID", "WrapperPass"));
        TEST_ASSERT_TRUE(wifiCredentialsExist());

        WifiCredentials loaded;
        TEST_ASSERT_TRUE(loadWifiCredentials(loaded));
        TEST_ASSERT_EQUAL_STRING("WrapperSSID", loaded.ssid.c_str());
        TEST_ASSERT_EQUAL_STRING("WrapperPass", loaded.password.c_str());
    }
}

int main(int, char **)
{
    UNITY_BEGIN();
    RUN_TEST(test_wifi_credentials_wrappers);
    return UNITY_END();
}
