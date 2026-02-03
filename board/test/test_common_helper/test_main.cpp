#include <Arduino.h>
#include <unity.h>
#include <LittleFS.h>
#include <common_helper.h>

namespace
{
    void test_init_littlefs()
    {
        const bool ok = CommonHelper::initLittleFS();
        TEST_ASSERT_TRUE(ok);
    }
}

int main(int, char **)
{
    UNITY_BEGIN();
    RUN_TEST(test_init_littlefs);
    return UNITY_END();
}
