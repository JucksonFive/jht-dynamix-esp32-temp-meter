#include <Arduino.h>
#include <unity.h>
#include <LittleFS.h>
#include <setup_webserver.h>

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

    void test_is_setup_complete_true_when_files_exist()
    {
        ensure_fs();
        LittleFS.remove(WIFI_PATH);
        LittleFS.remove(DEVICE_PATH);

        write_file(WIFI_PATH);
        write_file(DEVICE_PATH);

        const bool ok = isSetupComplete();
        TEST_ASSERT_TRUE(ok);
    }
}

int main(int, char **)
{
    UNITY_BEGIN();
    RUN_TEST(test_is_setup_complete_true_when_files_exist);
    return UNITY_END();
}
