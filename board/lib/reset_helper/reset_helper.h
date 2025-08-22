#pragma once
#include <Arduino.h>

namespace ResetHelper
{
    /**
     * Initialize reset helper.
     * pin: GPIO connected to reset button (active LOW, uses internal pull-up)
     * longPressMs: duration (ms) the button must be held to trigger factory reset
     * shortPressRestart: if true, a short press (< longPressMs) triggers a simple restart
     */
    void setup(uint8_t pin, unsigned long longPressMs = 3000, bool shortPressRestart = false);

    // Call frequently in loop() to process timing (lightweight)
    void loop();

    // Perform factory reset (delete config files) and schedule restart. Returns true if any file deleted.
    bool performFactoryReset();
}
