#include <Arduino.h>
#include <unity.h>
#include <WiFi.h>
#include <auth_helper.h>

extern String buildPayload(const String &username, const String &password);

namespace
{
    void force_wifi_off()
    {
        WiFi.disconnect(true);
        WiFi.mode(WIFI_OFF);
        delay(50);
    }

    void test_build_payload()
    {
        const String payload = buildPayload("alice", "secret");
        TEST_ASSERT_EQUAL_STRING("{\"username\":\"alice\",\"password\":\"secret\"}", payload.c_str());
    }

    void test_authenticate_user_fails_without_wifi()
    {
        force_wifi_off();
        const bool ok = AuthHelper::authenticateUser("user", "pass");
        TEST_ASSERT_FALSE(ok);
    }
}

int main(int, char **)
{
    UNITY_BEGIN();
    RUN_TEST(test_build_payload);
    RUN_TEST(test_authenticate_user_fails_without_wifi);
    return UNITY_END();
}
