#include <unity.h>
void test_truthy() { TEST_ASSERT_TRUE(true); }
int main(int, char **)
{
    UNITY_BEGIN();
    RUN_TEST(test_truthy);
    return UNITY_END();
}
