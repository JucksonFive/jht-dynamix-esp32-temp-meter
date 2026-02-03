#include <Arduino.h>
#include <unity.h>
#include <LittleFS.h>
#include <offline_sync_helper.h>

namespace
{
    constexpr const char *QUEUE_PATH = "/offline_queue.test.json";

    void ensure_fs()
    {
        TEST_ASSERT_TRUE(LittleFS.begin(true));
    }

    bool send_ok(const char *, const char *)
    {
        return true;
    }

    bool send_fail(const char *, const char *)
    {
        return false;
    }

    void test_begin_creates_queue()
    {
        ensure_fs();
        LittleFS.remove(QUEUE_PATH);

        OfflineSyncHelper offline;
        TEST_ASSERT_TRUE(offline.begin());
        TEST_ASSERT_TRUE(LittleFS.exists(QUEUE_PATH));
    }

    void test_has_pending_events_false_when_queue_missing()
    {
        ensure_fs();
        LittleFS.remove(QUEUE_PATH);

        OfflineSyncHelper offline;
        TEST_ASSERT_FALSE(offline.hasPendingEvents());
        TEST_ASSERT_EQUAL_UINT32(0, offline.getPendingCount());
    }

    void test_queue_and_count()
    {
        ensure_fs();
        LittleFS.remove(QUEUE_PATH);

        OfflineSyncHelper offline;
        TEST_ASSERT_TRUE(offline.begin());
        TEST_ASSERT_TRUE(offline.queueEvent("topic", "payload", 123));
        TEST_ASSERT_TRUE(offline.hasPendingEvents());
        TEST_ASSERT_EQUAL_UINT32(1, offline.getPendingCount());
    }

    void test_sync_clears_on_success()
    {
        ensure_fs();
        LittleFS.remove(QUEUE_PATH);

        OfflineSyncHelper offline;
        TEST_ASSERT_TRUE(offline.begin());
        TEST_ASSERT_TRUE(offline.queueEvent("t1", "p1", 1));
        TEST_ASSERT_TRUE(offline.queueEvent("t2", "p2", 2));

        TEST_ASSERT_TRUE(offline.syncPendingEvents(send_ok));
        TEST_ASSERT_FALSE(offline.hasPendingEvents());
        TEST_ASSERT_EQUAL_UINT32(0, offline.getPendingCount());
    }

    void test_sync_retains_on_failure()
    {
        ensure_fs();
        LittleFS.remove(QUEUE_PATH);

        OfflineSyncHelper offline;
        TEST_ASSERT_TRUE(offline.begin());
        TEST_ASSERT_TRUE(offline.queueEvent("t1", "p1", 1));
        TEST_ASSERT_TRUE(offline.queueEvent("t2", "p2", 2));

        TEST_ASSERT_TRUE(offline.syncPendingEvents(send_fail));
        TEST_ASSERT_TRUE(offline.hasPendingEvents());
        TEST_ASSERT_EQUAL_UINT32(2, offline.getPendingCount());
    }
}

int main(int, char **)
{
    UNITY_BEGIN();
    RUN_TEST(test_begin_creates_queue);
    RUN_TEST(test_has_pending_events_false_when_queue_missing);
    RUN_TEST(test_queue_and_count);
    RUN_TEST(test_sync_clears_on_success);
    RUN_TEST(test_sync_retains_on_failure);
    return UNITY_END();
}
