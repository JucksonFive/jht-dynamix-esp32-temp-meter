#include <Arduino.h>
#include <unity.h>
#include <ArduinoJson.h>
#include <LittleFS.h>
#include <storage_helper.h>

namespace
{
    void ensure_fs()
    {
        TEST_ASSERT_TRUE(LittleFS.begin(true));
    }

    void test_build_payload_success()
    {
        char out[256];
        const char *timestamp = "2025-01-02T03:04:05+00:00";
        const String deviceId = "device-123";
        const String userId = "user-456";
        const float temperature = 21.5f;
        const float humidity = 60.25f;

        const bool ok = StorageHelper::buildPayload(out, sizeof(out), deviceId, temperature, humidity, timestamp, userId);
        TEST_ASSERT_TRUE(ok);

        JsonDocument doc;
        DeserializationError err = deserializeJson(doc, out);
        TEST_ASSERT_FALSE(err);

        TEST_ASSERT_EQUAL_STRING(deviceId.c_str(), doc["deviceId"]);
        TEST_ASSERT_FLOAT_WITHIN(0.001f, temperature, doc["temperature"].as<float>());
        TEST_ASSERT_FLOAT_WITHIN(0.001f, humidity, doc["humidity"].as<float>());
        TEST_ASSERT_EQUAL_STRING(timestamp, doc["timestamp"]);
        TEST_ASSERT_EQUAL_STRING(userId.c_str(), doc["userId"]);
    }

    void test_build_payload_small_buffer_fails()
    {
        char out[8];
        const bool ok = StorageHelper::buildPayload(out, sizeof(out),
                                                   "d", 1.0f, 2.0f,
                                                   "2025-01-02T03:04:05+00:00",
                                                   "u");
        TEST_ASSERT_FALSE(ok);
    }

    void test_save_and_get_config_value()
    {
        ensure_fs();
        const char *path = "/config_test.json";
        LittleFS.remove(path);

        TEST_ASSERT_TRUE(StorageHelper::saveJsonValue(path, "alpha", "beta"));
        const String value = StorageHelper::getConfigValue(path, "alpha");
        TEST_ASSERT_EQUAL_STRING("beta", value.c_str());
    }

    void test_get_config_value_missing_key()
    {
        ensure_fs();
        const char *path = "/config_missing_key.json";
        LittleFS.remove(path);

        TEST_ASSERT_TRUE(StorageHelper::saveJsonValue(path, "present", "yes"));
        const String value = StorageHelper::getConfigValue(path, "absent");
        TEST_ASSERT_EQUAL_STRING("", value.c_str());
    }

    void test_get_config_value_missing_file()
    {
        ensure_fs();
        const char *path = "/config_missing_file.json";
        LittleFS.remove(path);

        const String value = StorageHelper::getConfigValue(path, "alpha");
        TEST_ASSERT_EQUAL_STRING("", value.c_str());
    }

    void test_save_user_response()
    {
        ensure_fs();
        const char *path = "/user_response_test.json";
        LittleFS.remove(path);

        TEST_ASSERT_TRUE(StorageHelper::saveUserResponse(path, "{\"ok\":true}"));
        File f = LittleFS.open(path, "r");
        TEST_ASSERT_TRUE(f);
        String contents = f.readString();
        f.close();
        TEST_ASSERT_EQUAL_STRING("{\"ok\":true}", contents.c_str());
    }
}

int main(int, char **)
{
    UNITY_BEGIN();
    RUN_TEST(test_build_payload_success);
    RUN_TEST(test_build_payload_small_buffer_fails);
    RUN_TEST(test_save_and_get_config_value);
    RUN_TEST(test_get_config_value_missing_key);
    RUN_TEST(test_get_config_value_missing_file);
    RUN_TEST(test_save_user_response);
    return UNITY_END();
}
