#include <Arduino.h>
#include <unity.h>
#include <mqtt_helper.h>

namespace
{
    void test_is_connected_false_by_default()
    {
        TEST_ASSERT_FALSE(MQTT::isConnected());
    }

    void test_send_mqtt_message_false_when_disconnected()
    {
        const bool ok = MQTT::sendMqttMessage("topic", "payload");
        TEST_ASSERT_FALSE(ok);
    }

    void test_maintain_connection_no_crash()
    {
        MQTT::maintainMqttConnection("client-test");
        TEST_PASS();
    }
}

int main(int, char **)
{
    UNITY_BEGIN();
    RUN_TEST(test_is_connected_false_by_default);
    RUN_TEST(test_send_mqtt_message_false_when_disconnected);
    RUN_TEST(test_maintain_connection_no_crash);
    return UNITY_END();
}
