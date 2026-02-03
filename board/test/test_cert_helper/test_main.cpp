#include <Arduino.h>
#include <unity.h>
#include <LittleFS.h>
#include <WiFiClientSecure.h>
#include <cert_helper.h>

namespace
{
    void test_cert_helpers_no_crash()
    {
        LittleFS.begin(true);
        WiFiClientSecure client;
        CertHelper::attachRootCA(client);
        CertHelper::loadCerts(client);
        TEST_PASS();
    }

    void test_load_certs_no_crash()
    {
        LittleFS.begin(true);
        WiFiClientSecure client;
        CertHelper::loadCerts(client);
        TEST_PASS();
    }
}

int main(int, char **)
{
    UNITY_BEGIN();
    RUN_TEST(test_cert_helpers_no_crash);
    RUN_TEST(test_load_certs_no_crash);
    return UNITY_END();
}
