#include <Arduino.h>
#include <unity.h>
#include <time_helper.h>
#include <string.h>

namespace
{
    bool is_digit(char c)
    {
        return c >= '0' && c <= '9';
    }

    void test_local_timestamp_format()
    {
        const char *ts = TimeHelper::getLocalTimestamp();
        TEST_ASSERT_NOT_NULL(ts);

        const size_t len = strlen(ts);
        TEST_ASSERT_TRUE(len >= 20);

        TEST_ASSERT_EQUAL_CHAR('T', ts[10]);
        TEST_ASSERT_EQUAL_CHAR(':', ts[13]);
        TEST_ASSERT_EQUAL_CHAR(':', ts[16]);

        const char sign = ts[len - 6];
        TEST_ASSERT_TRUE(sign == '+' || sign == '-');
        TEST_ASSERT_EQUAL_CHAR(':', ts[len - 3]);

        TEST_ASSERT_TRUE(is_digit(ts[len - 5]));
        TEST_ASSERT_TRUE(is_digit(ts[len - 4]));
        TEST_ASSERT_TRUE(is_digit(ts[len - 2]));
        TEST_ASSERT_TRUE(is_digit(ts[len - 1]));
    }

    void test_schedule_restart_no_crash()
    {
        TimeHelper::scheduleRestart(0);
        TimeHelper::scheduleRestart(10);
        TEST_PASS();
    }
}

int main(int, char **)
{
    UNITY_BEGIN();
    RUN_TEST(test_local_timestamp_format);
    RUN_TEST(test_schedule_restart_no_crash);
    return UNITY_END();
}
