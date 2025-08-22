#include "reset_helper.h"
#include <LittleFS.h>
#include <time_helper.h>

namespace
{
    uint8_t g_pin = 0;
    unsigned long g_longPressMs = 3000;
    bool g_shortPressRestart = false;
    volatile bool g_pressed = false;         // current physical state (active LOW)
    volatile unsigned long g_pressStart = 0; // millis at press
    volatile bool g_releasedEvent = false;   // edge flag for release handling
    volatile bool g_pressEvent = false;      // edge flag for press handling
    bool g_longActionDone = false;           // ensure single trigger

    void IRAM_ATTR handleInterrupt()
    {
        int level = digitalRead(g_pin);
        if (level == LOW)
        { // pressed
            g_pressed = true;
            g_pressStart = millis();
            g_longActionDone = false;
            g_pressEvent = true;
        }
        else
        { // released
            g_pressed = false;
            g_releasedEvent = true;
        }
    }

    void printStatus(const char *msg)
    {
        Serial.printf("[ResetHelper] %s\n", msg);
    }
}

namespace ResetHelper
{
    void setup(uint8_t pin, unsigned long longPressMs, bool shortPressRestart)
    {
        g_pin = pin;
        g_longPressMs = longPressMs;
        g_shortPressRestart = shortPressRestart;
        pinMode(g_pin, INPUT_PULLUP); // active LOW button
        attachInterrupt(digitalPinToInterrupt(g_pin), handleInterrupt, CHANGE);
        printStatus("Initialized");
    }

    bool performFactoryReset()
    {
        const char *files[] = {"/wifi.json", "/device.json"};
        bool any = false;
        for (auto f : files)
        {
            if (LittleFS.exists(f))
            {
                if (LittleFS.remove(f))
                {
                    Serial.printf("[ResetHelper] Deleted %s\n", f);
                    any = true;
                }
                else
                {
                    Serial.printf("[ResetHelper] FAILED deleting %s\n", f);
                }
            }
        }
        if (!any)
        {
            printStatus("No config files to delete");
        }
        else
        {
            printStatus("Factory reset done");
        }
        TimeHelper::scheduleRestart(1500);
        return any;
    }

    void loop()
    {
        // Long press detection
        if (g_pressed && !g_longActionDone)
        {
            unsigned long held = millis() - g_pressStart;
            if (held >= g_longPressMs)
            {
                g_longActionDone = true;
                printStatus("Long press detected -> factory reset");
                performFactoryReset();
            }
        }

        // Handle short press release
        if (g_releasedEvent)
        {
            g_releasedEvent = false;
            if (!g_longActionDone && g_shortPressRestart)
            {
                unsigned long held = millis() - g_pressStart;
                if (held >= 30)
                { // basic debounce threshold
                    printStatus("Short press -> restart");
                    TimeHelper::scheduleRestart(200);
                }
            }
        }
    }
}
