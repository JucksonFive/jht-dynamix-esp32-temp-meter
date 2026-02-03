#include <Arduino.h>
#include <unity.h>
#include <LittleFS.h>
#include <storage_helper.h>
#include <offline_sync_helper.h>
#include <temperature_sensor.h>

namespace
{
    constexpr const char *QUEUE_PATH = "/offline_queue.test.json";
    constexpr const char *USER_PATH = "/user.test.json";
    constexpr const char *DEVICE_PATH = "/device.test.json";

    void ensure_fs()
    {
        TEST_ASSERT_TRUE(LittleFS.begin(true));
    }

    void test_publish_temperature_queues_when_offline()
    {
        ensure_fs();
        LittleFS.remove(QUEUE_PATH);
        LittleFS.remove(USER_PATH);
        LittleFS.remove(DEVICE_PATH);

        TEST_ASSERT_TRUE(StorageHelper::saveJsonValue(USER_PATH, "userId", "user-1"));
        TEST_ASSERT_TRUE(StorageHelper::saveJsonValue(DEVICE_PATH, "deviceId", "device-1"));

        OfflineSyncHelper offline;
        TEST_ASSERT_TRUE(offline.begin());
        TEST_ASSERT_EQUAL_UINT32(0, offline.getPendingCount());

        TempSensor::publishTemperature(25.0f, 45.0f, offline, "test/topic", "ignored", "ignored");
        TEST_ASSERT_TRUE(offline.hasPendingEvents());
        TEST_ASSERT_EQUAL_UINT32(1, offline.getPendingCount());
    }
}

int main(int, char **)
{
    UNITY_BEGIN();
    RUN_TEST(test_publish_temperature_queues_when_offline);
    return UNITY_END();
}
