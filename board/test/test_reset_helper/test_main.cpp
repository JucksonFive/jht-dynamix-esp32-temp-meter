#include <Arduino.h>
#include <unity.h>
#include <LittleFS.h>
#include <reset_helper.h>

namespace
{
    constexpr const char *WIFI_PATH = "/wifi.test.json";
    constexpr const char *DEVICE_PATH = "/device.test.json";

    void ensure_fs()
    {
        TEST_ASSERT_TRUE(LittleFS.begin(true));
    }

    void write_file(const char *path)
    {
        File f = LittleFS.open(path, "w");
        TEST_ASSERT_TRUE(f);
        f.print("{}");
        f.close();
    }

    void test_perform_factory_reset_removes_files()
    {
        ensure_fs();
        LittleFS.remove(WIFI_PATH);
        LittleFS.remove(DEVICE_PATH);

        write_file(WIFI_PATH);
        write_file(DEVICE_PATH);

        TEST_ASSERT_TRUE(ResetHelper::performFactoryReset());
        TEST_ASSERT_FALSE(LittleFS.exists(WIFI_PATH));
        TEST_ASSERT_FALSE(LittleFS.exists(DEVICE_PATH));
    }

    void test_perform_factory_reset_returns_false_when_nothing_to_delete()
    {
        ensure_fs();
        LittleFS.remove(WIFI_PATH);
        LittleFS.remove(DEVICE_PATH);

        TEST_ASSERT_FALSE(ResetHelper::performFactoryReset());
        TEST_ASSERT_FALSE(LittleFS.exists(WIFI_PATH));
        TEST_ASSERT_FALSE(LittleFS.exists(DEVICE_PATH));
    }
}

int main(int, char **)
{
    UNITY_BEGIN();
    RUN_TEST(test_perform_factory_reset_removes_files);
    RUN_TEST(test_perform_factory_reset_returns_false_when_nothing_to_delete);
    return UNITY_END();
}
