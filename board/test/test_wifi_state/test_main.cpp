#include <Arduino.h>
#include <unity.h>
#include <wifi_state.h>

namespace
{
    void test_default_wifi_state_idle()
    {
        TEST_ASSERT_EQUAL_INT(static_cast<int>(WifiState::Idle), static_cast<int>(wifiState));
    }
}

int main(int, char **)
{
    UNITY_BEGIN();
    RUN_TEST(test_default_wifi_state_idle);
    return UNITY_END();
}
