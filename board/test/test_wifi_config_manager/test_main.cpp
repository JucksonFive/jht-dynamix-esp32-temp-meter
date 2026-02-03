#include <Arduino.h>
#include <unity.h>
#include <LittleFS.h>
#include <wifi_config_manager.h>

namespace
{
    void ensure_fs()
    {
        TEST_ASSERT_TRUE(LittleFS.begin(true));
    }

    void test_credentials_exist_false_when_missing()
    {
        ensure_fs();
        LittleFS.remove(wifi_config_manager::CONFIG_PATH);
        TEST_ASSERT_FALSE(wifi_config_manager::credentialsExist());
    }

    void test_write_and_read_credentials()
    {
        ensure_fs();
        LittleFS.remove(wifi_config_manager::CONFIG_PATH);

        WifiCredentials creds;
        creds.ssid = "TestSSID";
        creds.password = "TestPass";

        TEST_ASSERT_TRUE(wifi_config_manager::writeCredentials(creds));
        TEST_ASSERT_TRUE(wifi_config_manager::credentialsExist());

        WifiCredentials loaded;
        TEST_ASSERT_TRUE(wifi_config_manager::readCredentials(loaded));
        TEST_ASSERT_EQUAL_STRING("TestSSID", loaded.ssid.c_str());
        TEST_ASSERT_EQUAL_STRING("TestPass", loaded.password.c_str());
    }
}

int main(int, char **)
{
    UNITY_BEGIN();
    RUN_TEST(test_credentials_exist_false_when_missing);
    RUN_TEST(test_write_and_read_credentials);
    return UNITY_END();
}
